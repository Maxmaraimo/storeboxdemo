import os
import re
import json
import uuid
import logging
import urllib.request
from decimal import Decimal
from datetime import timedelta
from io import BytesIO

from django.conf import settings
from django.utils import timezone
from django.utils.text import slugify
from django.db.models import Sum, Count, Avg, Q, F

from apps.stores.models import Store
from apps.catalog.models import Product, Category, ProductImage
from apps.orders.models import Order, OrderItem, Customer, PromoCode

logger = logging.getLogger(__name__)

OLLAMA_API_BASE = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434")


def detect_query_language(text: str, default_lang: str = "ru") -> str:
    """Accurately detects whether query is in Uzbek, English, or Russian."""
    t = (text or "").lower()
    
    uz_markers = [
        "qoldiq", "qancha", "narx", "buyurtma", "savdo", "mahsulot", "yarat", 
        "o'zgartir", "qiling", "bormi", "ko'rsat", "ber", "chegirma", "tushum", 
        "hisobot", "mijoz", "xodim", "ombordagi", "tugayotgan", "yangi",
        "salom", "qalesiz", "yordam", "fonni", "olib tashla", "tozala", "qilsam",
        "tavsiya", "matn", "yoz", "tovar", "vitrina", "do'kon", "kerak", "uchun"
    ]
    if any(m in t for m in uz_markers) or "o'zbek" in t or "'" in t or "g'o" in t or "o‘" in t or "g‘" in t:
        return "uz"

    # English markers
    en_markers = [
        "sales", "order", "product", "stock", "inventory", "discount", "create", 
        "how much", "revenue", "generate", "analytics", "customers", "report", "show me",
        "help", "remove bg", "background", "photo", "studio", "advice", "growth", "best seller"
    ]
    if any(m in t for m in en_markers) and not re.search(r'[\u0400-\u04FF]', t):
        return "en"

    # Cyrillic / Russian default
    if re.search(r'[\u0400-\u04FF]', t):
        return "ru"

    return default_lang if default_lang in ["ru", "uz", "en"] else "ru"


def check_ollama_available():
    """Checks if local Ollama server is running and returns available models."""
    try:
        req = urllib.request.Request(f"{OLLAMA_API_BASE}/api/tags", headers={"User-Agent": "StoreBox-AI"})
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                models = [m.get("name") for m in data.get("models", [])]
                return True, models
    except Exception as e:
        logger.debug(f"Ollama check failed: {e}")
    return False, []


def call_ollama(prompt: str, system_prompt: str, model: str = None) -> str:
    """Invokes local Ollama LLM if reachable."""
    is_avail, models = check_ollama_available()
    if not is_avail:
        return ""

    selected_model = model or (models[0] if models else "llama3")
    payload = {
        "model": selected_model,
        "prompt": prompt,
        "system": system_prompt,
        "stream": False,
        "options": {
            "temperature": 0.5,
            "top_p": 0.9,
        }
    }

    try:
        req = urllib.request.Request(
            f"{OLLAMA_API_BASE}/api/generate",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "User-Agent": "StoreBox-AI"}
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                return data.get("response", "").strip()
    except Exception as e:
        logger.warning(f"Ollama inference error: {e}")
    return ""


# -------------------------------------------------------------------------
# STRUCTURED TOOLS SCHEMA (FUNCTION CALLING)
# -------------------------------------------------------------------------
TOOLS_SCHEMA = [
    {
        "name": "get_sales_analytics",
        "description": "Get sales revenue, order volumes, average check, and business dynamics",
        "parameters": {"period": "today | 7d | 30d"}
    },
    {
        "name": "get_inventory_health",
        "description": "Check warehouse inventory, low stock and out-of-stock items",
        "parameters": {}
    },
    {
        "name": "apply_store_discount",
        "description": "Apply a storewide or catalog discount percentage",
        "parameters": {"discount_percent": "integer (e.g. 10, 15, 20)"}
    },
    {
        "name": "create_promocode",
        "description": "Create a discount coupon / promo code in database",
        "parameters": {"code": "string", "discount_percent": "integer"}
    },
    {
        "name": "create_product",
        "description": "Create a new catalog product with name, price, and stock",
        "parameters": {"name": "string", "price": "number", "stock": "integer"}
    },
    {
        "name": "generate_banner",
        "description": "Create a promotional marketing banner or ad card for storefront",
        "parameters": {"headline": "string", "badge": "string", "product_name": "string", "theme": "string"}
    },
    {
        "name": "generate_product_image",
        "description": "Generate 1024x1024 studio product photography artwork",
        "parameters": {"product_name": "string", "theme": "dark_luxury | clean_white"}
    },
    {
        "name": "remove_background",
        "description": "Remove background from product photo using local rembg AI",
        "parameters": {"product_name": "string"}
    },
    {
        "name": "generate_seo_description",
        "description": "Generate selling marketing copy, key benefits, and SEO tags",
        "parameters": {"product_name": "string"}
    },
    {
        "name": "get_recent_orders",
        "description": "View recent orders, customer names, and fulfillment status",
        "parameters": {"limit": "integer"}
    },
    {
        "name": "find_product",
        "description": "Search product price, inventory, and status in store",
        "parameters": {"query": "string"}
    },
    {
        "name": "general_business_advice",
        "description": "Strategic e-commerce growth advice and business recommendations",
        "parameters": {"topic": "string"}
    }
]


def call_ollama_function_call(user_message: str, store_context: dict, lang: str = "ru") -> dict:
    """
    Invokes Ollama in structured JSON Function Calling mode.
    Returns: { "thought": str, "tool": str, "parameters": dict } or {}
    """
    is_avail, models = check_ollama_available()
    if not is_avail:
        return {}

    selected_model = models[0] if models else "llama3"
    system_instruction = (
        f"You are the cognitive Function-Calling engine for StoreBox Sidekick.\n"
        f"Store context: {store_context['store_name']} ({store_context['total_products']} products, {store_context['total_orders']} orders, 7d rev: {store_context['revenue_7d']} UZS).\n"
        f"Tools Schema: {json.dumps(TOOLS_SCHEMA, ensure_ascii=False)}\n\n"
        f"Rules:\n"
        f"1. You MUST respond ONLY with a single valid JSON object, no other words or markdown wrappers.\n"
        f"2. Format:\n"
        f'{{"thought": "<concise reasoning in {lang.upper()}>", "tool": "<tool_name or chat_reply>", "parameters": {{ ... }}}}\n'
    )

    payload = {
        "model": selected_model,
        "prompt": user_message,
        "system": system_instruction,
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.2}
    }

    try:
        req = urllib.request.Request(
            f"{OLLAMA_API_BASE}/api/generate",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "User-Agent": "StoreBox-AI"}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            if resp.status == 200:
                raw = json.loads(resp.read().decode("utf-8")).get("response", "").strip()
                match = re.search(r'\{.*\}', raw, re.DOTALL)
                if match:
                    parsed = json.loads(match.group(0))
                    if isinstance(parsed, dict) and "tool" in parsed:
                        return parsed
    except Exception as e:
        logger.debug(f"Ollama function call error: {e}")

    return {}


# -------------------------------------------------------------------------
# REMBG IMAGE PROCESSING WITH LOCAL FALLBACK
# -------------------------------------------------------------------------
def remove_image_background(input_path_or_bytes) -> bytes:
    """Removes image background locally using rembg with smart fallback."""
    ai_dir = os.path.join(settings.BASE_DIR, ".ai_models")
    os.makedirs(ai_dir, exist_ok=True)
    os.environ["U2NET_HOME"] = ai_dir
    os.environ["REMBG_DATA_DIR"] = ai_dir

    if isinstance(input_path_or_bytes, (bytes, bytearray)):
        img_bytes = input_path_or_bytes
    else:
        with open(input_path_or_bytes, "rb") as f:
            img_bytes = f.read()

    try:
        import rembg
        return rembg.remove(img_bytes)
    except Exception as e:
        logger.warning(f"rembg model inference failed, using high-quality alpha cutout: {e}")
        from PIL import Image
        img = Image.open(BytesIO(img_bytes)).convert("RGBA")
        datas = img.getdata()

        w, h = img.size
        corners = [img.getpixel((0, 0)), img.getpixel((w - 1, 0)), img.getpixel((0, h - 1)), img.getpixel((w - 1, h - 1))]
        bg_r = sum(c[0] for c in corners) // 4
        bg_g = sum(c[1] for c in corners) // 4
        bg_b = sum(c[2] for c in corners) // 4

        newData = []
        for item in datas:
            dist = abs(item[0] - bg_r) + abs(item[1] - bg_g) + abs(item[2] - bg_b)
            if dist < 45 or (item[0] > 240 and item[1] > 240 and item[2] > 240):
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)
        img.putdata(newData)
        out_buf = BytesIO()
        img.save(out_buf, format="PNG")
        return out_buf.getvalue()


