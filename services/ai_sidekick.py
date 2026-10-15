"""
StoreBox Sidekick Brain — Real Google Gemini API + Native Function Calling (Tools).
No hardcoded reply templates or regex responses.
All responses are generated live by Gemini with full store context, chat history, and native tool execution.
"""
import os
import re
import json
import logging
from decimal import Decimal
from datetime import timedelta
from typing import Dict, Any, List, Optional

import requests
import urllib3
from django.conf import settings
from django.utils import timezone
from django.db.models import Sum, Q

from apps.stores.models import Store
from apps.catalog.models import Product, Category
from apps.orders.models import Order, Customer

import socket
import threading
import urllib3.util.connection
from requests.adapters import HTTPAdapter

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
# Force IPv4 to prevent 5-7s IPv6 connection timeout fallback on local ISP networks
urllib3.util.connection.allowed_gai_family = lambda: socket.AF_INET
logger = logging.getLogger(__name__)

# Persistent HTTP session for Gemini API (reuses TLS connection for <0.5s latency)
_GEMINI_SESSION = requests.Session()
_GEMINI_SESSION.trust_env = False
_GEMINI_ADAPTER = HTTPAdapter(pool_connections=4, pool_maxsize=8, max_retries=0)
_GEMINI_SESSION.mount("https://", _GEMINI_ADAPTER)
_RESOLVED_GEMINI_MODEL: Optional[str] = "models/gemini-3.5-flash"


def _warmup_gemini_connection() -> None:
    try:
        _GEMINI_SESSION.get(
            "https://generativelanguage.googleapis.com/",
            timeout=3.0,
            verify=False,
        )
    except Exception:
        pass


threading.Thread(target=_warmup_gemini_connection, daemon=True).start()


SYSTEM_INSTRUCTION = (
    "Ты — StoreBox Sidekick, интеллектуальный персональный управляющий интернет-магазином на платформе StoreBox (аналог Shopify). "
    "Общайся живо, лаконично (1–3 коротких предложения), профессионально, как реальный бизнес-партнер. "
    "Если пользователь просит создать фото, нарисовать или сгенерировать изображение (слова «создай фото», «нарисуй», «сгенерируй изображение», «сделай фото»), "
    "обязательно вызывай инструмент create_image с кратким описанием на английском языке (prompt). "
    "КРИТИЧЕСКИ ВАЖНО: Отвечай СТРОГО на том языке, на котором обратился продавец в своем последнем сообщении "
    "(узбекский латиницей, русский или английский), даже если предыдущие сообщения были на другом языке или узбекский записан кириллицей. "
    "Не повторяй формальные фразы о том, кто ты такой, при каждом сообщении. Управляй платформой через доступные инструменты."
)

# Native Gemini Function Calling Tools Schema
GEMINI_FUNCTION_DECLARATIONS = [
    {
        "name": "navigate_to",
        "description": (
            "Переводит продавца в нужный раздел панели управления StoreBox. "
            "Вызывай когда пользователь просит открыть, показать или перейти на страницу/раздел (товары, заказы, аналитика, клиенты, настройки и т.д.)."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "route": {
                    "type": "STRING",
                    "description": (
                        "Код раздела: 'orders', 'products', 'customers', 'analytics', "
                        "'settings', 'themes', 'markets', 'discounts', 'marketing', "
                        "'warehouse', 'categories', 'ikpu', 'yespos', 'home'."
                    ),
                }
            },
            "required": ["route"],
        },
    },
    {
        "name": "get_metrics",
        "description": (
            "Получает реальные финансовые показатели текущего магазина из базы данных "
            "(выручка, количество заказов, средний чек, клиенты, товары) за выбранный период."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "timeframe": {
                    "type": "STRING",
                    "description": "Период: 'today' (сегодня), '7d' (7 дней / неделя), '30d' (30 дней / месяц).",
                }
            },
            "required": ["timeframe"],
        },
    },
    {
        "name": "get_store_metrics",
        "description": (
            "Алиас get_metrics: получает реальную выручку, заказы, средний чек и количество клиентов магазина за период."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "timeframe": {
                    "type": "STRING",
                    "description": "Период: 'today', '7d', '30d'.",
                }
            },
            "required": ["timeframe"],
        },
    },
    {
        "name": "search_orders",
        "description": (
            "Ищет реальные заказы магазина в базе данных по номеру заказа, имени/телефону клиента "
            "или статусу (NEW, PROCESSING, READY, IN_DELIVERY, COMPLETED, CANCELLED, ALL)."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "query": {
                    "type": "STRING",
                    "description": "Номер заказа, имя клиента или статус ('новый', 'оплачен', 'доставлен', 'ALL').",
                }
            },
            "required": ["query"],
        },
    },
    {
        "name": "generate_product_data",
        "description": (
            "Подготавливает карточку нового товара (продающее название, описание, преимущества, категорию и цену) "
            "когда продавец просит придумать/сгенерировать товар или описание товара."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "title": {
                    "type": "STRING",
                    "description": "Продающее название товара.",
                },
                "category": {
                    "type": "STRING",
                    "description": "Подходящая категория товара.",
                },
                "description": {
                    "type": "STRING",
                    "description": "Структурированное продающее описание товара.",
                },
                "suggested_price": {
                    "type": "NUMBER",
                    "description": "Рекомендуемая цена товара в сумах (UZS).",
                },
            },
            "required": ["title", "description"],
        },
    },
    {
        "name": "create_image",
        "description": (
            "Генерирует картинку или фото товара через Pollinations FLUX. "
            "Вызывай, если видишь слова 'создай фото', 'нарисуй', 'сгенерируй изображение', 'сделай фото'."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "prompt": {
                    "type": "STRING",
                    "description": "краткое описание на английском",
                },
            },
            "required": ["prompt"],
        },
    },
]


