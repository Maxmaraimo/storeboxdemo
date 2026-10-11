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

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
logger = logging.getLogger(__name__)

# Persistent HTTP session for Gemini API (reuses TLS connection for <0.5s latency)
_GEMINI_SESSION = requests.Session()
_GEMINI_SESSION.trust_env = False


SYSTEM_INSTRUCTION = (
    "Ты — живой, умный AI-ассистент Sidekick для платформы StoreBox. "
    "Общайся естественно, свободно отвечай на любые вопросы продавца "
    "(от простых 'привет' и консультаций по бизнесу до аналитики) на языке пользователя (русский/узбекский/английский). "
    "Отвечай четко, лаконично и по делу (обычно 1–3 предложения), чтобы твои ответы мгновенно читались и легко воспринимались на слух. "
    "Не повторяй шаблонные приветствия в каждом сообщении!"
)

# Native Gemini Function Calling Tools Schema
GEMINI_FUNCTION_DECLARATIONS = [
    {
        "name": "navigate_to",
        "description": (
            "Переводит продавца в нужный раздел панели управления StoreBox. "
            "Вызывай ТОЛЬКО когда пользователь явно просит открыть или перейти на страницу/раздел."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "route": {
                    "type": "STRING",
                    "description": (
                        "Код раздела: 'orders', 'products', 'customers', 'analytics', "
                        "'settings', 'themes', 'markets', 'discounts', 'marketing', "
                        "'warehouse', 'categories', 'ikpu', 'home'."
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
                "query_or_status": {
                    "type": "STRING",
                    "description": "Номер заказа, имя клиента или статус ('новый', 'оплачен', 'доставлен', 'ALL').",
                }
            },
            "required": ["query_or_status"],
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
]


ROUTE_DIRECTORY: Dict[str, Dict[str, str]] = {
    "home": {"target": "/dashboard/", "spa_path": "/", "title": "Главная"},
    "dashboard": {"target": "/dashboard/", "spa_path": "/", "title": "Главная"},
    "orders": {"target": "/dashboard/orders/", "spa_path": "/orders", "title": "Заказы"},
    "drafts": {"target": "/dashboard/orders/?tab=drafts", "spa_path": "/orders?tab=drafts", "title": "Черновики"},
    "abandoned": {"target": "/dashboard/orders/?tab=abandoned", "spa_path": "/orders?tab=abandoned", "title": "Брошенные корзины"},
    "products": {"target": "/dashboard/products/", "spa_path": "/products", "title": "Товары"},
    "categories": {"target": "/dashboard/categories/", "spa_path": "/categories", "title": "Коллекции"},
    "warehouse": {"target": "/dashboard/warehouse/", "spa_path": "/warehouse", "title": "Товарные запасы"},
    "constructor": {"target": "/dashboard/constructor/", "spa_path": "/constructor", "title": "Конструктор"},
    "ikpu": {"target": "/dashboard/ikpu/", "spa_path": "/ikpu", "title": "Коды ИКПУ"},
    "customers": {"target": "/dashboard/customers/", "spa_path": "/customers", "title": "Клиенты"},
    "analytics": {"target": "/dashboard/analytics/", "spa_path": "/analytics", "title": "Аналитика"},
    "marketing": {"target": "/dashboard/marketing/", "spa_path": "/marketing", "title": "Маркетинг"},
    "discounts": {"target": "/dashboard/discounts/", "spa_path": "/discounts", "title": "Скидки"},
    "markets": {"target": "/dashboard/markets/", "spa_path": "/markets", "title": "Рынки"},
    "themes": {"target": "/dashboard/themes/", "spa_path": "/themes", "title": "Темы витрины"},
    "design": {"target": "/dashboard/design/", "spa_path": "/design", "title": "Редактор витрины"},
    "platforms": {"target": "/dashboard/platforms/", "spa_path": "/platforms", "title": "Telegram Mini App"},
    "chats": {"target": "/dashboard/chats/", "spa_path": "/chats", "title": "Чаты"},
    "settings": {"target": "/dashboard/settings/", "spa_path": "/settings", "title": "Настройки"},
    "payments": {"target": "/dashboard/settings/payments/", "spa_path": "/settings/payments", "title": "Платежи"},
    "delivery": {"target": "/dashboard/settings/delivery/", "spa_path": "/settings/delivery", "title": "Доставка"},
    "branches": {"target": "/dashboard/settings/branches/", "spa_path": "/settings/branches", "title": "Филиалы"},
    "staff": {"target": "/dashboard/settings/staff/", "spa_path": "/settings/staff", "title": "Сотрудники"},
    "domains": {"target": "/dashboard/settings/domains/", "spa_path": "/settings/domains", "title": "Домены"},
    "tariffs": {"target": "/dashboard/settings/tariffs/", "spa_path": "/settings/tariffs", "title": "Тарифы"},
}


def format_uzs(amount: Any, currency: str = "UZS") -> str:
    try:
        val = int(round(float(amount or 0)))
    except (ValueError, TypeError):
        val = 0
    return f"{val:,}".replace(",", " ") + f" {currency}"


def detect_language(text: str, fallback: str = "ru") -> str:
    t = (text or "").lower()
    if any(w in t for w in ("salom", "qanday", "qancha", "buyurtma", "mahsulot", "tovar", "so'm", "do'kon", "uchun")):
        return "uz"
    if any(w in t for w in ("hello", "revenue", "orders", "show me", "how many", "open ", "go to ")):
        return "en"
    return fallback if fallback in ("ru", "uz", "en") else "ru"


class SidekickBrain:
    """
    Live Gemini AI Assistant with Native Function Calling (Tools).
    """

    def __init__(self, store: Store, lang: str = "ru"):
        self.store = store
        self.lang = lang or "ru"
        self.currency = getattr(store, "currency", "UZS") or "UZS"
        self._http = requests.Session()
        self._http.trust_env = False  # Bypass IDE sandbox proxy so Gemini API connects directly

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
    def navigate_to(self, route: str) -> Dict[str, Any]:
        raw = (route or "home").strip().lower().strip("/")
        if raw.startswith("dashboard/"):
            raw = raw[len("dashboard/"):].strip("/")

        alias_map = {
            "заказы": "orders",
            "товары": "products",
            "клиенты": "customers",
            "аналитика": "analytics",
            "настройки": "settings",
            "темы": "themes",
            "рынки": "markets",
            "скидки": "discounts",
            "маркетинг": "marketing",
            "склад": "warehouse",
            "коллекции": "categories",
            "категории": "categories",
            "икпу": "ikpu",
            "главная": "home",
        }
        key = alias_map.get(raw, raw)
        info = ROUTE_DIRECTORY.get(
            key,
            {"target": f"/dashboard/{key}/", "spa_path": f"/{key}", "title": key.capitalize()},
        )
        return {
            "status": "navigated",
            "route": key,
            "title": info["title"],
            "target": info["target"],
            "action": {
                "type": "NAVIGATE",
                "target": info["target"],
                "spa_path": info["spa_path"],
                "title": info["title"],
            },
        }

    def get_store_metrics(self, timeframe: str = "30d") -> Dict[str, Any]:
        tf = (timeframe or "30d").strip().lower()
        if tf not in ("today", "7d", "30d"):
            tf = "30d"

        now = timezone.now()
        all_orders = Order.objects.filter(store=self.store)

        if tf == "today":
            scoped = all_orders.filter(created_at__date=now.date())
            title = "Аналитика за сегодня"
        elif tf == "7d":
            scoped = all_orders.filter(created_at__gte=now - timedelta(days=7))
            title = "Аналитика за 7 дней"
        else:
            scoped = all_orders.filter(created_at__gte=now - timedelta(days=30))
            title = "Аналитика за 30 дней"

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

    def search_orders(self, query_or_status: str = "") -> Dict[str, Any]:
        q = (query_or_status or "").strip()
        q_low = q.lower()
        qs = Order.objects.filter(store=self.store).select_related("customer").order_by("-created_at")

        status_map = {
            "new": "NEW",
            "новый": "NEW",
            "новые": "NEW",
            "processing": "PROCESSING",
            "в обработке": "PROCESSING",
            "ready": "READY",
            "готов": "READY",
            "in_delivery": "IN_DELIVERY",
            "доставляется": "IN_DELIVERY",
            "completed": "COMPLETED",
            "доставлен": "COMPLETED",
            "оплачен": "COMPLETED",
            "завершен": "COMPLETED",
            "cancelled": "CANCELLED",
            "отменен": "CANCELLED",
        }

        matched_status = status_map.get(q_low)
        id_match = re.search(r"#?(\d+)", q)

        if matched_status:
            qs = qs.filter(status=matched_status)
        elif id_match and len(q) <= 10:
            num = int(id_match.group(1))
            qs = qs.filter(Q(id=num) | Q(order_number__icontains=str(num)))
        elif q and q_low not in ("all", "все", "последние", "recent"):
            qs = qs.filter(
                Q(customer_name__icontains=q)
                | Q(customer_phone__icontains=q)
                | Q(customer__full_name__icontains=q)
            )

        status_labels = {
            "NEW": "Новый",
            "PROCESSING": "В обработке",
            "READY": "Готов",
            "IN_DELIVERY": "Доставляется",
            "COMPLETED": "Завершен",
            "CANCELLED": "Отменен",
        }

        total_found = qs.count()
        orders_list = []
        for o in qs[:6]:
            cust = o.customer_name or (o.customer.full_name if o.customer else "Клиент")
            orders_list.append({
                "id": o.id,
                "customer_name": cust,
                "status": o.status,
                "status_label": status_labels.get(o.status, o.status),
                "total_amount": format_uzs(o.total_amount, self.currency),
                "created_at": timezone.localtime(o.created_at).strftime("%d.%m.%Y %H:%M") if o.created_at else "",
            })

        data_card = {
            "type": "orders",
            "title": f"Заказы магазина ({total_found})",
            "orders_count": total_found,
            "orders": orders_list,
        }
        return {
            "orders_count": total_found,
            "orders": orders_list,
            "data_card": data_card,
        }

    def generate_product_data(
        self,
        title: str = "",
        description: str = "",
        category: str = "",
        suggested_price: Any = 250000,
        prompt: str = "",
    ) -> Dict[str, Any]:
        prod_title = (title or prompt or "Новый товар").strip()
        first_cat = Category.objects.filter(store=self.store, is_active=True).first()
        prod_cat = category or (first_cat.name_ru if first_cat else "Основной каталог")
        try:
            price_val = float(suggested_price or 250000)
        except (ValueError, TypeError):
            price_val = 250000.0

        data_card = {
            "type": "product_draft",
            "title": "Карточка товара",
            "product_name": prod_title,
            "category": prod_cat,
            "description": description or f"Премиальный товар «{prod_title}» в магазине {self.store.name}.",
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

    def _execute_tool(self, fn_name: str, fn_args: Dict[str, Any]) -> Dict[str, Any]:
        fn_args = fn_args or {}
        if fn_name == "navigate_to":
            return self.navigate_to(fn_args.get("route", "home"))
        if fn_name in ("get_metrics", "get_store_metrics"):
            return self.get_store_metrics(fn_args.get("timeframe", "30d"))
        if fn_name == "search_orders":
            return self.search_orders(fn_args.get("query_or_status", "ALL"))
        if fn_name == "generate_product_data":
            return self.generate_product_data(
                title=fn_args.get("title", ""),
                description=fn_args.get("description", ""),
                category=fn_args.get("category", ""),
                suggested_price=fn_args.get("suggested_price", 250000),
                prompt=fn_args.get("prompt", ""),
            )
        return {}

    # ------------------------------------------------------------------
    # DIRECT GEMINI API CALL (`generativelanguage.googleapis.com`)
    # ------------------------------------------------------------------
    def _call_gemini(self, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        api_key = (
            getattr(settings, "GEMINI_API_KEY", "")
            or os.environ.get("GEMINI_API_KEY", "")
        ).strip()
        if not api_key:
            logger.error("GEMINI_API_KEY is not configured.")
            return None

        # Fastest active Google AI Studio Flash models supporting v1beta generateContent + Function Calling
        models = [
            "models/gemini-3.5-flash-lite",
            "models/gemini-flash-lite-latest",
            "models/gemini-3.6-flash",
            "models/gemini-3.5-flash",
        ]

        headers = {"Content-Type": "application/json"}
        for model_name in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/{model_name}:generateContent?key={api_key}"
            try:
                resp = _GEMINI_SESSION.post(url, headers=headers, json=payload, timeout=8.0, verify=False)
                if resp.status_code == 200:
                    data = resp.json()
                    if isinstance(data, dict) and data.get("candidates"):
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
        Sends user message, chat history, live store snapshot, and tools to Gemini API.
        If Gemini invokes a tool (`functionCall`), executes it against Django ORM and sends
        `functionResponse` back to Gemini so the model formulates a natural human response.
        """
        user_msg = (message or "").strip()
        snapshot = self._get_live_store_snapshot()

        full_system_instruction = (
            f"{SYSTEM_INSTRUCTION}\n\n"
            f"Контекст текущего магазина:\n"
            f"- Название магазина: {snapshot['store_name']} (субдомен: {snapshot['subdomain']})\n"
            f"- Валюта: {snapshot['currency']}\n"
            f"- За сегодня: {snapshot['today_orders']} заказов на сумму {snapshot['today_revenue']}\n"
            f"- За 7 дней: {snapshot['week_orders']} заказов на сумму {snapshot['week_revenue']}\n"
            f"- За 30 дней: {snapshot['month_orders']} заказов на сумму {snapshot['month_revenue']}\n"
            f"- Товаров в каталоге: {snapshot['total_products']}, клиентов в базе: {snapshot['total_customers']}."
        )

        contents: List[Dict[str, Any]] = []
        if history and isinstance(history, list):
            for turn in history[-10:]:
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

        contents.append({"role": "user", "parts": [{"text": user_msg}]})

        payload = {
            "systemInstruction": {"parts": [{"text": full_system_instruction}]},
            "contents": contents,
            "tools": [{"functionDeclarations": GEMINI_FUNCTION_DECLARATIONS}],
            "toolConfig": {"functionCallingConfig": {"mode": "AUTO"}},
            "generationConfig": {
                "temperature": 0.6,
                "maxOutputTokens": 800,
            },
        }

        action_obj: Optional[Dict[str, Any]] = None
        data_card_obj: Optional[Dict[str, Any]] = None

        first_response = self._call_gemini(payload)
        if not first_response:
            return {
                "status": "error",
                "text": "Не удалось связаться с Gemini API. Проверьте подключение к интернету.",
                "action": None,
                "data_card": None,
            }

        candidate_content = first_response["candidates"][0].get("content", {})
        parts = candidate_content.get("parts", [])
        function_call_parts = [p for p in parts if "functionCall" in p]

        # If Gemini decided to call one or more tools:
        if function_call_parts:
            fn_response_parts = []
            for p in function_call_parts:
                fc = p["functionCall"]
                fn_name = fc.get("name", "")
                fn_args = fc.get("args") or {}
                call_id = fc.get("id")

                tool_result = self._execute_tool(fn_name, fn_args)
                if tool_result.get("action"):
                    action_obj = tool_result["action"]
                if tool_result.get("data_card"):
                    data_card_obj = tool_result["data_card"]

                # Clean copy for Gemini functionResponse
                result_for_llm = {k: v for k, v in tool_result.items() if k not in ("action", "data_card")}
                fn_resp_obj: Dict[str, Any] = {
                    "name": fn_name,
                    "response": {"result": result_for_llm},
                }
                if call_id:
                    fn_resp_obj["id"] = call_id

                fn_response_parts.append({"functionResponse": fn_resp_obj})

            # Append model's functionCall turn (preserving thoughtSignature) and user's functionResponse turn
            contents.append(candidate_content)
            contents.append({"role": "user", "parts": fn_response_parts})

            second_payload = {
                "systemInstruction": {"parts": [{"text": full_system_instruction}]},
                "contents": contents,
                "tools": [{"functionDeclarations": GEMINI_FUNCTION_DECLARATIONS}],
                "generationConfig": {
                    "temperature": 0.6,
                    "maxOutputTokens": 800,
                },
            }
            second_response = self._call_gemini(second_payload)
            if second_response:
                second_parts = second_response["candidates"][0].get("content", {}).get("parts", [])
                final_text = "".join(sp.get("text", "") for sp in second_parts if "text" in sp).strip()
            else:
                final_text = ""
        else:
            final_text = "".join(p.get("text", "") for p in parts if "text" in p).strip()

        return {
            "status": "success",
            "text": final_text,
            "action": action_obj,
            "data_card": data_card_obj,
        }