# -------------------------------------------------------------------------
# COGNITIVE SIDEKICK AI AGENT (SHOPIFY SIDEKICK STANDARD)
# -------------------------------------------------------------------------
class SidekickAgent:
    def __init__(self, store: Store, lang: str = "ru"):
        self.store = store
        self.lang = lang.lower() if lang in ["ru", "uz", "en"] else "ru"

    def get_store_context(self) -> dict:
        """Extracts comprehensive store knowledge."""
        total_products = Product.objects.filter(store=self.store).count()
        active_products = Product.objects.filter(store=self.store, is_active=True).count()
        low_stock_count = Product.objects.filter(store=self.store, track_stock=True, stock__lte=5).count()
        out_of_stock_count = Product.objects.filter(store=self.store, track_stock=True, stock__lte=0).count()
        total_orders = Order.objects.filter(store=self.store).count()
        total_customers = Customer.objects.filter(store=self.store).count()
        
        categories = list(Category.objects.filter(store=self.store, is_active=True).values_list("name_uz", "name_ru")[:10])
        
        # 7-day analytics
        seven_days_ago = timezone.now() - timedelta(days=7)
        recent_sales = Order.objects.filter(
            store=self.store,
            created_at__gte=seven_days_ago,
            status__in=[Order.OrderStatuses.COMPLETED, Order.OrderStatuses.IN_DELIVERY, Order.OrderStatuses.PROCESSING]
        ).aggregate(total=Sum("total_amount"), count=Count("id"), avg=Avg("total_amount"))

        revenue_7d = float(recent_sales["total"] or 0)
        orders_7d = recent_sales["count"] or 0
        avg_check_7d = float(recent_sales["avg"] or 0)

        # Today sales
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_sales = Order.objects.filter(
            store=self.store,
            created_at__gte=today_start,
            status__in=[Order.OrderStatuses.COMPLETED, Order.OrderStatuses.IN_DELIVERY, Order.OrderStatuses.PROCESSING]
        ).aggregate(total=Sum("total_amount"), count=Count("id"))
        today_revenue = float(today_sales["total"] or 0)
        today_orders = today_sales["count"] or 0

        # Top product
        top_prod = (
            OrderItem.objects.filter(order__store=self.store, order__created_at__gte=seven_days_ago)
            .values("product_name")
            .annotate(qty=Sum("quantity"))
            .order_by("-qty")
            .first()
        )
        top_product_name = top_prod["product_name"] if top_prod else "Данные собираются"

        return {
            "store_name": self.store.name,
            "subdomain": self.store.subdomain,
            "total_products": total_products,
            "active_products": active_products,
            "low_stock_count": low_stock_count,
            "out_of_stock_count": out_of_stock_count,
            "total_orders": total_orders,
            "total_customers": total_customers,
            "today_revenue": today_revenue,
            "today_orders": today_orders,
            "revenue_7d": revenue_7d,
            "orders_7d": orders_7d,
            "avg_check_7d": avg_check_7d,
            "top_product_name": top_product_name,
            "categories": [c[1] or c[0] for c in categories],
        }

    # ---------------------------------------------------------------------
    # DEEP ANALYTICS & BUSINESS INSIGHTS
    # ---------------------------------------------------------------------
    def handle_analytics_insight(self, query: str) -> dict:
        now = timezone.now()
        is_today = bool(re.search(r'(?:сегодня|bugun|today)', query, re.IGNORECASE))
        is_month = bool(re.search(r'(?:месяц|oy|month|30)', query, re.IGNORECASE))

        if is_today:
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            period_ru, period_uz, period_en = "за сегодня", "bugun", "today"
        elif is_month:
            start_date = now - timedelta(days=30)
            period_ru, period_uz, period_en = "за последние 30 дней", "oxirgi 30 kunda", "over the last 30 days"
        else:
            start_date = now - timedelta(days=7)
            period_ru, period_uz, period_en = "за последние 7 дней", "oxirgi 7 kunda", "over the last 7 days"

        orders_qs = Order.objects.filter(store=self.store, created_at__gte=start_date)
        total_orders = orders_qs.count()
        completed_orders = orders_qs.filter(status=Order.OrderStatuses.COMPLETED).count()

        rev_agg = orders_qs.filter(
            status__in=[Order.OrderStatuses.COMPLETED, Order.OrderStatuses.IN_DELIVERY, Order.OrderStatuses.PROCESSING]
        ).aggregate(total=Sum("total_amount"), avg=Avg("total_amount"))

        revenue = float(rev_agg["total"] or 0)
        avg_check = float(rev_agg["avg"] or 0)

        top_items = list(
            OrderItem.objects.filter(order__in=orders_qs)
            .values("product_name")
            .annotate(qty=Sum("quantity"), sum=Sum("total_price"))
            .order_by("-qty")[:3]
        )

        top_name = top_items[0]["product_name"] if top_items else "Товары каталога"
        top_qty = top_items[0]["qty"] if top_items else 0

        # Construct analytical advice
        if self.lang == "uz":
            text = (
                f"📊 **Savdo va dinamika tahlili ({period_uz})**\n\n"
                f"Do'koningizda umumiy tushum **{int(revenue):,} UZS**ni tashkil qildi. "
                f"Jami **{total_orders} ta buyurtma** qabul qilindi, shulardan {completed_orders} tasi to'liq yetkazib berildi.\n"
                f"• **O'rtacha xarid cheki:** **{int(avg_check):,} UZS**\n"
                f"• **Asosiy yetakchi tovar:** **{top_name}** ({top_qty} dona sotildi)\n\n"
                f"💡 **Sidekick Biznes Tavsiyasi:**\n"
                f"1. **Chekni kattalashtirish:** O'rtacha chekni 15-20% ga oshirish uchun eng ko'p sotilayotgan *{top_name}* bilan birga qo'shimcha tovarlarga (aksessuarlar yoki ichimliklar) to'plamli chegirma (Bundle) e'lon qilishni tavsiya qilaman.\n"
                f"2. **Qayta xaridlar:** Oxirgi xaridorlarga minnatdorchilik SMS/Telegram xabarnomasi va 10% chegirmali promokod yuborsak, takroriy xaridlar ko'payadi."
            )
        elif self.lang == "en":
            text = (
                f"📊 **Sales Analytics & Insights ({period_en})**\n\n"
                f"Your store generated **{int(revenue):,} UZS** across **{total_orders} orders** ({completed_orders} successfully completed).\n"
                f"• **Average Order Value (AOV):** **{int(avg_check):,} UZS**\n"
                f"• **Best Seller:** **{top_name}** ({top_qty} units sold)\n\n"
                f"💡 **Sidekick Growth Advice:**\n"
                f"1. **Cross-selling:** To boost your AOV by 15-20%, bundle *{top_name}* with complementary catalog items at a 10% bundle discount.\n"
                f"2. **Retention:** Customers who ordered this week are primed for re-engagement. Send them a thank-you promo code to drive repeat purchases."
            )
        else: # Russian
            text = (
                f"📊 **Анализ продаж и бизнес-динамика {period_ru}**\n\n"
                f"Выручка вашего магазина составила **{int(revenue):,} UZS** при **{total_orders} заказах** ({completed_orders} успешно доставлено).\n"
                f"• **Средний чек:** **{int(avg_check):,} UZS**\n"
                f"• **Хит продаж:** **{top_name}** (продано: {top_qty} шт.)\n\n"
                f"💡 **Мои рекомендации для роста выручки:**\n"
                f"1. **Увеличение среднего чека:** Товар *{top_name}* генерирует основной трафик. Рекомендую настроить акцию «Купи {top_name} + второй товар со скидкой 15%» — это поднимет средний чек на 20-25%.\n"
                f"2. **Повторные продажи:** Покупателям этой недели стоит отправить персонализированный промокод в Telegram, чтобы стимулировать повторный заказ в течение 7 дней."
            )

        return {
            "text": text,
            "action_type": "analytics_report",
            "action_data": {
                "period": period_ru if self.lang == "ru" else (period_uz if self.lang == "uz" else period_en),
                "revenue": revenue,
                "orders_count": total_orders,
                "completed_count": completed_orders,
                "avg_check": avg_check,
                "top_products": top_items,
            },
            "suggestions": [
                "Какие товары заканчиваются на складе?",
                "Создать промокод на 15%",
                "Сделай скидку 10% на все товары",
            ]
        }

    # ---------------------------------------------------------------------
    # INVENTORY & WAREHOUSE REASONING
    # ---------------------------------------------------------------------
    def handle_inventory_insight(self, query: str) -> dict:
        low_stock = Product.objects.filter(store=self.store, track_stock=True, stock__lte=5).order_by("stock")
        out_of_stock = low_stock.filter(stock__lte=0)
        total_catalog = Product.objects.filter(store=self.store).count()
        total_units = Product.objects.filter(store=self.store, track_stock=True).aggregate(s=Sum("stock"))["s"] or 0

        count_low = low_stock.count()
        count_zero = out_of_stock.count()

        items_data = []
        lines = []
        for p in low_stock[:6]:
            tag = "🔴 Закончился (0 шт)" if p.stock <= 0 else f"🟡 Осталось: {p.stock} шт"
            lines.append(f"• **{p.name_ru or p.name_uz}** — {tag} ({int(p.price):,} UZS)")
            items_data.append({"id": p.id, "name": p.name_ru or p.name_uz, "stock": p.stock, "price": float(p.price)})

        if count_low == 0:
            if self.lang == "uz":
                text = f"✅ Ombordagi zaxiralar barqaror! Barcha {total_catalog} ta tovar bo'yicha yetarli qoldiq mavjud (jami {total_units} dona)."
            elif self.lang == "en":
                text = f"✅ Inventory is healthy! All {total_catalog} catalog products have sufficient stock (total {total_units} units)."
            else:
                text = f"✅ Складской баланс в норме! Все {total_catalog} товаров каталога имеют стабильный запас (всего {total_units} единиц)."
        else:
            if self.lang == "uz":
                text = (
                    f"⚠️ **Ombor holati va ta'minot bo'yicha ogohlantirish:**\n\n"
                    f"Hozirda **{count_low} ta tovar** zaxirasi kritik darajada kam (shundan **{count_zero} tasi** butunlay tugagan):\n\n"
                    + "\n".join(lines) + "\n\n"
                    f"💡 **Tavsiya:** Ushbu tovarlarga talab yuqori bo'lgani sababli, savdo to'xtab qolmasligi uchun zudlik bilan ta'minotchiga zakaz berishni va tugagan tovarlarni vaqtincha vitrinada 'Tugagan' holatiga o'tkazishni maslahat beraman."
                )
            elif self.lang == "en":
                text = (
                    f"⚠️ **Inventory Alert & Restock Recommendations:**\n\n"
                    f"Currently **{count_low} products** are running low on stock (**{count_zero} completely out of stock**):\n\n"
                    + "\n".join(lines) + "\n\n"
                    f"💡 **Recommendation:** Reorder these items immediately to avoid lost revenue during peak shopping hours."
                )
            else:
                text = (
                    f"⚠️ **Анализ склада и критические остатки:**\n\n"
                    f"Обнаружено **{count_low} товаров** с критическим запасом (**{count_zero} позиций полностью распроданы**):\n\n"
                    + "\n".join(lines) + "\n\n"
                    f"💡 **Стратегический совет:** Не откладывайте закупку хитов продаж. Каждый день отсутствия этих товаров на складе снижает потенциальную выручку магазина на 10-15%."
                )

        return {
            "text": text,
            "action_type": "inventory_report",
            "action_data": {
                "total_catalog": total_catalog,
                "total_units": total_units,
                "low_stock_count": count_low,
                "out_of_stock_count": count_zero,
                "items": items_data,
            },
            "suggestions": ["Создать новый товар", "Сгенерировать студийное фото товара", "Отчет по продажам"]
        }

    # ---------------------------------------------------------------------
    # IMAGE GENERATION & STUDIO EDITING
    # ---------------------------------------------------------------------
    def handle_image_generation(self, query: str) -> dict:
        """Creates professional 1024x1024 studio product images on Apple Silicon M2."""
        from .services_image import generate_studio_product_image

        q_low = query.lower()
        if any(k in q_low for k in ["светл", "бел", "white", "oq", "light"]):
            theme = "clean_white"
        elif any(k in q_low for k in ["бургер", "пицц", "еда", "кофе", "burger", "pizza", "food", "стейк", "кухн"]):
            theme = "gourmet_warm"
        else:
            theme = "dark_luxury"

        # Clean query to extract target product title across RU, UZ, EN
        cleaned = re.sub(
            r'^(?:сгенерируй|создай|сделай|нарисуй|rasm\s+yarat|generate|create)\s*(?:студийное|промо|коммерческое|красивое|новое|studio|a\s+studio)?\s*(?:изображение|фото|картинку|баннер|арт|image|photo|artwork|product\s+artwork)?\s*(?:для\s+товара|товара|для|uchun|for)?\s*',
            '',
            query,
            flags=re.IGNORECASE
        ).strip()
        # Strip suffix commands (Uzbek / English / Russian grammar)
        cleaned = re.sub(
            r'\s*(?:uchun)?\s*(?:studiya\s+)?(?:rasmi(?:ni)?|foto(?:si|sini)?|rasm(?:ini)?)\s*(?:yarat(?:ish)?|tayyorla(?:sh)?|qil).*$',
            '',
            cleaned,
            flags=re.IGNORECASE
        ).strip()
        cleaned = re.sub(r'\s*(?:for\s+ecommerce|studio\s+shot|packshot).*$', '', cleaned, flags=re.IGNORECASE).strip()
        cleaned = re.sub(r'\b(?:в\s+светлом\s+стиле|в\s+темном\s+стиле|светлое|темное|oq\s+stil|dark|white)\b', '', cleaned, flags=re.IGNORECASE).strip()
        cleaned = re.sub(r'[«»"\'\.]', '', cleaned).strip()

        prod_qs = Product.objects.filter(store=self.store)
        target = None
        for p in prod_qs:
            p_name = (p.name_ru or p.name_uz or "").lower()
            if p_name and cleaned and (p_name in cleaned.lower() or cleaned.lower() in p_name):
                target = p
                break

        item_title = cleaned if cleaned else (target.name_ru if target else "Премиальный товар")
        cat_title = target.category.name_ru if target and target.category else ("Еда & Меню" if theme == "gourmet_warm" else "Коллекция 2026")
        price_val = float(target.price) if target else 240000

        image_url = generate_studio_product_image(
            product_name=item_title,
            category_name=cat_title,
            price=price_val,
            store_name=self.store.name,
            theme=theme,
            store=self.store
        )

        # Attach as primary image if product exists
        if target:
            rel = image_url.replace(settings.MEDIA_URL, "")
            pi = ProductImage.objects.create(product=target, image=rel, is_primary=True, sort_order=0)
            target.images.exclude(id=pi.id).update(is_primary=False)
            target.image_url = image_url
            target.save(update_fields=["image_url"])

        if self.lang == "uz":
            theme_name = "Oq studiya" if theme == "clean_white" else ("Issiq gourmet studiya" if theme == "gourmet_warm" else "Dark Luxury studiya")
            text = (
                f"🎨 **«{item_title}» uchun tijoriy sifatdagi studiya rasmi yaratildi!**\n\n"
                f"• **O'lchami:** 1024x1024 HD E-Commerce Commercial Visual\n"
                f"• **Uslub:** {theme_name} (Apple Silicon M2)\n"
                f"• **Holat:** Tovar kartochkasi uchun tayyor."
            )
        elif self.lang == "en":
            theme_name = "Clean White Studio" if theme == "clean_white" else ("Gourmet Warm Studio" if theme == "gourmet_warm" else "Dark Luxury Showcase")
            text = (
                f"🎨 **Commercial Studio Artwork generated for «{item_title}»!**\n\n"
                f"• **Resolution:** 1024x1024 HD Commercial Grade\n"
                f"• **Atmosphere:** {theme_name} (Apple Silicon M2)\n"
                f"• **Status:** Ready for your storefront and promotions."
            )
        else:
            theme_name = "Светлая минималистичная студия" if theme == "clean_white" else ("Теплая студия Gourmet" if theme == "gourmet_warm" else "Темная витрина Dark Luxury")
            text = (
                f"🎨 **Коммерческий студийный визуал для «{item_title}» создан!**\n\n"
                f"• **Разрешение:** 1024x1024 HD Studio E-Commerce\n"
                f"• **Атмосфера:** {theme_name} (Apple Silicon M2)\n"
                f"• **Статус:** Высокое качество, реалистичный свет и тени."
            )

        return {
            "thought": f"Сгенерирован студийный визуал 1024x1024 для {item_title}",
            "tool_called": "generate_product_image",
            "text": text,
            "action_type": "image_generated",
            "action_data": {
                "product_id": target.id if target else None,
                "product_name": item_title,
                "image_url": image_url,
                "theme": theme,
            },
            "suggestions": ["Удали фон с фото товара", "Сгенерируй SEO описание для товара", "Отчет по продажам"]
        }

    def handle_banner_generation(self, query: str) -> dict:
        """Generates 1200x630 e-commerce promotional banner both as image and HTML5 Canvas spec."""
        from .services_image import generate_store_banner_image

        prod_qs = Product.objects.filter(store=self.store)
        target = None
        for p in prod_qs:
            p_name = (p.name_ru or p.name_uz or "").lower()
            if p_name and p_name in query.lower():
                target = p
                break
        if not target and prod_qs.exists():
            target = prod_qs.first()

        item_title = (target.name_ru or target.name_uz) if target else "Хит Сезона"
        price = float(target.price) if target else 280000
        old_price = float(target.old_price) if target and target.old_price else price * 1.25

        q_low = query.lower()
        if any(k in q_low for k in ["emerald", "зелен", "yashil", "green"]):
            theme = "emerald_fresh"
        elif any(k in q_low for k in ["sunset", "оранж", "sunset", "qizil", "red"]):
            theme = "sunset_gradient"
        elif any(k in q_low for k in ["white", "светл", "бел", "oq"]):
            theme = "clean_white"
        else:
            theme = "dark_luxury"

        badge_match = re.search(r'(\d+)\s*%', query)
        discount_num = badge_match.group(1) if badge_match else "20"

        if self.lang == "uz":
            headline = f"YANGI TO'PLAM 2026"
            subheadline = f"{item_title} — Maxsus narxda premium sifat"
            badge = f"-{discount_num}% CHEGIRMA"
            text = (
                f"🎨 **«{item_title}» uchun zamonaviy reklama banneri yaratildi!**\n\n"
                f"• **O'lchami:** 1200x630 E-Commerce HD Banner\n"
                f"• **Format:** Vitrina va ijtimoiy tarmoqlar (Telegram, Instagram) uchun mos\n"
                f"• **Chegirma tegi:** {badge}\n"
                f"• **Interaktiv Studio:** Quyidagi HTML5 Canvas orqali ranglarni o'zgartirishingiz va yuklab olishingiz mumkin."
            )
        elif self.lang == "en":
            headline = f"LIMITED DROP 2026"
            subheadline = f"{item_title} — Premium craftsmanship and comfort"
            badge = f"-{discount_num}% OFF SALE"
            text = (
                f"🎨 **Promotional Advertising Banner generated for «{item_title}»!**\n\n"
                f"• **Resolution:** 1200x630 E-Commerce HD Banner\n"
                f"• **Badge:** {badge}\n"
                f"• **Interactive Studio:** Rendered on live HTML5 Canvas below with instant PNG download and theme switcher."
            )
        else:
            headline = f"ГОРЯЧЕЕ ПРЕДЛОЖЕНИЕ 2026"
            subheadline = f"{item_title} — Премиальное качество по специальной цене"
            badge = f"-{discount_num}% СКИДКА"
            text = (
                f"🎨 **Рекламный баннер для «{item_title}» успешно сгенерирован!**\n\n"
                f"• **Разрешение:** 1200x630 E-Commerce HD Promo Banner\n"
                f"• **Формат:** Для витрины магазина, промо-рассылок и соцсетей\n"
                f"• **Скидочный бейдж:** {badge}\n"
                f"• **Интерактивный холст:** Ниже доступен живой HTML5 Canvas рендер с возможностью смены темы и скачивания в PNG."
            )

        banner_url = generate_store_banner_image(
            headline=headline,
            subheadline=subheadline,
            badge=badge,
            product_name=item_title,
            price=price,
            old_price=old_price,
            store_name=self.store.name,
            theme=theme,
            store=self.store
        )

        return {
            "thought": f"Сгенерирован рекламный баннер для {item_title} со скидкой {discount_num}%",
            "tool_called": "generate_banner",
            "text": text,
            "action_type": "banner_generated",
            "action_data": {
                "headline": headline,
                "subheadline": subheadline,
                "badge": badge,
                "product_name": item_title,
                "price": price,
                "old_price": old_price,
                "theme": theme,
                "image_url": banner_url,
                "store_name": self.store.name,
            },
            "suggestions": [
                "Сделай скидку 10% на все товары",
                "Создать промокод на 15%",
                "Удали фон у товара"
            ]
        }

    def handle_studio_background_removal(self, query: str) -> dict:
        """Removes background and composites onto realistic studio canvas."""
        from .services_image import remove_and_studio_composite

        prod_qs = Product.objects.filter(store=self.store)
        target = None

        id_match = re.search(r'#?(\d+)', query)
        if id_match:
            target = prod_qs.filter(id=int(id_match.group(1))).first()

        if not target:
            for p in prod_qs:
                p_name = (p.name_ru or p.name_uz or "").lower()
                if p_name and p_name in query.lower():
                    target = p
                    break

        if not target:
            for p in prod_qs.order_by("-id"):
                if p.primary_image:
                    target = p
                    break

        if not target or not target.primary_image:
            return {
                "text": "Для удаления фона нужен товар с загруженной фотографией. Укажите название или ID товара (например: *«Удали фон у товара Худи»*).",
                "action_type": "warning"
            }

        try:
            enhanced_url = remove_and_studio_composite(target.primary_image.path, studio_style="clean_white")
            rel = enhanced_url.replace(settings.MEDIA_URL, "")

            pi = ProductImage.objects.create(product=target, image=rel, is_primary=True, sort_order=0)
            target.images.exclude(id=pi.id).update(is_primary=False)
            target.image_url = enhanced_url
            target.save(update_fields=["image_url"])

            if self.lang == "uz":
                text = (
                    f"✨ **{target.name_uz} fotosi mukammal tozalandi va studiya foniga joylashtirildi!**\n\n"
                    f"• Ortiqcha fon olib tashlandi (rembg AI).\n"
                    f"• Tabiiy yumshoq soya va tiniq vitrina foni qo'shildi."
                )
            elif self.lang == "en":
                text = (
                    f"✨ **Background successfully removed and studio enhanced for {target.name_ru}!**\n\n"
                    f"• Isolated product using local rembg AI engine.\n"
                    f"• Placed onto a clean studio canvas with realistic ambient shadow."
                )
            else:
                text = (
                    f"✨ **Фон у товара «{target.name_ru}» успешно удален и заменен на студийный!**\n\n"
                    f"• Нейросеть `rembg` вырезала объект без потери деталей.\n"
                    f"• Добавлена реалистичная мягкая тень и чистый светлый студийный градиент."
                )

            return {
                "text": text,
                "action_type": "image_processed",
                "action_data": {
                    "product_id": target.id,
                    "product_name": target.name_ru or target.name_uz,
                    "new_image_url": enhanced_url,
                },
                "suggestions": [f"Сгенерируй SEO описание для {target.name_ru}", "Создать промокод на 15%"]
            }
        except Exception as e:
            logger.error(f"Studio background removal error: {e}")
            return {"text": f"Ошибка обработки: {str(e)}", "action_type": "error"}

    # ---------------------------------------------------------------------
    # PRODUCT & PROMO ACTIONS
    # ---------------------------------------------------------------------
    def handle_create_product(self, query: str) -> dict:
        price_match = re.search(r'(\d+[\d\s.,]*)\s*(?:сум|uzs|руб|so\'m)', query, re.IGNORECASE)
        price = 150000
        if price_match:
            try:
                price = float(price_match.group(1).replace(" ", "").replace(",", ""))
            except ValueError:
                pass
        else:
            nums = re.findall(r'\b\d{4,9}\b', query)
            if nums:
                price = float(nums[0])

        stock_match = re.search(r'(\d+)\s*(?:шт|dona|штук|pcs)', query, re.IGNORECASE)
        stock = 20
        if stock_match:
            try:
                stock = int(stock_match.group(1))
            except ValueError:
                pass

        cleaned = re.sub(
            r'^(?:создай\s+товар|добавь\s+товар|yangi\s+mahsulot|mahsulot\s+qo\'sh|create\s+product|add\s+product)\s*',
            '',
            query,
            flags=re.IGNORECASE
        )
        cleaned = re.sub(r'(\d+[\d\s.,]*)\s*(?:сум|uzs|руб|so\'m)', '', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'(\d+)\s*(?:шт|dona|штук|pcs)', '', cleaned, flags=re.IGNORECASE).strip()

        name = cleaned or "Премиальный товар"
        slug = f"{slugify(name) or 'prod'}-{uuid.uuid4().hex[:4]}"
        first_cat = Category.objects.filter(store=self.store, is_active=True).first()

        product = Product.objects.create(
            store=self.store,
            category=first_cat,
            name_ru=name,
            name_uz=name,
            name_en=name,
            slug=slug,
            price=Decimal(str(price)),
            stock=stock,
            track_stock=True,
            is_active=True,
            unit=Product.Units.DONA,
        )

        # Auto-generate studio artwork for new product!
        from .services_image import generate_studio_product_image
        img_url = generate_studio_product_image(
            product_name=name,
            category_name=first_cat.name_ru if first_cat else "Каталог",
            price=price,
            store_name=self.store.name
        )
        rel_img = img_url.replace(settings.MEDIA_URL, "")
        ProductImage.objects.create(product=product, image=rel_img, is_primary=True, sort_order=0)
        product.image_url = img_url
        product.save(update_fields=["image_url"])

        if self.lang == "uz":
            text = (
                f"✅ **Yangi tovar «{product.name_uz}» yaratildi va vitrinaga joylashtirildi!**\n\n"
                f"• **Narxi:** {int(product.price):,} UZS\n"
                f"• **Zaxira:** {product.stock} dona\n"
                f"• **Kategoriya:** {first_cat.name_uz if first_cat else 'Asosiy'}\n"
                f"• **AI Studio Foto:** Avtomatik generatsiya qilinib, biriktirildi."
            )
        elif self.lang == "en":
            text = (
                f"✅ **Product «{product.name_ru}» created and live in your store!**\n\n"
                f"• **Price:** {int(product.price):,} UZS\n"
                f"• **Initial Stock:** {product.stock} units\n"
                f"• **AI Studio Image:** Automatically generated and assigned as primary."
            )
        else:
            text = (
                f"✅ **Товар «{product.name_ru}» успешно создан и опубликован!**\n\n"
                f"• **Цена:** {int(product.price):,} UZS\n"
                f"• **Остаток на складе:** {product.stock} шт.\n"
                f"• **Категория:** {first_cat.name_ru if first_cat else 'Основная'}\n"
                f"• **AI Визуал:** Сгенерировано студийное промо-фото и установлено главным."
            )

        return {
            "text": text,
            "action_type": "product_created",
            "action_data": {
                "id": product.id,
                "name": product.name_ru,
                "price": float(product.price),
                "stock": product.stock,
                "image_url": img_url,
                "slug": product.slug,
            },
            "suggestions": [f"Сгенерируй SEO описание для {product.name_ru}", "Сделай скидку 10% на все товары"]
        }

    def handle_create_promocode(self, query: str) -> dict:
        code_match = re.search(r'(?:промокод|kod|promocode|code)\s+([A-Za-z0-9_-]{3,20})', query, re.IGNORECASE)
        code = code_match.group(1).upper() if code_match else f"SAVE{uuid.uuid4().hex[:4].upper()}"

        percent_match = re.search(r'(\d+)\s*%', query)
        discount_val = 15
        if percent_match:
            discount_val = int(percent_match.group(1))

        promo, _ = PromoCode.objects.update_or_create(
            store=self.store,
            code=code,
            defaults={
                "discount_type": PromoCode.DiscountTypes.PERCENT,
                "discount_value": Decimal(str(discount_val)),
                "min_order_amount": Decimal("100000"),
                "max_uses": 100,
                "is_active": True,
            }
        )

        if self.lang == "uz":
            text = (
                f"🎁 **Promokod «{promo.code}» faollashtirildi!**\n\n"
                f"• **Chegirma:** {discount_val}%\n"
                f"• **Minimal buyurtma summasi:** 100,000 UZS\n"
                f"• **Foydalanish chegarasi:** 100 ta mijoz\n\n"
                f"💡 **Tavsiya:** Ushbu promokodni Telegram kanalingizda yoki Instagram stories'da e'lon qilib, konversiyani 30% ga oshirishingiz mumkin."
            )
        elif self.lang == "en":
            text = (
                f"🎁 **Promo Code «{promo.code}» is now active!**\n\n"
                f"• **Discount:** {discount_val}% OFF\n"
                f"• **Min Order:** 100,000 UZS\n"
                f"• **Usage Limit:** 100 redemptions\n\n"
                f"💡 **Growth tip:** Share this promo code in your marketing channels to drive immediate cart checkouts."
            )
        else:
            text = (
                f"🎁 **Промокод «{promo.code}» успешно запущен!**\n\n"
                f"• **Скидка:** {discount_val}%\n"
                f"• **Минимальный чек:** 100,000 UZS\n"
                f"• **Лимит использований:** 100 раз\n\n"
                f"💡 **Бизнес-совет:** Опубликуйте этот промокод в Telegram-канале магазина или сделайте рассылку — это даст быстрый приток заказов в течение первых 24 часов."
            )

        return {
            "text": text,
            "action_type": "promocode_created",
            "action_data": {
                "id": promo.id,
                "code": promo.code,
                "discount_value": discount_val,
                "min_order_amount": 100000,
            },
            "suggestions": ["Покажи отчет по продажам", "Какие товары заканчиваются?"]
        }

    def handle_generate_description(self, query: str) -> dict:
        """Generates persuasive selling copy, key benefits, and SEO metadata."""
        prod_qs = Product.objects.filter(store=self.store)
        target = None

        cleaned = re.sub(
            r'^(?:сгенерируй|создай|напиши|matn\s+yoz|tavsif\s+yoz|generate|write)\s*(?:продающее|сео|seo)?\s*(?:описание|текст|tavsif|description)?\s*(?:для\s+товара|для|uchun|for)?\s*',
            '',
            query,
            flags=re.IGNORECASE
        ).strip()
        cleaned = re.sub(r'[«»"\'\.]', '', cleaned).strip()

        for p in prod_qs:
            p_name = (p.name_ru or p.name_uz or "").lower()
            if p_name and (p_name in cleaned.lower() or cleaned.lower() in p_name):
                target = p
                break
        if not target and prod_qs.exists():
            target = prod_qs.first()

        name = (target.name_ru or target.name_uz) if target else (cleaned or "Эксклюзивный товар")

        if self.lang == "uz":
            title = f"Premium {name} — Yuqori Sifat & Qulaylik"
            desc = (
                f"{name} — zamonaviy uslub va maksimal qulaylikni o'zida mujassam etgan mukammal tanlov. "
                f"Kundalik foydalanish va maxsus tadbirlar uchun a'lo darajada mos keladi. "
                f"Sifatli materiallardan tayyorlangan bo'lib, uzoq vaqt o'z ko'rinishini saqlab qoladi."
            )
            features = [
                "100% kafolatlangan yuqori sifatli xomashyo",
                "Ergonomik qulay bichim va zamonaviy dizayn",
                "O'zbekiston bo'ylab tezkor yetkazib berish xizmati",
                "Oson parvarish va uzoq muddatli chidamlilik"
            ]
            tags = [slugify(name), "moda", "uzbekistan", "sifat", "onlineshop", "storebox"]
            text = (
                f"✍️ **«{name}» uchun sotuvchi tavsif va SEO teglari tayyorlandi!**\n\n"
                f"📌 **Sarlavha:** {title}\n\n"
                f"📝 **Tavsif:**\n{desc}\n\n"
                f"✨ **Afzalliklari:**\n" + "\n".join(f"• {f}" for f in features) + "\n\n"
                f"🔍 **SEO kalit so'zlari:** `{'`, `'.join(tags)}`"
            )
        elif self.lang == "en":
            title = f"Premium {name} — Contemporary Luxury & Comfort"
            desc = (
                f"Elevate your lifestyle with the {name}. Crafted with meticulous attention to detail, "
                f"this piece pairs modern aesthetics with daily functionality. Built for longevity and effortless elegance."
            )
            features = [
                "Crafted from premium, durable high-grade materials",
                "Tailored modern ergonomic fit for all-day comfort",
                "Fast, insured doorstep shipping nationwide",
                "Fade-resistant colors and easy maintenance"
            ]
            tags = [slugify(name), "trending", "ecommerce", "luxury", "storebox"]
            text = (
                f"✍️ **High-Converting Product Description & SEO generated for «{name}»!**\n\n"
                f"📌 **Title:** {title}\n\n"
                f"📝 **Description:**\n{desc}\n\n"
                f"✨ **Key Benefits:**\n" + "\n".join(f"• {f}" for f in features) + "\n\n"
                f"🔍 **SEO Tags:** `{'`, `'.join(tags)}`"
            )
        else:
            title = f"Премиальный {name} — Безупречное качество и стиль"
            desc = (
                f"{name} — идеальный выбор для тех, кто ценит эстетику, надежность и бескомпромиссный комфорт. "
                f"Продуманный до мелочей дизайн подчеркнет вашу индивидуальность как в повседневном ритме, так и на особых встречах. "
                f"Изготовлен из отборных износостойких материалов, сохраняющих первозданный вид годами."
            )
            features = [
                "100% экологичные и долговечные материалы высшей категории",
                "Идеальная анатомическая посадка и продуманный крой",
                "Экспресс-доставка прямо до двери по всему Узбекистану",
                "Гарантия качества и простота в повседневном уходе"
            ]
            tags = [slugify(name), "премиум", "тренды2026", "доставка", "онлайнмагазин", "storebox"]
            text = (
                f"✍️ **Продающее описание и SEO-теги для «{name}» готовы!**\n\n"
                f"📌 **Заголовок:** {title}\n\n"
                f"📝 **Продающий текст:**\n{desc}\n\n"
                f"✨ **Ключевые преимущества:**\n" + "\n".join(f"• {f}" for f in features) + "\n\n"
                f"🔍 **SEO Теги:** `{'`, `'.join(tags)}`"
            )

        if target:
            target.description_ru = desc
            target.description_uz = desc
            target.save(update_fields=["description_ru", "description_uz"])

        return {
            "text": text,
            "action_type": "seo_description_generated",
            "action_data": {
                "product_id": target.id if target else None,
                "product_name": name,
                "title": title,
                "description": desc,
                "features": features,
                "tags": tags,
            },
            "suggestions": ["Создай студийное фото товара", "Удали фон у товара", "Отчет по продажам"]
        }

    def handle_bulk_discount(self, query: str) -> dict:
        """Applies bulk discount to products in catalog."""
        pct_match = re.search(r'(\d+)\s*%', query)
        discount_pct = int(pct_match.group(1)) if pct_match else 10

        prod_qs = Product.objects.filter(store=self.store, is_active=True)[:30]
        count = 0
        samples = []

        multiplier = Decimal(str((100 - discount_pct) / 100))
        for p in prod_qs:
            prev_price = p.price
            if not p.old_price or p.old_price <= p.price:
                p.old_price = prev_price
            new_price = (prev_price * multiplier).quantize(Decimal('1000'))
            p.price = new_price
            p.save(update_fields=["price", "old_price"])
            count += 1
            if len(samples) < 3:
                samples.append({
                    "name": p.name_ru or p.name_uz,
                    "old_price": float(prev_price),
                    "new_price": float(new_price)
                })

        if self.lang == "uz":
            text = (
                f"⚡ **Barcha tovarlarga {discount_pct}% chegirma muvaffaqiyatli qo'llandi!**\n\n"
                f"Jami **{count} ta tovar** narxi pasaytirildi. Eski narxlar 'Chizilgan narx' holatiga o'tkazildi, "
                f"xaridorlar endi tejab qolgan summasini aniq ko'rishadi.\n\n"
                f"📊 **Namunaviy narxlar:**\n"
                + "\n".join(f"• {s['name']}: ~{int(s['old_price']):,} UZS~ ➡️ **{int(s['new_price']):,} UZS**" for s in samples)
            )
        elif self.lang == "en":
            text = (
                f"⚡ **{discount_pct}% storewide discount applied across your catalog!**\n\n"
                f"Successfully updated **{count} products**. Original prices have been preserved as strikethrough compare-at values.\n\n"
                f"📊 **Sample pricing:**\n"
                + "\n".join(f"• {s['name']}: ~{int(s['old_price']):,} UZS~ ➡️ **{int(s['new_price']):,} UZS**" for s in samples)
            )
        else:
            text = (
                f"⚡ **Скидка {discount_pct}% успешно применена ко всем товарам каталога!**\n\n"
                f"Обновлено **{count} товаров**. Прежняя цена автоматически сохранена как зачёркнутая, "
                f"что создает триггер выгоды для покупателей на витрине.\n\n"
                f"📊 **Примеры изменений:**\n"
                + "\n".join(f"• {s['name']}: ~{int(s['old_price']):,} UZS~ ➡️ **{int(s['new_price']):,} UZS**" for s in samples)
            )

        return {
            "text": text,
            "action_type": "bulk_discount_applied",
            "action_data": {
                "discount_pct": discount_pct,
                "affected_count": count,
                "samples": samples
            },
            "suggestions": ["Отчет по продажам за неделю", "Создать промокод на 15%", "Какие товары заканчиваются?"]
        }

    def handle_recent_orders(self, query: str) -> dict:
        orders = Order.objects.filter(store=self.store).order_by("-created_at")[:5]
        if not orders.exists():
            msg = (
                "Hozircha do'koningizda yangi buyurtmalar yo'q." if self.lang == "uz" else
                "No orders found in your store yet." if self.lang == "en" else
                "В вашем магазине пока нет оформленных заказов. Запустите акцию или промокод для привлечения покупателей!"
            )
            return {"text": msg, "action_type": "recent_orders", "action_data": {"orders": []}}

        orders_data = []
        lines = []
        for o in orders:
            cust = o.customer_name or (o.customer.full_name if o.customer else "Покупатель")
            st = o.get_status_display() if hasattr(o, "get_status_display") else o.status
            lines.append(f"• **Заказ #{o.id}** — {cust} ({int(o.total_amount):,} UZS) • [{st}]")
            orders_data.append({
                "id": o.id,
                "customer": cust,
                "total": float(o.total_amount),
                "status": st,
                "created_at": o.created_at.strftime("%d.%m.%Y %H:%M")
            })

        if self.lang == "uz":
            text = f"📦 **Oxirgi buyurtmalar ro'yxati:**\n\n" + "\n".join(lines)
        elif self.lang == "en":
            text = f"📦 **Recent store orders:**\n\n" + "\n".join(lines)
        else:
            text = f"📦 **Последние заказы в вашем магазине:**\n\n" + "\n".join(lines)

        return {
            "text": text,
            "action_type": "recent_orders",
            "action_data": {"orders": orders_data},
            "suggestions": ["Отчет по продажам за неделю", "Какие товары заканчиваются?"]
        }

    def handle_growth_strategy(self, query: str) -> dict:
        ctx = self.get_store_context()
        rev = int(ctx["revenue_7d"])
        top = ctx["top_product_name"]

        if self.lang == "uz":
            text = (
                f"📈 **StoreBox Sidekick: Do'koningiz savdosini 30-50% ga oshirish strategiyasi**\n\n"
                f"Hozirgi ko'rsatkichlar tahlilidan kelib chiqib, 3 ta asosiy qadamni tavsiya qilaman:\n\n"
                f"1. **Telegram-bot va vitrina integratsiyasi:** Mijozlar katalogdan to'g'ridan-to'g'ri Telegram orqali xarid qilishlari uchun StoreBox Telegram botingizni faollashtiring.\n"
                f"2. **Vizual sifatni yaxshilash:** Tovar rasmlaridagi ortiqcha fonlarni olib tashlang (`rembg` orqali tozalang) va studiya yoritilishini qo'shing — toza rasm konversiyani 40% ga oshiradi.\n"
                f"3. **Cheklangan vaqtli promokodlar:** *{top}* xarid qilganlarga 10-15% lik shaxsiy promokod taklif qiling — bu takroriy savdolarni keskin ko'paytiradi."
            )
        elif self.lang == "en":
            text = (
                f"📈 **StoreBox Sidekick: Growth Playbook to Scale Revenue by 30-50%**\n\n"
                f"Based on real metrics for {ctx['store_name']}, here is your prioritized action plan:\n\n"
                f"1. **Activate Omnichannel Channels:** Link your store with Telegram Mini Apps for instant social checkouts.\n"
                f"2. **Studio Visual Optimization:** Clean distracting photo backgrounds with AI rembg — crisp studio images convert 40% higher.\n"
                f"3. **Customer Retention:** Retarget recent buyers with a personalized promo code on their next purchase."
            )
        else:
            text = (
                f"📈 **Стратегический план роста выручки StoreBox Sidekick (+30-50%)**\n\n"
                f"На основе текущих показателей вашего магазина ({ctx['total_products']} товаров, выручка {rev:,} UZS):\n\n"
                f"1. **Качественный визуал товаров:** Фотографии на чистом студийном фоне повышают конверсию в заказ на 35-40%. Попросите меня *«Удали фон у товара»* или *«Создай студийное фото»*.\n"
                f"2. **Пакетные скидки (Bundles):** Объедините хит продаж *{top}* с сопутствующими товарами по специальной цене.\n"
                f"3. **Telegram-магазин (TMA):** Подключите Telegram бота в настройках StoreBox — это откроет доступ к аудитории Telegram без необходимости переходить в браузер.\n"
                f"4. **Срочные акции:** Запустите промокод с ограничением по времени (например, скидка 15% на 48 часов)."
            )

        return {
            "text": text,
            "action_type": "growth_advice",
            "action_data": ctx,
            "suggestions": ["Создать промокод на 15%", "Сделай скидку 10% на все товары", "Отчет по продажам за неделю"]
        }

    def handle_product_lookup(self, query: str) -> dict:
        prod_qs = Product.objects.filter(store=self.store)
        target = None
        for p in prod_qs:
            p_name = (p.name_ru or p.name_uz or "").lower()
            if p_name and p_name in query.lower():
                target = p
                break
        if not target:
            target = prod_qs.first()

        if not target:
            return {"text": "В каталоге пока нет товаров.", "action_type": "warning"}

        img_url = target.image_url or (target.primary_image.url if target.primary_image else None)
        status_str = "В наличии" if target.stock > 0 else "Нет на складе"
        if self.lang == "uz":
            text = (
                f"🔍 **«{target.name_uz}» tovari bo'yicha ma'lumot:**\n\n"
                f"• **Narxi:** {int(target.price):,} UZS\n"
                f"• **Qoldiq:** {target.stock} dona ({'Mavjud' if target.stock > 0 else 'Tugagan'})\n"
                f"• **Kategoriya:** {target.category.name_uz if target.category else 'Asosiy'}\n"
                f"• **Holat:** {'Faol' if target.is_active else 'Nofaol'}"
            )
        elif self.lang == "en":
            text = (
                f"🔍 **Details for «{target.name_ru}»:**\n\n"
                f"• **Price:** {int(target.price):,} UZS\n"
                f"• **Inventory:** {target.stock} units ({'In stock' if target.stock > 0 else 'Out of stock'})\n"
                f"• **Category:** {target.category.name_ru if target.category else 'Main'}"
            )
        else:
            text = (
                f"🔍 **Карточка товара «{target.name_ru}»:**\n\n"
                f"• **Цена:** {int(target.price):,} UZS\n"
                f"• **Остаток:** {target.stock} шт. ({status_str})\n"
                f"• **Категория:** {target.category.name_ru if target.category else 'Основная'}\n"
                f"• **Статус:** {'Активен на витрине' if target.is_active else 'Скрыт'}"
            )

        return {
            "text": text,
            "action_type": "product_details",
            "action_data": {
                "id": target.id,
                "name": target.name_ru or target.name_uz,
                "price": float(target.price),
                "stock": target.stock,
                "image_url": img_url,
            },
            "suggestions": [f"Сгенерируй SEO описание для {target.name_ru}", "Удали фон с фото товара"]
        }

    # ---------------------------------------------------------------------
    # MAIN INTELLIGENT DISPATCHER
    # ---------------------------------------------------------------------
    def process_message(self, message: str) -> dict:
        msg = (message or "").strip()
        if not msg:
            return {
                "text": "Здравствуйте! Чем я могу помочь вашему магазину сегодня?",
                "action_type": "greeting",
                "suggestions": ["Отчет по продажам за неделю", "Какие товары заканчиваются?", "Сгенерируй фото товара"]
            }

        # Auto-detect language
        self.lang = detect_query_language(msg, default_lang=self.lang)
        ctx = self.get_store_context()

        # Phase 1: Try Structured Function Calling via Ollama if LLM daemon is running
        fc = call_ollama_function_call(msg, ctx, self.lang)
        if fc and fc.get("tool") and fc["tool"] != "chat_reply":
            tool_name = fc["tool"]
            if tool_name == "generate_banner":
                res = self.handle_banner_generation(msg)
                res["thought"] = fc.get("thought", res.get("thought"))
                return res
            elif tool_name == "generate_product_image":
                res = self.handle_image_generation(msg)
                res["thought"] = fc.get("thought", res.get("thought"))
                return res
            elif tool_name == "remove_background":
                res = self.handle_studio_background_removal(msg)
                res["thought"] = fc.get("thought", res.get("thought"))
                return res
            elif tool_name == "get_sales_analytics":
                res = self.handle_analytics_insight(msg)
                res["thought"] = fc.get("thought", res.get("thought"))
                return res
            elif tool_name == "get_inventory_health":
                res = self.handle_inventory_insight(msg)
                res["thought"] = fc.get("thought", res.get("thought"))
                return res
            elif tool_name == "apply_store_discount":
                res = self.handle_bulk_discount(msg)
                res["thought"] = fc.get("thought", res.get("thought"))
                return res
            elif tool_name == "create_promocode":
                res = self.handle_create_promocode(msg)
                res["thought"] = fc.get("thought", res.get("thought"))
                return res
            elif tool_name == "create_product":
                res = self.handle_create_product(msg)
                res["thought"] = fc.get("thought", res.get("thought"))
                return res
            elif tool_name == "generate_seo_description":
                res = self.handle_generate_description(msg)
                res["thought"] = fc.get("thought", res.get("thought"))
                return res
            elif tool_name == "get_recent_orders":
                res = self.handle_recent_orders(msg)
                res["thought"] = fc.get("thought", res.get("thought"))
                return res
            elif tool_name == "find_product":
                res = self.handle_product_lookup(msg)
                res["thought"] = fc.get("thought", res.get("thought"))
                return res
            elif tool_name == "general_business_advice":
                res = self.handle_growth_strategy(msg)
                res["thought"] = fc.get("thought", res.get("thought"))
                return res

        # Phase 2: High-Precision Multilingual Intent Recognizer (UZ, RU, EN)
        msg_low = msg.lower()

        # 1. Promotional Banner & Visualizer generation
        if (
            any(k in msg_low for k in ["баннер", "banner", "плакат", "постер", "poster"])
            or re.search(r'(?:создай|сделай|сгенерируй|yarat|create|make).*(?:реклам|баннер|banner|poster|плакат)', msg, re.IGNORECASE)
            or re.search(r'(?:реклам|баннер|banner|poster|плакат).*(?:создай|сделай|сгенерируй|yarat|create|make|скидк|chegirma)', msg, re.IGNORECASE)
        ):
            return self.handle_banner_generation(msg)

        # 2. Background removal / studio enhance (rembg)
        if (
            "rembg" in msg_low
            or re.search(r'(?:удали|убрать|убери|очисти|вырежи|remove|tozala|olib\s*tashla).*(?:фон|background|fonini)', msg, re.IGNORECASE)
            or re.search(r'(?:фон|background|fonini).*(?:удали|убрать|убери|очисти|вырежи|remove|tozala|tashla)', msg, re.IGNORECASE)
        ):
            return self.handle_studio_background_removal(msg)

        # 3. Studio product image generation command
        if (
            any(k in msg_low for k in ["студийн", "studio photo", "studio image", "studio rasm", "студийное фото"])
            or re.search(r'(?:сгенерируй|создай|сделай|нарисуй|generate|create|yarat).*(?:изображени|фото|картинк|арт|image|photo|artwork|rasm)', msg, re.IGNORECASE)
            or re.search(r'(?:изображени|фото|картинк|арт|image|photo|artwork|rasm).*(?:сгенерируй|создай|сделай|нарисуй|generate|create|yarat)', msg, re.IGNORECASE)
        ):
            return self.handle_image_generation(msg)

        # 4. Bulk discount (storewide)
        if (
            re.search(r'(?:скидк|chegirma|discount).*(?:все|всех|barcha|all|hamma|katalog|каталог)', msg, re.IGNORECASE)
            or re.search(r'(?:все|всех|barcha|all|hamma|katalog|каталог).*(?:скидк|chegirma|discount)', msg, re.IGNORECASE)
            or "скидка на все" in msg_low or "скидку на все" in msg_low
        ):
            return self.handle_bulk_discount(msg)

        # 5. Promocodes
        if re.search(r'(?:промокод|скидочн|promokod|promocode|kupon|coupon)', msg, re.IGNORECASE):
            return self.handle_create_promocode(msg)

        # 6. SEO description generation
        if (
            re.search(r'(?:описани|seo|tavsif|description)', msg, re.IGNORECASE)
            or re.search(r'(?:продающ|sotuvchi).*(?:текст|matn|описани)', msg, re.IGNORECASE)
        ):
            return self.handle_generate_description(msg)

        # 7. Product creation
        if (
            re.search(r'(?:создай|добавь|добавить|yangi|qo\'sh|create|add).*(?:товар|продукт|mahsulot|product)', msg, re.IGNORECASE)
            or re.search(r'(?:товар|продукт|mahsulot|product).*(?:создай|добавь|добавить|yangi|qo\'sh|create|add)', msg, re.IGNORECASE)
        ):
            return self.handle_create_product(msg)

        # 8. Sales and business analytics
        if re.search(r'(?:отчет|выручк|статистик|аналитик|динамик|hisobot|tushum|daromad|analytics|sales\s*report|revenue)', msg, re.IGNORECASE):
            return self.handle_analytics_insight(msg)

        # 9. Recent orders
        if re.search(r'(?:заказ|buyurtma|order)', msg, re.IGNORECASE):
            return self.handle_recent_orders(msg)

        # 10. Inventory and warehouse
        if re.search(r'(?:остатк|склад|заканчива|закончил|мало|zaxira|qoldiq|ombor|tugay|tugagan|inventory|stock)', msg, re.IGNORECASE):
            return self.handle_inventory_insight(msg)

        # 11. Growth strategy & scaling advice
        if re.search(r'(?:как\s+увеличить|совет|рост|стратеги|qanday\s+oshir|tavsiya|strategiya|growth|advice|scale)', msg, re.IGNORECASE):
            return self.handle_growth_strategy(msg)

        # 12. Product lookup / price inquiry
        if re.search(r'(?:сколько\s+стоит|цена|narxi|bormi|how\s+much)', msg, re.IGNORECASE):
            return self.handle_product_lookup(msg)

        # Phase 3: Conversational LLM Reasoning via Ollama
        sys_prompt = (
            f"You are StoreBox Sidekick, an elite e-commerce AI co-founder for '{ctx['store_name']}'.\n"
            f"Store Data: {ctx['total_products']} products, {ctx['total_orders']} orders, 7-day revenue: {int(ctx['revenue_7d'])} UZS.\n"
            f"Respond in language: {self.lang.upper()} (fluent, friendly, professional business strategist).\n"
            f"Provide insightful, non-robotic business advice, growth ideas, and actionable steps."
        )
        llm_reply = call_ollama(msg, sys_prompt)
        if llm_reply:
            return {
                "thought": "Сгенерирован аналитический ответ от локальной LLM",
                "tool_called": "chat_reply",
                "text": llm_reply,
                "action_type": "chat_reply",
                "suggestions": ["Отчет по продажам за неделю", "Создай рекламный баннер", "Какие товары заканчиваются?"]
            }

        # 13. Intelligent Cognitive Dialogue Fallback (Dynamic Business Brain)
        if self.lang == "uz":
            cognitive_text = (
                f"Salom! Men sizning **StoreBox Sidekick** intellektual biznes-yordamchingizman. 🚀\n\n"
                f"Do'koningiz (**{ctx['store_name']}**) bo'yicha to'liq ma'lumotga egaman: "
                f"katalogda **{ctx['total_products']} ta tovar** va **{ctx['total_orders']} ta buyurtma** mavjud.\n\n"
                f"Sizga quyidagi vazifalarda yordam berishim mumkin:\n"
                f"• 🎨 **AI Studio:** *«Qora xudi uchun studiya rasmini yarat»*\n"
                f"• ✂️ **Fonni tozalash:** *«Tovar fotosidan fonni olib tashla»*\n"
                f"• 📊 **Chuqur tahlil:** *«Oxirgi 7 kunlik savdo hisobotini ber»*\n"
                f"• 📦 **Zaxira nazorati:** *«Qaysi tovarlar tugab bormoqda?»*\n"
                f"• 🎁 **Marketing:** *«Yozgi savdolar uchun 15% li promokod yarat»*\n"
                f"• 🏷️ **Yangi tovar:** *«Yangi tovar qo'sh: Sport krossovka 420000 so'm 25 dona»*"
            )
        elif self.lang == "en":
            cognitive_text = (
                f"Hello! I am your **StoreBox Sidekick** AI co-founder for **{ctx['store_name']}**. 🚀\n\n"
                f"I have direct access to your real store metrics: **{ctx['total_products']} products** and **{ctx['total_orders']} orders**.\n\n"
                f"Ask me to analyze your business or execute actions:\n"
                f"• 🎨 **AI Image Generation:** *'Create a studio product artwork for Hoodie'*\n"
                f"• ✂️ **Background Removal:** *'Remove background from product photo'*\n"
                f"• 📊 **Revenue Breakdown:** *'Show me weekly sales insights'*\n"
                f"• 📦 **Stock Health:** *'Which products are running out of stock?'*\n"
                f"• 🎁 **Marketing:** *'Create a 20% discount promo code'*."
            )
        else:
            cognitive_text = (
                f"Здравствуйте! Я ваш персональный ИИ-партнер **StoreBox Sidekick** для магазина **{ctx['store_name']}**. 🚀\n\n"
                f"Я владею полной картиной вашего бизнеса: в каталоге **{ctx['total_products']} товаров**, обработано **{ctx['total_orders']} заказов**.\n\n"
                f"Вы можете давать мне голосовые и текстовые поручения:\n"
                f"• 🎨 **Генерация фото:** *«Создай студийное изображение для товара Черная худи»*\n"
                f"• ✂️ **Удаление фона:** *«Удали фон у товара и сделай студийный свет»*\n"
                f"• 📊 **Бизнес-аналитика:** *«Покажи отчет по продажам за неделю и дай рекомендации»*\n"
                f"• ⚠️ **Контроль склада:** *«Какие товары заканчиваются на складе?»*\n"
                f"• 🎁 **Промокоды:** *«Создай промокод VIP20 на скидку 20%»*\n"
                f"• 📦 **Быстрое создание товара:** *«Создай товар Белая футболка 180000 сум 30 шт»*"
            )

        return {
            "text": cognitive_text,
            "action_type": "welcome",
            "suggestions": [
                "Отчет по продажам за неделю",
                "Какие товары заканчиваются?",
                "Создай студийное фото товара",
                "Создать промокод на 15%"
            ]
        }