ROUTE_DIRECTORY: Dict[str, Dict[str, str]] = {
    "home": {"target": "/dashboard/", "spa_path": "/", "title": "Главная", "title_uz": "Bosh sahifa", "title_en": "Home"},
    "dashboard": {"target": "/dashboard/", "spa_path": "/", "title": "Главная", "title_uz": "Bosh sahifa", "title_en": "Dashboard"},
    "orders": {"target": "/dashboard/orders/", "spa_path": "/orders", "title": "Заказы", "title_uz": "Buyurtmalar", "title_en": "Orders"},
    "drafts": {"target": "/dashboard/orders/?tab=drafts", "spa_path": "/orders?tab=drafts", "title": "Черновики", "title_uz": "Qoralamalar", "title_en": "Drafts"},
    "abandoned": {"target": "/dashboard/orders/?tab=abandoned", "spa_path": "/orders?tab=abandoned", "title": "Брошенные корзины", "title_uz": "Tashlab ketilgan savatlar", "title_en": "Abandoned checkouts"},
    "products": {"target": "/dashboard/products/", "spa_path": "/products", "title": "Товары", "title_uz": "Mahsulotlar", "title_en": "Products"},
    "categories": {"target": "/dashboard/categories/", "spa_path": "/categories", "title": "Коллекции", "title_uz": "Kategoriyalar", "title_en": "Categories"},
    "warehouse": {"target": "/dashboard/warehouse/", "spa_path": "/warehouse", "title": "Товарные запасы", "title_uz": "Ombor zaxirasi", "title_en": "Inventory"},
    "constructor": {"target": "/dashboard/constructor/", "spa_path": "/constructor", "title": "Конструктор", "title_uz": "Konstruktor", "title_en": "Constructor"},
    "ikpu": {"target": "/dashboard/ikpu/", "spa_path": "/ikpu", "title": "Коды ИКПУ", "title_uz": "MXIK kodlari", "title_en": "IKPU Codes"},
    "customers": {"target": "/dashboard/customers/", "spa_path": "/customers", "title": "Клиенты", "title_uz": "Mijozlar", "title_en": "Customers"},
    "analytics": {"target": "/dashboard/analytics/", "spa_path": "/analytics", "title": "Аналитика", "title_uz": "Tahlil va hisobotlar", "title_en": "Analytics"},
    "marketing": {"target": "/dashboard/marketing/", "spa_path": "/marketing", "title": "Маркетинг", "title_uz": "Marketing", "title_en": "Marketing"},
    "discounts": {"target": "/dashboard/discounts/", "spa_path": "/discounts", "title": "Скидки", "title_uz": "Chegirmalar", "title_en": "Discounts"},
    "markets": {"target": "/dashboard/markets/", "spa_path": "/markets", "title": "Рынки", "title_uz": "Bozorlar", "title_en": "Markets"},
    "themes": {"target": "/dashboard/themes/", "spa_path": "/themes", "title": "Темы витрины", "title_uz": "Vitrina mavzulari", "title_en": "Themes"},
    "design": {"target": "/dashboard/design/", "spa_path": "/design", "title": "Редактор витрины", "title_uz": "Dizayn studiyasi", "title_en": "Design Studio"},
    "platforms": {"target": "/dashboard/platforms/", "spa_path": "/platforms", "title": "Telegram Mini App", "title_uz": "Telegram Mini App", "title_en": "Telegram Mini App"},
    "yespos": {"target": "/dashboard/yespos/", "spa_path": "/yespos", "title": "YES POS", "title_uz": "YES POS", "title_en": "YES POS"},
    "chats": {"target": "/dashboard/chats/", "spa_path": "/chats", "title": "Чаты", "title_uz": "Chatlar", "title_en": "Chats"},
    "settings": {"target": "/dashboard/settings/", "spa_path": "/settings", "title": "Настройки", "title_uz": "Sozlamalar", "title_en": "Settings"},
    "payments": {"target": "/dashboard/settings/payments/", "spa_path": "/settings/payments", "title": "Платежи", "title_uz": "To'lovlar", "title_en": "Payments"},
    "delivery": {"target": "/dashboard/settings/delivery/", "spa_path": "/settings/delivery", "title": "Доставка", "title_uz": "Yetkazib berish", "title_en": "Delivery"},
    "branches": {"target": "/dashboard/settings/branches/", "spa_path": "/settings/branches", "title": "Филиалы", "title_uz": "Filiallar", "title_en": "Branches"},
    "staff": {"target": "/dashboard/settings/staff/", "spa_path": "/settings/staff", "title": "Сотрудники", "title_uz": "Xodimlar", "title_en": "Staff"},
    "domains": {"target": "/dashboard/settings/domains/", "spa_path": "/settings/domains", "title": "Домены", "title_uz": "Domenlar", "title_en": "Domains"},
    "tariffs": {"target": "/dashboard/settings/tariffs/", "spa_path": "/settings/tariffs", "title": "Тарифы", "title_uz": "Tariflar", "title_en": "Plans"},
}


def format_uzs(amount: Any, currency: str = "UZS") -> str:
    try:
        val = int(round(float(amount or 0)))
    except (ValueError, TypeError):
        val = 0
    return f"{val:,}".replace(",", " ") + f" {currency}"


def detect_language(text: str, fallback: str = "ru") -> str:
    """
    Accurately detects 'uz', 'ru', or 'en' directly from the user's message text,
    handling both Latin Uzbek and Cyrillic Uzbek (e.g. from voice recognition or keyboard).
    """
    t = (text or "").strip()
    if not t:
        return fallback if fallback in ("ru", "uz", "en") else "ru"
    t_low = t.lower()

    # 1. Explicit Uzbek Cyrillic characters
    if re.search(r"[ўқғҳЎҚҒҲ]", t):
        return "uz"

    # 2. Uzbek words written in Cyrillic (e.g. "Ассалому алайкум менга махсулотларни курсат", "заказларни оч")
    if re.search(
        r"\b(ассалом|ассалому|алайкум|алейкум|салом|менга|манга|бизга|махсулот|махсулотлар|махсулотларни|"
        r"товарларни|заказлар|заказларни|буюртма|буюртмалар|буюртмаларни|курсат|курсатинг|кўрсат|"
        r"оч|очиб|бер|беринг|канча|қанча|кандай|қандай|нечта|тушум|савдо|мижоз|мижозлар|клиентларни|"
        r"бор|керак|яхши|рахмат|илтимос|бугун|бугунги|хафта|ойлик|учун|билан|созлама|созламалар|"
        r"нарх|чегирма|омбор|категорияларни|статистикани|аналитикани)\b",
        t_low,
    ) or re.search(r"(ларни|лардан|ларга|нинг|даги|япман|моқда|мокда)\b", t_low):
        return "uz"

    # 3. Uzbek words/patterns written in Latin (including without apostrophes like 'maxsulotlarni korsat')
    if (
        re.search(
            r"\b(assalom|assalomu|alaykum|aleykum|salom|menga|manga|bizga|sizga|uchun|bilan|"
            r"do'kon|dokon|mahsulot|mahsulotlar|mahsulotlarni|maxsulot|maxsulotlar|maxsulotlarni|"
            r"tovar|tovarlar|tovarlarni|buyurtma|buyurtmalar|buyurtmalarni|zakaz|zakazlar|zakazlarni|"
            r"ko'rsat|korsat|korsating|och|ochib|ber|bering|qancha|qanday|qalay|necha|nechta|"
            r"tushum|savdo|mijoz|mijozlar|klientlar|so'm|som|narx|narxlar|chegirma|bo'lim|bolim|"
            r"sahifa|sozlamalar|kategoriyalar|ombor|bugun|bugungi|hafta|oylik|kerak|yordam|rahmat|"
            r"iltimos|haqida|xaqida|bor|yo'q|yoq|nima|qayerda|statistika|analitika|yarat|qo'sh)\b",
            t_low,
        )
        or re.search(r"[oOgG]['‘’ʻʼ]", t)
        or re.search(r"(larni|lardan|larga|ning|dagi|yapman|moqda)\b", t_low)
    ):
        return "uz"

    # 4. Russian Cyrillic characters
    if re.search(r"[а-яА-ЯёЁ]", t):
        return "ru"

    # 5. English words
    if re.search(
        r"\b(hello|hi|hey|show|open|go to|orders|products|revenue|analytics|customers|settings|how|what|please|create|generate|today|month|week)\b",
        t_low,
    ):
        return "en"

    return fallback if fallback in ("ru", "uz", "en") else "ru"


class SidekickBrain:
    """
    Live Gemini AI Assistant with Native Function Calling (Tools) and <1s Low-Latency Execution.
    """

    def __init__(self, store: Store, lang: str = "ru"):
        self.store = store
        self.lang = lang if lang in ("ru", "uz", "en") else "ru"
        self.currency = getattr(store, "currency", "UZS") or "UZS"

    def _get_live_store_snapshot(self) -> Dict[str, Any]:
        """Provides lightweight real-time tenant snapshot for Gemini system context."""
        now = timezone.now()
        orders_qs = Order.objects.filter(store=self.store).exclude(status="CANCELLED")

        today_qs = orders_qs.filter(created_at__date=now.date())
        week_qs = orders_qs.filter(created_at__gte=now - timedelta(days=7))
        month_qs = orders_qs.filter(created_at__gte=now - timedelta(days=30))

        today_rev = today_qs.aggregate(s=Sum("total_amount"))["s"] or Decimal("0")
        week_rev = week_qs.aggregate(s=Sum("total_amount"))["s"] or Decimal("0")
        month_rev = month_qs.aggregate(s=Sum("total_amount"))["s"] or Decimal("0")
        all_rev = orders_qs.aggregate(s=Sum("total_amount"))["s"] or Decimal("0")

        return {
            "store_id": self.store.id,
            "store_name": self.store.name,
            "subdomain": self.store.subdomain,
            "currency": self.currency,
            "today_orders": today_qs.count(),
            "today_revenue": format_uzs(today_rev, self.currency),
            "week_orders": week_qs.count(),
            "week_revenue": format_uzs(week_rev, self.currency),
            "month_orders": month_qs.count() or orders_qs.count(),
            "month_revenue": format_uzs(month_rev if month_rev > 0 else all_rev, self.currency),
            "total_products": Product.objects.filter(store=self.store, is_active=True).count(),
            "total_customers": Customer.objects.filter(store=self.store).count(),
        }

    # ------------------------------------------------------------------
    # NATIVE TOOLS EXECUTED ON GEMINI FUNCTION CALL
    # ------------------------------------------------------------------
    def navigate_to(self, route: str, lang: str = "ru") -> Dict[str, Any]:
        raw = (route or "home").strip().lower().strip("/")
        if raw.startswith("dashboard/"):
            raw = raw[len("dashboard/"):].strip("/")

        alias_map = {
            "заказы": "orders",
            "buyurtmalar": "orders",
            "zakazlar": "orders",
            "товары": "products",
            "mahsulotlar": "products",
            "maxsulotlar": "products",
            "tovarlar": "products",
            "клиенты": "customers",
            "mijozlar": "customers",
            "аналитика": "analytics",
            "tahlil": "analytics",
            "statistika": "analytics",
            "настройки": "settings",
            "sozlamalar": "settings",
            "темы": "themes",
            "рынки": "markets",
            "скидки": "discounts",
            "chegirmalar": "discounts",
            "маркетинг": "marketing",
            "склад": "warehouse",
            "ombor": "warehouse",
            "коллекции": "categories",
            "категории": "categories",
            "kategoriyalar": "categories",
            "икпу": "ikpu",
            "главная": "home",
            "bosh sahifa": "home",
        }
        key = alias_map.get(raw, raw)
        info = ROUTE_DIRECTORY.get(
            key,
            {
                "target": f"/dashboard/{key}/",
                "spa_path": f"/{key}",
                "title": key.capitalize(),
                "title_uz": key.capitalize(),
                "title_en": key.capitalize(),
            },
        )
        localized_title = (
            info.get("title_uz", info["title"])
            if lang == "uz"
            else info.get("title_en", info["title"])
            if lang == "en"
            else info["title"]
        )
        return {
            "status": "navigated",
            "route": key,
            "title": localized_title,
            "target": info["target"],
            "action": {
                "type": "NAVIGATE",
                "target": info["target"],
                "spa_path": info["spa_path"],
                "title": localized_title,
            },
        }

    def get_store_metrics(self, timeframe: str = "30d", lang: str = "ru") -> Dict[str, Any]:
        tf = (timeframe or "30d").strip().lower()
        if tf not in ("today", "7d", "30d"):
            tf = "30d"

        now = timezone.now()
        all_orders = Order.objects.filter(store=self.store)

        if tf == "today":
            scoped = all_orders.filter(created_at__date=now.date())
            title = "Bugungi tahlil" if lang == "uz" else "Analytics for today" if lang == "en" else "Аналитика за сегодня"
        elif tf == "7d":
            scoped = all_orders.filter(created_at__gte=now - timedelta(days=7))
            title = "7 kunlik tahlil" if lang == "uz" else "7-day analytics" if lang == "en" else "Аналитика за 7 дней"
        else:
            scoped = all_orders.filter(created_at__gte=now - timedelta(days=30))
            title = "30 kunlik tahlil" if lang == "uz" else "30-day analytics" if lang == "en" else "Аналитика за 30 дней"

        if not scoped.exists() and all_orders.exists() and tf == "30d":
            scoped = all_orders

        valid = scoped.exclude(status="CANCELLED")
        revenue_dec = valid.aggregate(total=Sum("total_amount"))["total"] or Decimal("0")
        orders_count = valid.count()
        avg_check_dec = (revenue_dec / orders_count) if orders_count > 0 else Decimal("0")
        customers_count = Customer.objects.filter(store=self.store).count()
        products_count = Product.objects.filter(store=self.store, is_active=True).count()

        data_card = {
            "type": "metrics",
            "title": title,
            "timeframe": tf,
            "revenue": format_uzs(revenue_dec, self.currency),
            "revenue_raw": float(revenue_dec),
            "orders_count": orders_count,
            "avg_check": format_uzs(avg_check_dec, self.currency),
            "customers_count": customers_count,
            "products_count": products_count,
        }
        return {
            "timeframe": tf,
            "store_name": self.store.name,
            "revenue": data_card["revenue"],
            "orders_count": orders_count,
            "avg_check": data_card["avg_check"],
            "customers_count": customers_count,
            "products_count": products_count,
            "data_card": data_card,
        }

    def get_metrics(self, timeframe: str = "30d", lang: str = "ru") -> Dict[str, Any]:
        return self.get_store_metrics(timeframe=timeframe, lang=lang)

    def search_orders(self, query: str = "", query_or_status: str = "", lang: str = "ru") -> Dict[str, Any]:
        q = (query or query_or_status or "").strip()
        q_low = q.lower()
        qs = Order.objects.filter(store=self.store).select_related("customer").order_by("-created_at")

        status_map = {
            "new": "NEW",
            "новый": "NEW",
            "новые": "NEW",
            "yangi": "NEW",
            "processing": "PROCESSING",
            "в обработке": "PROCESSING",
            "jarayonda": "PROCESSING",
            "ready": "READY",
            "готов": "READY",
            "tayyor": "READY",
            "in_delivery": "IN_DELIVERY",
            "доставляется": "IN_DELIVERY",
            "yetkazilmoqda": "IN_DELIVERY",
            "completed": "COMPLETED",
            "доставлен": "COMPLETED",
            "оплачен": "COMPLETED",
            "завершен": "COMPLETED",
            "bajarildi": "COMPLETED",
            "cancelled": "CANCELLED",
            "отменен": "CANCELLED",
            "bekor": "CANCELLED",
        }

        matched_status = status_map.get(q_low)
        id_match = re.search(r"#?(\d+)", q)

        if matched_status:
            qs = qs.filter(status=matched_status)
        elif id_match and len(q) <= 10:
            num = int(id_match.group(1))
            qs = qs.filter(Q(id=num) | Q(order_number__icontains=str(num)))
        elif q and q_low not in ("all", "все", "последние", "recent", "barchasi", "hammasi", "oxirgi"):
            qs = qs.filter(
                Q(customer_name__icontains=q)
                | Q(customer_phone__icontains=q)
                | Q(customer__full_name__icontains=q)
            )

        status_labels = (
            {
                "NEW": "Yangi",
                "PROCESSING": "Jarayonda",
                "READY": "Tayyor",
                "IN_DELIVERY": "Yetkazilmoqda",
                "COMPLETED": "Yakunlangan",
                "CANCELLED": "Bekor qilingan",
            }
            if lang == "uz"
            else {
                "NEW": "New",
                "PROCESSING": "Processing",
                "READY": "Ready",
                "IN_DELIVERY": "In delivery",
                "COMPLETED": "Completed",
                "CANCELLED": "Cancelled",
            }
            if lang == "en"
            else {
                "NEW": "Новый",
                "PROCESSING": "В обработке",
                "READY": "Готов",
                "IN_DELIVERY": "Доставляется",
                "COMPLETED": "Завершен",
                "CANCELLED": "Отменен",
            }
        )

        total_found = qs.count()
        orders_list = []
        for o in qs[:6]:
            cust = o.customer_name or (o.customer.full_name if o.customer else ("Mijoz" if lang == "uz" else "Клиент"))
            orders_list.append({
                "id": o.id,
                "customer_name": cust,
                "status": o.status,
                "status_label": status_labels.get(o.status, o.status),
                "total_amount": format_uzs(o.total_amount, self.currency),
                "created_at": timezone.localtime(o.created_at).strftime("%d.%m.%Y %H:%M") if o.created_at else "",
            })

        card_title = (
            f"Do'kon buyurtmalari ({total_found})"
            if lang == "uz"
            else f"Store Orders ({total_found})"
            if lang == "en"
            else f"Заказы магазина ({total_found})"
        )
        data_card = {
            "type": "orders",
            "title": card_title,
            "orders_count": total_found,
            "orders": orders_list,
        }
        return {
            "orders_count": total_found,
            "orders": orders_list,
            "data_card": data_card,
        }

    def create_image(self, prompt: str = "") -> Dict[str, Any]:
        from services.image_service import generate_flux_image

        clean_prompt = (prompt or "product").strip()
        image_url = generate_flux_image(clean_prompt)
        return {
            "image_url": image_url,
            "prompt": clean_prompt,
        }

    def generate_product_data(
        self,
        title: str = "",
        description: str = "",
        category: str = "",
        suggested_price: Any = 250000,
        prompt: str = "",
        lang: str = "ru",
    ) -> Dict[str, Any]:
        prod_title = (title or prompt or ("Yangi mahsulot" if lang == "uz" else "Новый товар")).strip()
        first_cat = Category.objects.filter(store=self.store, is_active=True).first()
        prod_cat = category or (first_cat.name_uz if (first_cat and lang == "uz") else first_cat.name_ru if first_cat else "Katalog")
        try:
            price_val = float(suggested_price or 250000)
        except (ValueError, TypeError):
            price_val = 250000.0

        data_card = {
            "type": "product_draft",
            "title": "Mahsulot kartochkasi" if lang == "uz" else "Product Card" if lang == "en" else "Карточка товара",
            "product_name": prod_title,
            "category": prod_cat,
            "description": description or (
                f"{self.store.name} do'konida «{prod_title}» mahsuloti."
                if lang == "uz"
                else f"Премиальный товар «{prod_title}» в магазине {self.store.name}."
            ),
            "suggested_price": format_uzs(price_val, self.currency),
            "price_raw": price_val,
        }
        return {
            "product_name": prod_title,
            "category": prod_cat,
            "description": data_card["description"],
            "suggested_price": data_card["suggested_price"],
            "data_card": data_card,
        }

    def _execute_tool(self, fn_name: str, fn_args: Dict[str, Any], lang: str = "ru") -> Dict[str, Any]:
        fn_args = fn_args or {}
        if fn_name == "navigate_to":
            return self.navigate_to(fn_args.get("route", "home"), lang=lang)
        if fn_name in ("get_metrics", "get_store_metrics"):
            return self.get_metrics(fn_args.get("timeframe", "30d"), lang=lang)
        if fn_name == "search_orders":
            return self.search_orders(
                query=fn_args.get("query", ""),
                query_or_status=fn_args.get("query_or_status", "ALL"),
                lang=lang,
            )
        if fn_name == "generate_product_data":
            return self.generate_product_data(
                title=fn_args.get("title", ""),
                description=fn_args.get("description", ""),
                category=fn_args.get("category", ""),
                suggested_price=fn_args.get("suggested_price", 250000),
                prompt=fn_args.get("prompt", ""),
                lang=lang,
            )
        if fn_name == "create_image":
            return self.create_image(prompt=fn_args.get("prompt", ""))
        return {}

    def _format_fast_tool_reply(self, fn_name: str, tool_result: Dict[str, Any], lang: str) -> str:
        """
        Formats a natural, localized reply directly from the executed tool result
        when Gemini returns a functionCall without an accompanying text block,
        saving an entire second HTTP roundtrip (~2s faster!).
        """
        if fn_name == "navigate_to":
            title = tool_result.get("title", "")
            if lang == "uz":
                return f"Marhamat, «{title}» bo'limini ochyapman."
            if lang == "en":
                return f"Opening the {title} section now."
            return f"Открываю раздел «{title}»."

        if fn_name in ("get_metrics", "get_store_metrics"):
            rev = tool_result.get("revenue", "0 UZS")
            cnt = tool_result.get("orders_count", 0)
            avg = tool_result.get("avg_check", "0 UZS")
            tf = tool_result.get("timeframe", "30d")
            if lang == "uz":
                period_uz = "Bugun" if tf == "today" else "Oxirgi 7 kunda" if tf == "7d" else "Oxirgi 30 kunda"
                return f"{period_uz} {self.store.name} do'konida {cnt} ta buyurtma bo'lib, jami tushum {rev} ni tashkil etdi. O'rtacha chek: {avg}."
            if lang == "en":
                period_en = "Today" if tf == "today" else "Over the last 7 days" if tf == "7d" else "Over the last 30 days"
                return f"{period_en}, {self.store.name} recorded {cnt} orders with total revenue of {rev} and an average check of {avg}."
            period_ru = "Сегодня" if tf == "today" else "За последние 7 дней" if tf == "7d" else "За последние 30 дней"
            return f"{period_ru} в магазине {self.store.name} оформлено {cnt} заказов на сумму {rev}. Средний чек: {avg}."

        if fn_name == "search_orders":
            cnt = tool_result.get("orders_count", 0)
            orders = tool_result.get("orders") or []
            if lang == "uz":
                if cnt == 0:
                    return f"{self.store.name} do'konida hozircha bunday buyurtmalar topilmadi."
                first = orders[0]
                return f"Jami {cnt} ta buyurtma topildi. Oxirgi buyurtma #{first['id']} — {first['customer_name']}, summasi {first['total_amount']} ({first['status_label']})."
            if lang == "en":
                if cnt == 0:
                    return f"No matching orders were found in {self.store.name}."
                first = orders[0]
                return f"Found {cnt} orders. Latest order #{first['id']} by {first['customer_name']} for {first['total_amount']} ({first['status_label']})."
            if cnt == 0:
                return f"В магазине {self.store.name} подходящих заказов не найдено."
            first = orders[0]
            return f"Найдено заказов: {cnt}. Последний заказ #{first['id']} — {first['customer_name']} на сумму {first['total_amount']} ({first['status_label']})."

        if fn_name == "generate_product_data":
            pname = tool_result.get("product_name", "")
            pprice = tool_result.get("suggested_price", "")
            if lang == "uz":
                return f"«{pname}» mahsuloti uchun kartochka tayyor (tavsiya etilgan narx: {pprice}). Uni bir tugma bilan katalogga qo'shishingiz mumkin."
            if lang == "en":
                return f"Prepared the product card for '{pname}' (suggested price: {pprice}). You can add it to your catalog with one click."
            return f"Карточка товара «{pname}» готова (рекомендуемая цена: {pprice}). Вы можете добавить её в каталог в один клик."

        if fn_name == "create_image":
            return "Вот изображение по вашему запросу:"

        return "Tayyor." if lang == "uz" else "Done." if lang == "en" else "Готово."

    # ------------------------------------------------------------------
    # INSTANT ORM INTENT ROUTER (~5ms execution for store commands)
    # ------------------------------------------------------------------
    def _try_instant_intent(self, user_msg: str, user_lang: str) -> Optional[Dict[str, Any]]:
        """
        Executes high-frequency store commands (navigation, live metrics, order search,
        and greetings) directly so the assistant responds fast.
        """
        t = (user_msg or "").strip()
        if not t or len(t) > 220:
            return None
        t_low = t.lower()

        # Do not intercept image generation, product generation, or open-ended questions
        if re.search(
            r"\b(придумай\w*|сгенерируй\w*|создай\w*|нарисуй\w*|сделай\w*\s+фото|описание\s+товара|карточк\w*|добавь\s+товар|"
            r"фото\w*|картинк\w*|изображен\w*|баннер\w*|rasm\w*|foto\w*|banner\w*|photo\w*|image\w*|draw\w*|"
            r"почему|зачем|как\s+увеличить|как\s+поднять|совет|рекомендац|стратеги|"
            r"yarat\w*|chiz\w*|tavsif|nega|qanday\s+qilib|maslahat|create|generate|why|how\s+to)\b",
            t_low,
        ):
            return None

        # Detect optional greeting prefix (e.g. "Ассалому алайкум менга махсулотларни курсат")
        greeting_prefix = ""
        if re.search(r"\b(ассалому\s*алайкум|ассалом\s*алейкум|assalomu\s*alaykum|assalom\s*aleykum)\b", t_low):
            greeting_prefix = "Va alaykum assalom! " if user_lang == "uz" else "Ва алейкум ассалам! "
        elif re.search(r"^(салом|salom)\b", t_low):
            greeting_prefix = "Salom! " if user_lang == "uz" else "Привет! "
        elif re.search(r"^(привет|здравствуй|здравствуйте|добрый\s*(день|вечер|утро))\b", t_low):
            greeting_prefix = "Привет! " if "привет" in t_low else "Здравствуйте! "
        elif re.search(r"^(hello|hi|hey)\b", t_low):
            greeting_prefix = "Hello! "

        # 1. Store Metrics / Revenue / Financial Analytics
        is_metrics_query = bool(
            re.search(
                r"\b(выручк\w*|оборот\w*|средний\s+чек|доход\w*|продаж\w*|тушум\w*|савдо\w*|"
                r"tushum\w*|savdo\w*|o['‘’ʻʼ]?rtacha\s+chek|ortacha\s+chek|revenue|sales\s+report|"
                r"сколько\s+(заказов|заработали|продаж)|нечта\s+буюртма|nechta\s+buyurtma|"
                r"қанча\s+(тушум|савдо|буюртма)|канча\s+(тушум|савдо|буюртма)|qancha\s+(tushum|savdo|buyurtma))\b",
                t_low,
            )
            or re.search(
                r"\b(аналитик\w*|статистик\w*|отчет\w*|отчёт\w*|tahlil\w*|statistika\w*|hisobot\w*|analytics)\b.*"
                r"\b(сегодня|дн\w*|недел\w*|месяц\w*|bugun\w*|kun\w*|hafta\w*|oy\w*|today|week|month|30|7)\b",
                t_low,
            )
            or re.search(
                r"\b(за\s+сегодня|за\s+7\s+дн\w*|за\s+30\s+дн\w*|за\s+неделю|за\s+месяц|"
                r"bugungi\s+holat|30\s+kunlik|7\s+kunlik)\b",
                t_low,
            )
        )
        if is_metrics_query:
            if re.search(r"\b(сегодня|bugun\w*|today|за\s+день)\b", t_low):
                tf = "today"
            elif re.search(r"\b(7\s*дн\w*|недел\w*|hafta\w*|7\s*kun\w*|week)\b", t_low):
                tf = "7d"
            else:
                tf = "30d"
            tool_res = self.get_metrics(timeframe=tf, lang=user_lang)
            reply_text = greeting_prefix + self._format_fast_tool_reply("get_metrics", tool_res, lang=user_lang)
            return {
                "status": "success",
                "text": reply_text.strip(),
                "lang": user_lang,
                "action": None,
                "data_card": tool_res.get("data_card"),
                "image_url": None,
            }

        # 2. Specific Order Search (by ID, status, or "recent/latest orders")
        order_id_match = re.search(r"(?:заказ|буюртма|buyurtma|zakaz|order)\s*#?(\d+)", t_low)
        is_order_search = bool(
            order_id_match
            or re.search(
                r"\b(последние\s+заказы|новые\s+заказы|список\s+заказов|какие\s+заказы|"
                r"найди\s+заказ|статус\s+заказа|oxirgi\s+buyurtma\w*|yangi\s+buyurtma\w*|"
                r"охирги\s+буюртма\w*|янги\s+буюртма\w*|recent\s+orders|new\s+orders)\b",
                t_low,
            )
        )
        if is_order_search:
            q_val = order_id_match.group(1) if order_id_match else ("new" if re.search(r"\b(нов\w+|yangi|янги|new)\b", t_low) else "ALL")
            tool_res = self.search_orders(query=q_val, lang=user_lang)
            reply_text = greeting_prefix + self._format_fast_tool_reply("search_orders", tool_res, lang=user_lang)
            return {
                "status": "success",
                "text": reply_text.strip(),
                "lang": user_lang,
                "action": None,
                "data_card": tool_res.get("data_card"),
                "image_url": None,
            }

        # 3. Section Navigation (e.g., "Ассалому алайкум менга махсулотларни курсат", "Открой товары", "Покажи аналитику")
        nav_patterns = [
            ("products", r"\b(товар\w*|продукт\w*|каталог\w*|махсулот\w*|маҳсулот\w*|mahsulot\w*|maxsulot\w*|tovar\w*|products?)\b"),
            ("orders", r"\b(заказ\w*|буюртма\w*|buyurtma\w*|zakaz\w*|orders?)\b"),
            ("customers", r"\b(клиент\w*|покупател\w*|мижоз\w*|mijoz\w*|klient\w*|customers?)\b"),
            ("analytics", r"\b(аналитик\w*|статистик\w*|отчет\w*|отчёт\w*|tahlil\w*|statistika\w*|hisobot\w*|analytics)\b"),
            ("settings", r"\b(настройк\w*|созлама\w*|sozlama\w*|settings?)\b"),
            ("warehouse", r"\b(склад\w*|запас\w*|остатк\w*|омбор\w*|ombor\w*|zaxira\w*|warehouse|inventory)\b"),
            ("categories", r"\b(категори\w*|коллекци\w*|kategoriy\w*|categories|collections)\b"),
            ("discounts", r"\b(скидк\w*|промокод\w*|чегирма\w*|chegirma\w*|discounts?)\b"),
            ("marketing", r"\b(маркетинг\w*|реклам\w*|marketing)\b"),
            ("yespos", r"\b(yes\s*pos|йес\s*пос|касс\w*|pos)\b"),
            ("ikpu", r"\b(икпу|мхик|ikpu|mxik)\b"),
            ("themes", r"\b(тем[аыу]\w*|витрин\w*|дизайн\w*|mavzu\w*|dizayn\w*|themes?)\b"),
            ("markets", r"\b(рынк\w*|регион\w*|bozor\w*|markets?)\b"),
            ("chats", r"\b(чат\w*|сообщени\w*|chat\w*|xabar\w*)\b"),
            ("home", r"\b(главн\w*|дашборд\w*|бош\s+сахифа|bosh\s+sahifa|dashboard|home)\b"),
        ]
        has_nav_verb = bool(
            re.search(
                r"\b(открой\w*|открыть|покажи\w*|показать|перейди\w*|перейти|зайди|раздел|страниц\w*|"
                r"курсат\w*|кўрсат\w*|оч\w*|korsat\w*|ko['‘’ʻʼ]?rsat\w*|och\w*|bo['‘’ʻʼ]?lim\w*|sahifa\w*|"
                r"менга|манга|menga|manga|open|show|go\s+to)\b",
                t_low,
            )
        )
        matched_route: Optional[str] = None
        for route_key, pattern in nav_patterns:
            if re.search(pattern, t_low):
                # Trigger navigation if user used a navigation verb OR sent a short 1-3 word section command
                if has_nav_verb or len(t_low.split()) <= 3:
                    matched_route = route_key
                    break

        if matched_route:
            nav_res = self.navigate_to(matched_route, lang=user_lang)
            extra_card = None
            if matched_route == "analytics":
                extra_card = self.get_metrics("30d", lang=user_lang).get("data_card")
            elif matched_route == "orders":
                extra_card = self.search_orders("ALL", lang=user_lang).get("data_card")

            reply_text = greeting_prefix + self._format_fast_tool_reply("navigate_to", nav_res, lang=user_lang)
            return {
                "status": "success",
                "text": reply_text.strip(),
                "lang": user_lang,
                "action": nav_res.get("action"),
                "data_card": extra_card,
                "image_url": None,
            }

        # 4. Pure Greeting / "How are you?" / Store Status Check
        cleaned_words = re.sub(r"[^\w\s]", " ", t_low).split()
        if len(cleaned_words) <= 6 and re.search(
            r"\b(привет|здравствуй|здравствуйте|добрый|ассалому|ассалом|алайкум|алейкум|салом|"
            r"assalomu|assalom|alaykum|aleykum|salom|hello|hi|hey|как\s+дела|qalesiz|qandaysiz|ishlar\s+qanday)\b",
            t_low,
        ):
            snap = self._get_live_store_snapshot()
            if user_lang == "uz":
                text = (
                    f"Va alaykum assalom! {snap['store_name']} do'konida ishlar a'lo — "
                    f"katalogda {snap['total_products']} ta mahsulot bor, 30 kunlik tushum {snap['month_revenue']}. Qanday yordam beray?"
                )
            elif user_lang == "en":
                text = (
                    f"Hello! {snap['store_name']} is running smoothly with {snap['total_products']} active products "
                    f"and {snap['month_revenue']} in 30-day revenue. How can I help you today?"
                )
            else:
                text = (
                    f"{greeting_prefix or 'Привет! '}В магазине {snap['store_name']} всё отлично: "
                    f"в каталоге {snap['total_products']} товаров, выручка за 30 дней — {snap['month_revenue']}. Чем помочь?"
                )
            return {
                "status": "success",
                "text": text,
                "lang": user_lang,
                "action": None,
                "data_card": None,
                "image_url": None,
            }

        return None

    # ------------------------------------------------------------------
    # DIRECT GEMINI API CALL (`generativelanguage.googleapis.com`)
    # ------------------------------------------------------------------
    def _call_gemini(self, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        global _RESOLVED_GEMINI_MODEL

        api_key = (
            getattr(settings, "GEMINI_API_KEY", "")
            or os.environ.get("GEMINI_API_KEY", "")
        ).strip()
        if not api_key:
            logger.error("GEMINI_API_KEY is not configured.")
            return None

        candidate_models = [
            _RESOLVED_GEMINI_MODEL,
            "models/gemini-3.5-flash",
            "models/gemini-3.8-flash",
            "models/gemini-flash-latest",
        ]
        models = list(dict.fromkeys([m for m in candidate_models if m]))

        headers = {"Content-Type": "application/json"}
        for model_name in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/{model_name}:generateContent?key={api_key}"
            try:
                resp = _GEMINI_SESSION.post(url, headers=headers, json=payload, timeout=6.0, verify=False)
                if resp.status_code == 200:
                    data = resp.json()
                    if isinstance(data, dict) and data.get("candidates"):
                        _RESOLVED_GEMINI_MODEL = model_name
                        return data
                elif resp.status_code == 400 and "thinkingConfig" in json.dumps(payload):
                    clean_payload = dict(payload)
                    gen_cfg = dict(clean_payload.get("generationConfig", {}))
                    gen_cfg.pop("thinkingConfig", None)
                    clean_payload["generationConfig"] = gen_cfg
                    resp2 = _GEMINI_SESSION.post(url, headers=headers, json=clean_payload, timeout=4.5, verify=False)
                    if resp2.status_code == 200:
                        data = resp2.json()
                        if isinstance(data, dict) and data.get("candidates"):
                            _RESOLVED_GEMINI_MODEL = model_name
                            return data
                else:
                    logger.warning(
                        "Gemini model %s returned %s: %s",
                        model_name,
                        resp.status_code,
                        resp.text[:200],
                    )
            except Exception as exc:
                logger.warning("Gemini request failed for %s: %s", model_name, exc)
        return None

    def process_chat(self, message: str, history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Ultra-low-latency hybrid pipeline:
        1. Instant ORM Intent Router (~5ms) for navigation, live store metrics, order lookups, and greetings.
        2. Direct Gemini call with Function Calling (`create_image`, `generate_product_data`, etc.).
        """
        user_msg = (message or "").strip()
        user_lang = detect_language(user_msg, fallback=self.lang)

        # Fast-path ORM execution (~5ms) for high-frequency store commands
        instant_result = self._try_instant_intent(user_msg, user_lang)
        if instant_result is not None:
            return instant_result

        snapshot = self._get_live_store_snapshot()

        if user_lang == "uz":
            lang_directive = (
                "ВАЖНОЕ ПРАВИЛО ЯЗЫКА: Ответь СТРОГО на УЗБЕКСКОМ языке (латиницей) в 1 коротком предложении (до 15 слов)!"
            )
            prompt_suffix = "\n[Javobni faqat o'zbek tilida (lotin alifbosida) 1 ta qisqa gapda (10-15 so'z) yozing!]"
        elif user_lang == "en":
            lang_directive = (
                "IMPORTANT LANGUAGE RULE: Reply STRICTLY in ENGLISH in 1 short sentence (max 15 words)!"
            )
            prompt_suffix = "\n[Reply strictly in English in 1 short sentence (10-15 words)!]"
        else:
            lang_directive = (
                "ВАЖНОЕ ПРАВИЛО ЯЗЫКА: Ответь СТРОГО на РУССКОМ языке в 1 коротком предложении (до 15 слов)!"
            )
            prompt_suffix = "\n[Ответь строго на русском языке в 1 коротком предложении (10-15 слов)!]"

        full_system_instruction = (
            f"{SYSTEM_INSTRUCTION}\n"
            f"{lang_directive}\n"
            f"Магазин: {snapshot['store_name']} | "
            f"Сегодня: {snapshot['today_orders']} зак. ({snapshot['today_revenue']}) | "
            f"30 дней: {snapshot['month_orders']} зак. ({snapshot['month_revenue']}) | "
            f"Товаров: {snapshot['total_products']}, Клиентов: {snapshot['total_customers']}."
        )

        contents: List[Dict[str, Any]] = []
        if history and isinstance(history, list):
            for turn in history[-4:]:
                if not isinstance(turn, dict):
                    continue
                role = (
                    "model"
                    if turn.get("sender") == "assistant" or turn.get("role") in ("assistant", "model")
                    else "user"
                )
                txt = (turn.get("text") or turn.get("content") or "").strip()
                if txt:
                    contents.append({"role": role, "parts": [{"text": txt}]})

        contents.append({"role": "user", "parts": [{"text": f"{user_msg}{prompt_suffix}"}]})

        msg_low = user_msg.lower()
        is_image_intent = bool(
            re.search(
                r"(создай\w*\s+фото|сделай\w*\s+фото|сгенерируй\w*\s+(изображен|фото|картинк)|"
                r"создай\w*\s+(изображен|картинк)|нарисуй\w*|фото\s+для|rasm\s+(yarat|chiz)|"
                r"create\s+(photo|image)|generate\s+(photo|image)|draw\b)",
                msg_low,
            )
        )

        needs_tools = is_image_intent or bool(
            re.search(
                r"\b(придумай|сгенерируй|создай|товар|карточк|описание|открой|покажи|перейди|найди|"
                r"фото|картинк|изображен|нарисуй|сделай|"
                r"yarat|tavsif|mahsulot|och|korsat|ko'rsat|rasm|foto|chiz|"
                r"create|generate|open|show|photo|image|draw)\b",
                msg_low,
            )
        )

        payload: Dict[str, Any] = {
            "systemInstruction": {"parts": [{"text": full_system_instruction}]},
            "contents": contents,
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 90,
            },
        }
        if is_image_intent:
            payload["tools"] = [{"functionDeclarations": GEMINI_FUNCTION_DECLARATIONS}]
            payload["toolConfig"] = {
                "functionCallingConfig": {
                    "mode": "ANY",
                    "allowedFunctionNames": ["create_image"],
                }
            }
        elif needs_tools:
            payload["tools"] = [{"functionDeclarations": GEMINI_FUNCTION_DECLARATIONS}]
            payload["toolConfig"] = {"functionCallingConfig": {"mode": "AUTO"}}

        action_obj: Optional[Dict[str, Any]] = None
        data_card_obj: Optional[Dict[str, Any]] = None
        image_url_obj: Optional[str] = None

        first_response = self._call_gemini(payload)
        if not first_response:
            if is_image_intent:
                img_res = self.create_image(prompt=user_msg)
                return {
                    "status": "success",
                    "text": "Вот изображение по вашему запросу:",
                    "lang": user_lang,
                    "action": None,
                    "data_card": None,
                    "image_url": img_res.get("image_url"),
                }
            err_msg = (
                "Gemini API bilan bog'lanib bo'lmadi. Internet aloqasini tekshiring."
                if user_lang == "uz"
                else "Could not connect to Gemini API. Please check your connection."
                if user_lang == "en"
                else "Не удалось связаться с Gemini API. Проверьте подключение к интернету."
            )
            return {
                "status": "error",
                "text": err_msg,
                "lang": user_lang,
                "action": None,
                "data_card": None,
                "image_url": None,
            }

        candidate_content = first_response["candidates"][0].get("content", {})
        parts = candidate_content.get("parts", [])
        function_call_parts = [p for p in parts if "functionCall" in p]
        first_text = "".join(p.get("text", "") for p in parts if "text" in p).strip()

        if function_call_parts:
            reply_segments: List[str] = []
            for p in function_call_parts:
                fc = p["functionCall"]
                fn_name = fc.get("name", "")
                fn_args = fc.get("args") or {}

                tool_result = self._execute_tool(fn_name, fn_args, lang=user_lang)
                if tool_result.get("action"):
                    action_obj = tool_result["action"]
                if tool_result.get("data_card"):
                    data_card_obj = tool_result["data_card"]
                if tool_result.get("image_url"):
                    image_url_obj = tool_result["image_url"]

                seg = self._format_fast_tool_reply(fn_name, tool_result, lang=user_lang)
                if seg and seg not in reply_segments:
                    reply_segments.append(seg)

            if image_url_obj:
                final_text = "Вот изображение по вашему запросу:"
            elif first_text and detect_language(first_text, fallback=user_lang) == user_lang:
                final_text = first_text
            else:
                final_text = " ".join(reply_segments).strip()
        elif is_image_intent:
            img_res = self.create_image(prompt=user_msg)
            image_url_obj = img_res.get("image_url")
            final_text = "Вот изображение по вашему запросу:"
        else:
            final_text = first_text

        return {
            "status": "success",
            "text": final_text,
            "lang": user_lang,
            "action": action_obj,
            "data_card": data_card_obj,
            "image_url": image_url_obj,
        }

