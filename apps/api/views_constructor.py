from decimal import Decimal
import random
from django.db import transaction
from django.utils.text import slugify
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from apps.catalog.models import Product, Category, ConstructorGroup, ConstructorItem
from apps.orders.permissions import has_staff_permission
from .views_auth import get_merchant_store


PRESETS = {
    "burger": {
        "name_uz": "O'z burgeringizni yig'ing (Konstruktor)",
        "name_ru": "Собери свой Бургер (Конструктор)",
        "name_en": "Build Your Own Burger (Constructor)",
        "price": 35000,
        "description_ru": "Сочный бургер из 100% натурального мяса со свежими овощами. Добавьте любимые топпинги по вкусу.",
        "description_uz": "Shirali go'sht va yangi sabzavotlar. Ta'bingizga ko'ra qo'shimchalar tanlang.",
        "image_url": "/static/images/constructor/real_burger_full.png",
        "groups": [
            {
                "name_ru": "Добавить по вкусу",
                "name_uz": "Ta'bga ko'ra qo'shish",
                "group_type": "QUANTITY",
                "is_required": False,
                "min_required": 0,
                "max_allowed": 10,
                "sort_order": 1,
                "items": [
                    {"name_ru": "Сыр Чеддер", "name_uz": "Chedder pishlog'i", "price": 5000, "is_default": False, "image_url": "/static/images/constructor/mozzarella_cheese.png"},
                    {"name_ru": "Острый перчик халапеньо", "name_uz": "Xalapeno qalampiri", "price": 4000, "is_default": False, "image_url": "/static/images/constructor/jalapeno_topping.png"},
                    {"name_ru": "Дополнительная котлета Black Angus", "name_uz": "Qo'shimcha kotlet Black Angus", "price": 18000, "is_default": False, "image_url": "/static/images/constructor/patty_cheese_real.png"},
                    {"name_ru": "Фирменный соус BBQ", "name_uz": "Maxsus BBQ sousi", "price": 3000, "is_default": False, "image_url": "/static/images/constructor/sauce_real.png"},
                    {"name_ru": "Хрустящий жареный лук", "name_uz": "Qarsildoq qovurilgan piyoz", "price": 3000, "is_default": False, "image_url": "/static/images/constructor/onions_real.png"},
                    {"name_ru": "Маринованные огурчики", "name_uz": "Tuzlangan bodring", "price": 3000, "is_default": False, "image_url": "/static/images/constructor/pickles_real.png"},
                ],
            },
        ],
        "removables": [
            {"name_ru": "Салат Айсберг", "name_uz": "Aysberg salati"},
            {"name_ru": "Свежий помидор", "name_uz": "Yangi pomidor"},
            {"name_ru": "Маринованные огурцы", "name_uz": "Tuzlangan bodring"},
            {"name_ru": "Фирменный соус", "name_uz": "Maxsus sous"},
            {"name_ru": "Хрустящий лук", "name_uz": "Qarsildoq piyoz"},
        ],
    },
    "pizza": {
        "name_uz": "O'z pitsangizni yarating (Pitsa Konstruktor)",
        "name_ru": "Собери свою Пиццу (Конструктор)",
        "name_en": "Build Your Own Pizza (Constructor)",
        "price": 55000,
        "description_ru": "Итальянская пицца на хрустящем тесте. Выберите основу и сочные топпинги по вкусу.",
        "description_uz": "Qarsildoq xamirli italyancha pitsa. Xamir turi va qo'shimchalarni tanlang.",
        "image_url": "/static/images/constructor/real_pizza_isolated.png",
        "groups": [
            {
                "name_ru": "Размер и тесто",
                "name_uz": "Xamir va o'lcham",
                "group_type": "SINGLE",
                "is_required": True,
                "min_required": 1,
                "max_allowed": 1,
                "sort_order": 1,
                "items": [
                    {"name_ru": "Традиционное тесто 30 см", "name_uz": "An'anaviy xamir 30 sm", "price": 0, "is_default": True, "image_url": "/static/images/constructor/real_pizza_isolated.png"},
                    {"name_ru": "Тонкое итальянское 30 см", "name_uz": "Yupqa italyancha 30 sm", "price": 0, "is_default": False, "image_url": "/static/images/constructor/real_pizza_isolated.png"},
                ],
            },
            {
                "name_ru": "Добавить по вкусу",
                "name_uz": "Ta'bga ko'ra qo'shish",
                "group_type": "QUANTITY",
                "is_required": False,
                "min_required": 0,
                "max_allowed": 10,
                "sort_order": 2,
                "items": [
                    {"name_ru": "Сырный бортик к пицце", "name_uz": "Pishloqli hoshiya", "price": 15000, "is_default": False, "image_url": "/static/images/constructor/cheese_crust_visual.png"},
                    {"name_ru": "Двойная Моцарелла", "name_uz": "Qo'shimcha Motsarella", "price": 8000, "is_default": False, "image_url": "/static/images/constructor/mozzarella_cheese.png"},
                    {"name_ru": "Пряная пепперони (Халяль)", "name_uz": "Pepperoni kolbasasi (Halol)", "price": 9000, "is_default": False, "image_url": "/static/images/constructor/pepperoni_topping.png"},
                    {"name_ru": "Шампиньоны свежие", "name_uz": "Yangi shampinyon", "price": 5000, "is_default": False, "image_url": "/static/images/constructor/mushrooms_topping.png"},
                    {"name_ru": "Острый перчик халапеньо", "name_uz": "Xalapeno qalampiri", "price": 4000, "is_default": False, "image_url": "/static/images/constructor/jalapeno_topping.png"},
                ],
            },
        ],
        "removables": [
            {"name_ru": "Орегано", "name_uz": "Oregano"},
            {"name_ru": "Красный лук", "name_uz": "Qizil piyoz"},
            {"name_ru": "Маслины", "name_uz": "Zaytun"},
        ],
    },
    "shawarma": {
        "name_uz": "O'z lavashingizni yig'ing (Konstruktor)",
        "name_ru": "Собери свою Шаурму / Лаваш (Конструктор)",
        "name_en": "Build Your Own Shawarma / Lavash (Constructor)",
        "price": 32000,
        "description_ru": "Сочный лаваш с мясом на гриле и свежими овощами. Добавьте сыр и соусы по вкусу.",
        "description_uz": "Grilda pishirilgan go'shtli sersuv lavash. Pishloq va souslarni tanlang.",
        "image_url": "/static/images/constructor/beef_meat_topping.png",
        "groups": [
            {
                "name_ru": "Размер порции",
                "name_uz": "Porsiya o'lchami",
                "group_type": "SINGLE",
                "is_required": True,
                "min_required": 1,
                "max_allowed": 1,
                "sort_order": 1,
                "items": [
                    {"name_ru": "Стандартная порция", "name_uz": "Standart porsiya", "price": 0, "is_default": True, "image_url": "/static/images/constructor/beef_meat_topping.png"},
                    {"name_ru": "Большая (Big)", "name_uz": "Katta (Big)", "price": 8000, "is_default": False, "image_url": "/static/images/constructor/beef_meat_topping.png"},
                ],
            },
            {
                "name_ru": "Добавить по вкусу",
                "name_uz": "Ta'bga ko'ra qo'shish",
                "group_type": "QUANTITY",
                "is_required": False,
                "min_required": 0,
                "max_allowed": 10,
                "sort_order": 2,
                "items": [
                    {"name_ru": "Сыр Моцарелла плавленая", "name_uz": "Erigan Motsarella", "price": 5000, "is_default": False, "image_url": "/static/images/constructor/mozzarella_cheese.png"},
                    {"name_ru": "Дополнительное мясо (Говядина)", "name_uz": "Qo'shimcha mol go'shti", "price": 12000, "is_default": False, "image_url": "/static/images/constructor/patty_cheese_real.png"},
                    {"name_ru": "Картофель фри внутрь", "name_uz": "Ichiga kartoshka fri", "price": 4000, "is_default": False, "image_url": "/static/images/constructor/onions_real.png"},
                    {"name_ru": "Фирменный чесночный соус", "name_uz": "Sarimsoqli maxsus sous", "price": 3000, "is_default": False, "image_url": "/static/images/constructor/sauce_dip_cup.png"},
                    {"name_ru": "Острый перчик халапеньо", "name_uz": "Xalapeno qalampiri", "price": 3000, "is_default": False, "image_url": "/static/images/constructor/jalapeno_topping.png"},
                ],
            },
        ],
        "removables": [
            {"name_ru": "Свежие огурцы", "name_uz": "Yangi bodring"},
            {"name_ru": "Свежие томаты", "name_uz": "Yangi pomidor"},
            {"name_ru": "Чесночный соус", "name_uz": "Sarimsoqli sous"},
            {"name_ru": "Маринованный лук", "name_uz": "Tuzlangan piyoz"},
        ],
    },
    "luxe_box": {
        "name_uz": "O'z Luxe Boksingizni yig'ing (Konstruktor)",
        "name_ru": "Собери свой Luxe-бокс (Конструктор подарка)",
        "name_en": "Build Your Own Luxe Gift Box (Constructor)",
        "price": 350000,
        "description_ru": "Создайте персональный подарочный набор: выберите премиальную коробку, селективный парфюм, уходовую косметику и эксклюзивную открытку.",
        "description_uz": "Eksklyuziv sovg'a to'plami: hashamatli quti, selektiv parfyum, parvarish vositalari va maxsus tabriknoma.",
        "image_url": "/media/products/packshots/gift_zielinski_coffret.jpg",
        "groups": [
            {
                "name_ru": "1. Формат и оформление бокса",
                "name_uz": "1. Boks formati va quti",
                "group_type": "SINGLE",
                "is_required": True,
                "min_required": 1,
                "max_allowed": 1,
                "sort_order": 1,
                "items": [
                    {"name_ru": "Zielinski & Rozen Luxe Box (Премиум набор)", "name_uz": "Zielinski & Rozen Luxe Box", "price": 0, "is_default": True, "image_url": "/media/products/packshots/gift_zielinski_coffret.jpg"},
                    {"name_ru": "Le Labo & Zielinski Exclusive Box", "name_uz": "Le Labo & Zielinski Box", "price": 40000, "is_default": False, "image_url": "/media/products/packshots/gift_lelabo_box.jpg"},
                    {"name_ru": "Amouage Guidance Royal Coffret", "name_uz": "Amouage Royal Coffret", "price": 90000, "is_default": False, "image_url": "/media/products/packshots/gift_amouage_coffret.jpg"},
                ],
            },
            {
                "name_ru": "2. Селективный мини-парфюм (10 мл)",
                "name_uz": "2. Selektiv mini-parfyum (10 ml)",
                "group_type": "SINGLE",
                "is_required": True,
                "min_required": 1,
                "max_allowed": 1,
                "sort_order": 2,
                "items": [
                    {"name_ru": "Marc-Antoine Barrois Ganymede (10 мл)", "name_uz": "Marc-Antoine Barrois Ganymede (10 ml)", "price": 120000, "is_default": True, "image_url": "/media/products/packshots/perfume_ganymede.jpg"},
                    {"name_ru": "Kilian Angels' Share (10 мл)", "name_uz": "Kilian Angels' Share (10 ml)", "price": 150000, "is_default": False, "image_url": "/media/products/packshots/perfume_angels_share.jpg"},
                    {"name_ru": "Bois Impérial Quentin Bisch (10 мл)", "name_uz": "Bois Impérial (10 ml)", "price": 140000, "is_default": False, "image_url": "/media/products/packshots/perfume_bois_imperial.jpg"},
                    {"name_ru": "Yves Saint Laurent Libre (10 мл)", "name_uz": "YSL Libre (10 ml)", "price": 130000, "is_default": False, "image_url": "/media/products/packshots/perfume_ysl_libre.jpg"},
                ],
            },
            {
                "name_ru": "3. Бьюти-наполнение и десерты",
                "name_uz": "3. Go'zallik vositalari va shirinliklar",
                "group_type": "QUANTITY",
                "is_required": False,
                "min_required": 0,
                "max_allowed": 5,
                "sort_order": 3,
                "items": [
                    {"name_ru": "Парфюмированный крем для рук Zielinski & Rozen", "name_uz": "Zielinski & Rozen qo'l kremi", "price": 95000, "is_default": False, "image_url": ""},
                    {"name_ru": "Ароматическая соевая свеча в стекле", "name_uz": "Xushbo'y sham", "price": 75000, "is_default": False, "image_url": ""},
                    {"name_ru": "Набор французских макаронс (5 шт)", "name_uz": "Fransuz makaronlari (5 dona)", "price": 65000, "is_default": False, "image_url": ""},
                    {"name_ru": "Шелковая маска для сна", "name_uz": "Ipak uyqu niqobi", "price": 50000, "is_default": False, "image_url": ""},
                ],
            },
            {
                "name_ru": "4. Персонализация и открытка",
                "name_uz": "4. Tabriknoma va bezak",
                "group_type": "SINGLE",
                "is_required": False,
                "min_required": 0,
                "max_allowed": 1,
                "sort_order": 4,
                "items": [
                    {"name_ru": "Фирменная открытка с каллиграфией «With Love»", "name_uz": "«With Love» kalligrafik tabriknoma", "price": 20000, "is_default": True, "image_url": ""},
                    {"name_ru": "Именная дизайнерская открытка с вашим текстом", "name_uz": "Sizning matningiz bilan maxsus tabriknoma", "price": 35000, "is_default": False, "image_url": ""},
                ],
            },
        ],
    },
}

def _serialize_group(group: ConstructorGroup):
    return {
        "id": group.id,
        "name_ru": group.name_ru or group.name_uz,
        "name_uz": group.name_uz,
        "name_en": group.name_en,
        "group_type": group.group_type,
        "is_required": group.is_required,
        "min_required": group.min_required,
        "max_allowed": group.max_allowed,
        "sort_order": group.sort_order,
        "is_active": group.is_active,
        "items": [
            {
                "id": it.id,
                "name_ru": it.name_ru or it.name_uz,
                "name_uz": it.name_uz,
                "name_en": it.name_en,
                "price": float(it.price),
                "image_url": it.image_url,
                "icon": it.icon,
                "is_default": it.is_default,
                "is_active": it.is_active,
                "sort_order": it.sort_order,
            }
            for it in group.items.all().order_by("sort_order", "id")
        ],
    }


# -----------------------------------------------------------------
# 1. LIST CONSTRUCTOR PRODUCTS IN DASHBOARD
# -----------------------------------------------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def constructor_list_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    products = (
        Product.objects.filter(store=store)
        .prefetch_related("constructor_groups__items")
        .order_by("-has_constructor", "name_uz")
    )

    constructor_products = []
    regular_products = []

    for p in products:
        c_groups = p.constructor_groups.all()
        p_data = {
            "id": p.id,
            "name_ru": p.name_ru or p.name_uz,
            "name_uz": p.name_uz,
            "price": float(p.price),
            "primary_image_url": p.primary_image_url or "",
            "category_id": p.category_id,
            "category_name": p.category.name_uz if p.category else "",
            "category_name_ru": p.category.name_ru if p.category and p.category.name_ru else (p.category.name_uz if p.category else ""),
            "has_constructor": p.has_constructor,
            "groups_count": c_groups.count(),
            "items_count": sum(g.items.count() for g in c_groups),
            "is_active": p.is_active,
        }
        if p.has_constructor:
            constructor_products.append(p_data)
        else:
            regular_products.append(p_data)

    return Response({
        "is_constructor_enabled": getattr(store, "is_constructor_enabled", True),
        "constructor_products": constructor_products,
        "regular_products": regular_products[:50],
        "total_constructors": len(constructor_products),
        "available_presets": [
            {"id": "burger", "name": "Бургер-конструктор (Фастфуд)", "desc": "Добавить по вкусу: сыр Чеддер, халапеньо, котлета, соусы"},
            {"id": "pizza", "name": "Пицца-конструктор (Пиццерии)", "desc": "Размер и тесто, сырный бортик, моцарелла, пепперони, грибы"},
            {"id": "shawarma", "name": "Шаурма / Лаваш (Фастфуд)", "desc": "Размер порции, доп. мясо, моцарелла, картофель фри, чесночный соус"},
        ],
    })


# -----------------------------------------------------------------
# 1.1 TOGGLE CONSTRUCTOR STATUS FOR STORE
# -----------------------------------------------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def constructor_toggle_status_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    is_enabled = request.data.get("is_enabled")
    if is_enabled is not None:
        store.is_constructor_enabled = bool(is_enabled)
    else:
        store.is_constructor_enabled = not getattr(store, "is_constructor_enabled", True)

    store.save(update_fields=["is_constructor_enabled"])

    msg_ru = "Конструктор включен на витрине" if store.is_constructor_enabled else "Конструктор отключен на витрине"
    msg_uz = "Konstruktor saytda faollashtirildi" if store.is_constructor_enabled else "Konstruktor saytda o'chirildi"

    return Response({
        "success": True,
        "is_constructor_enabled": store.is_constructor_enabled,
        "message": msg_ru,
        "message_uz": msg_uz,
    })


# -----------------------------------------------------------------
# 2. GET CONSTRUCTOR DETAILS FOR PRODUCT
# -----------------------------------------------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def constructor_detail_view(request, product_id):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    try:
        product = Product.objects.get(id=product_id, store=store)
    except Product.DoesNotExist:
        return Response({"error": "Mahsulot topilmadi"}, status=404)

    all_groups = list(product.constructor_groups.prefetch_related("items").order_by("sort_order", "id"))
    rem_group = next((g for g in all_groups if g.name_ru == "Убрать ингредиенты"), None)

    if rem_group:
        removables = [
            {"id": it.id, "name_ru": it.name_ru, "name_uz": it.name_uz}
            for it in rem_group.items.all().order_by("sort_order", "id")
        ]
        regular_groups = [g for g in all_groups if g.id != rem_group.id]
    else:
        p_lower = (product.name_ru or product.name_uz or "").lower()
        if "пицц" in p_lower or "pitsa" in p_lower or "pizza" in p_lower:
            removables = [
                {"name_ru": "Орегано", "name_uz": "Oregano"},
                {"name_ru": "Красный лук", "name_uz": "Qizil piyoz"},
                {"name_ru": "Маслины", "name_uz": "Zaytun"},
            ]
        elif "шаурм" in p_lower or "shaurma" in p_lower or "донер" in p_lower or "лаваш" in p_lower:
            removables = [
                {"name_ru": "Свежие огурцы", "name_uz": "Yangi bodring"},
                {"name_ru": "Свежие томаты", "name_uz": "Yangi pomidor"},
                {"name_ru": "Чесночный соус", "name_uz": "Sarimsoqli sous"},
                {"name_ru": "Маринованный лук", "name_uz": "Tuzlangan piyoz"},
            ]
        else:
            removables = [
                {"name_ru": "Салат Айсберг", "name_uz": "Aysberg salati"},
                {"name_ru": "Свежий помидор", "name_uz": "Yangi pomidor"},
                {"name_ru": "Маринованные огурцы", "name_uz": "Tuzlangan bodring"},
                {"name_ru": "Фирменный соус", "name_uz": "Maxsus sous"},
                {"name_ru": "Хрустящий лук", "name_uz": "Qarsildoq piyoz"},
            ]
        regular_groups = all_groups

    return Response({
        "product": {
            "id": product.id,
            "name_ru": product.name_ru or product.name_uz,
            "name_uz": product.name_uz,
            "price": float(product.price),
            "description_ru": product.description_ru or "",
            "description_uz": product.description_uz or "",
            "image_url": product.image_url or product.primary_image_url or "",
            "primary_image_url": product.primary_image_url or "",
            "has_constructor": product.has_constructor,
            "category_id": product.category_id,
        },
        "groups": [_serialize_group(g) for g in regular_groups],
        "removables": removables,
    })


# -----------------------------------------------------------------
# 3. SAVE / UPDATE CONSTRUCTOR GROUPS & ITEMS
# -----------------------------------------------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def constructor_save_view(request, product_id):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    if not has_staff_permission(request.user, store, "products", "edit"):
        return Response({"error": "Tahrirlash huquqi yo'q"}, status=403)

    try:
        product = Product.objects.get(id=product_id, store=store)
    except Product.DoesNotExist:
        return Response({"error": "Mahsulot topilmadi"}, status=404)

    data = request.data
    groups_data = data.get("groups", [])
    has_constructor = data.get("has_constructor", True)
    product_data = data.get("product")
    removables_data = data.get("removables")

    with transaction.atomic():
        product.has_constructor = bool(has_constructor)
        update_fields = ["has_constructor"]

        if product_data and isinstance(product_data, dict):
            if "name_ru" in product_data and product_data["name_ru"]:
                product.name_ru = product_data["name_ru"].strip()
                update_fields.append("name_ru")
            if "name_uz" in product_data and product_data["name_uz"]:
                product.name_uz = product_data["name_uz"].strip()
                update_fields.append("name_uz")
            if "price" in product_data:
                try:
                    product.price = Decimal(str(product_data["price"]))
                    update_fields.append("price")
                except Exception:
                    pass
            if "description_ru" in product_data:
                product.description_ru = (product_data.get("description_ru") or "").strip()
                update_fields.append("description_ru")
            if "description_uz" in product_data:
                product.description_uz = (product_data.get("description_uz") or "").strip()
                update_fields.append("description_uz")
            if "image_url" in product_data:
                img = (product_data.get("image_url") or "").strip()
                product.image_url = img
                update_fields.append("image_url")

        product.save(update_fields=list(set(update_fields)))

        # Retain existing group IDs passed to avoid destroying IDs
        keep_group_ids = []
        for g_idx, g_item in enumerate(groups_data):
            g_id = g_item.get("id")
            g_obj = None
            if g_id:
                g_obj = ConstructorGroup.objects.filter(id=g_id, store=store, product=product).first()

            if not g_obj:
                g_obj = ConstructorGroup(store=store, product=product)

            g_obj.name_ru = g_item.get("name_ru") or g_item.get("name_uz", "Группа")
            g_obj.name_uz = g_item.get("name_uz") or g_obj.name_ru
            g_obj.group_type = g_item.get("group_type", "SINGLE")
            g_obj.is_required = bool(g_item.get("is_required", False))
            g_obj.min_required = int(g_item.get("min_required", 0))
            g_obj.max_allowed = int(g_item.get("max_allowed", 1))
            g_obj.sort_order = g_idx + 1
            g_obj.is_active = bool(g_item.get("is_active", True))
            g_obj.save()
            keep_group_ids.append(g_obj.id)

            # Sync items for this group
            keep_item_ids = []
            for it_idx, it_data in enumerate(g_item.get("items", [])):
                it_id = it_data.get("id")
                it_obj = None
                if it_id:
                    it_obj = ConstructorItem.objects.filter(id=it_id, group=g_obj).first()

                if not it_obj:
                    it_obj = ConstructorItem(group=g_obj)

                it_obj.name_ru = it_data.get("name_ru") or it_data.get("name_uz", "Опция")
                it_obj.name_uz = it_data.get("name_uz") or it_obj.name_ru
                it_obj.price = Decimal(str(it_data.get("price", 0)))
                it_obj.image_url = it_data.get("image_url", "").strip()
                it_obj.icon = it_data.get("icon", "").strip()
                it_obj.is_default = bool(it_data.get("is_default", False))
                it_obj.is_active = bool(it_data.get("is_active", True))
                it_obj.sort_order = it_idx + 1
                it_obj.save()
                keep_item_ids.append(it_obj.id)

            # Delete removed items in this group
            g_obj.items.exclude(id__in=keep_item_ids).delete()

        # Handle Removables Group
        if removables_data is not None:
            rem_group = ConstructorGroup.objects.filter(store=store, product=product, name_ru="Убрать ингредиенты").first()
            if not rem_group:
                rem_group = ConstructorGroup.objects.create(
                    store=store,
                    product=product,
                    name_ru="Убрать ингредиенты",
                    name_uz="Tarkibidan olib tashlash",
                    group_type="MULTIPLE",
                    sort_order=999,
                    is_active=True,
                )
            keep_rem_ids = []
            for r_idx, r_item in enumerate(removables_data):
                if isinstance(r_item, str):
                    r_name = r_item.strip()
                    r_id = None
                else:
                    r_name = (r_item.get("name_ru") or r_item.get("name_uz") or "").strip()
                    r_id = r_item.get("id")
                if not r_name:
                    continue
                it_obj = None
                if r_id and isinstance(r_id, int):
                    it_obj = ConstructorItem.objects.filter(id=r_id, group=rem_group).first()
                if not it_obj:
                    it_obj = ConstructorItem(group=rem_group)
                it_obj.name_ru = r_name
                it_obj.name_uz = (r_item.get("name_uz") or r_name) if isinstance(r_item, dict) else r_name
                it_obj.price = Decimal("0")
                it_obj.is_default = False
                it_obj.is_active = True
                it_obj.sort_order = r_idx + 1
                it_obj.save()
                keep_rem_ids.append(it_obj.id)

            rem_group.items.exclude(id__in=keep_rem_ids).delete()
            keep_group_ids.append(rem_group.id)

        # Delete removed groups for this product
        product.constructor_groups.exclude(id__in=keep_group_ids).delete()

    saved_groups = product.constructor_groups.prefetch_related("items").exclude(name_ru="Убрать ингредиенты").order_by("sort_order", "id")
    saved_rem = product.constructor_groups.filter(name_ru="Убрать ингредиенты").first()
    saved_removables = [
        {"id": it.id, "name_ru": it.name_ru, "name_uz": it.name_uz}
        for it in (saved_rem.items.all().order_by("sort_order", "id") if saved_rem else [])
    ]

    return Response({
        "success": True,
        "message": "Настройки конструктора успешно сохранены!",
        "groups": [_serialize_group(g) for g in saved_groups],
        "removables": saved_removables,
    })


# -----------------------------------------------------------------
# 3B. DISABLE / DELETE CONSTRUCTOR FOR PRODUCT
# -----------------------------------------------------------------
@api_view(["POST", "DELETE"])
@permission_classes([IsAuthenticated])
def constructor_delete_view(request, product_id):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    if not has_staff_permission(request.user, store, "products", "edit"):
        return Response({"error": "Tahrirlash huquqi yo'q"}, status=403)

    try:
        product = Product.objects.get(id=product_id, store=store)
    except Product.DoesNotExist:
        return Response({"error": "Mahsulot topilmadi"}, status=404)

    delete_product = (
        request.data.get("delete_product") is True
        or request.query_params.get("delete_product") == "true"
        or request.method == "DELETE"
    )

    if delete_product:
        p_name = product.name_ru or product.name_uz
        product.constructor_groups.all().delete()
        product.delete()
        return Response({
            "success": True,
            "message": f"Товар '{p_name}' успешно удален!",
            "deleted": True,
        })

    product.has_constructor = False
    product.constructor_groups.all().delete()
    product.save(update_fields=["has_constructor"])

    return Response({
        "success": True,
        "message": "Конструктор для товара успешно отключен!",
        "disabled": True,
    })


# -----------------------------------------------------------------
# 3C. CREATE NEW CONSTRUCTOR PRODUCT OR ATTACH EXISTING
# -----------------------------------------------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def constructor_create_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    if not has_staff_permission(request.user, store, "products", "create"):
        return Response({"error": "Yaratish huquqi yo'q"}, status=403)

    data = request.data
    existing_product_id = data.get("productId") or data.get("product_id") or data.get("existing_product_id")
    def _populate_preset_groups(target_product, preset_key):
        preset = PRESETS.get(preset_key, PRESETS["burger"])
        for g_idx, g in enumerate(preset["groups"]):
            c_group = ConstructorGroup.objects.create(
                store=target_product.store,
                product=target_product,
                name_ru=g["name_ru"],
                name_uz=g["name_uz"],
                group_type=g["group_type"],
                is_required=g.get("is_required", False),
                min_required=g.get("min_required", 0),
                max_allowed=g.get("max_allowed", 1),
                sort_order=g.get("sort_order", g_idx + 1),
            )
            for i_idx, item in enumerate(g.get("items", [])):
                ConstructorItem.objects.create(
                    group=c_group,
                    name_ru=item["name_ru"],
                    name_uz=item["name_uz"],
                    price=Decimal(str(item.get("price", 0))),
                    is_default=item.get("is_default", False),
                    image_url=item.get("image_url", ""),
                    sort_order=i_idx + 1,
                )

        if preset.get("removables"):
            rem_group = ConstructorGroup.objects.create(
                store=target_product.store,
                product=target_product,
                name_ru="Убрать ингредиенты",
                name_uz="Tarkibidan olib tashlash",
                group_type="MULTIPLE",
                is_required=False,
                min_required=0,
                max_allowed=10,
                sort_order=999,
                is_active=True,
            )
            for r_idx, r_item in enumerate(preset["removables"]):
                ConstructorItem.objects.create(
                    group=rem_group,
                    name_ru=r_item["name_ru"],
                    name_uz=r_item["name_uz"],
                    price=Decimal("0"),
                    is_default=False,
                    is_active=True,
                    sort_order=r_idx + 1,
                )

    if existing_product_id:
        try:
            product = Product.objects.get(id=existing_product_id, store=store)
            product.has_constructor = True
            product.save(update_fields=["has_constructor"])

            # If product has no groups, populate default groups based on name
            if not product.constructor_groups.exists():
                p_lower = (product.name_ru or product.name_uz or "").lower()
                preset_key = data.get("preset_type")
                if not preset_key or preset_key not in PRESETS:
                    if "пицц" in p_lower or "pitsa" in p_lower or "pizza" in p_lower:
                        preset_key = "pizza"
                    elif "шаурм" in p_lower or "донер" in p_lower or "лаваш" in p_lower or "shaurma" in p_lower:
                        preset_key = "shawarma"
                    else:
                        preset_key = "burger"
                _populate_preset_groups(product, preset_key)

            return Response({
                "success": True,
                "product_id": product.id,
                "message": f"Конструктор успешно включен для '{product.name_ru or product.name_uz}'!",
            })
        except Product.DoesNotExist:
            return Response({"error": "Mahsulot topilmadi"}, status=404)

    name_ru = (data.get("name_ru") or "Новое блюдо (Конструктор)").strip()
    name_uz = (data.get("name_uz") or name_ru).strip()
    price = Decimal(str(data.get("price") or 45000))
    image_url = data.get("image_url") or "/static/images/constructor/real_burger_full.png"
    desc_ru = (data.get("description_ru") or "").strip()
    desc_uz = (data.get("description_uz") or "").strip()
    category_id = data.get("category_id")

    category = None
    if category_id:
        category = store.categories.filter(id=category_id).first()
    if not category:
        category = store.categories.filter(name_uz__icontains="burger").first() or store.categories.first()

    product = Product.objects.create(
        store=store,
        category=category,
        name_ru=name_ru,
        name_uz=name_uz,
        price=price,
        image_url=image_url,
        description_ru=desc_ru,
        description_uz=desc_uz,
        has_constructor=True,
        is_active=True,
    )

    preset_key = data.get("preset_type") or data.get("preset") or "burger"
    _populate_preset_groups(product, preset_key)

    return Response({
        "success": True,
        "product_id": product.id,
        "message": "Новый товар-конструктор успешно создан со всеми шагами!",
    })


# -----------------------------------------------------------------
# 4. LOAD READY-MADE PRESET
# -----------------------------------------------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def constructor_load_preset_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    if not has_staff_permission(request.user, store, "products", "edit"):
        return Response({"error": "Yaratish huquqi yo'q"}, status=403)

    preset_id = request.data.get("preset_id", "burger")
    preset = PRESETS.get(preset_id)
    if not preset:
        return Response({"error": "Bunday shablon topilmadi"}, status=400)

    category_id = request.data.get("category_id")
    category = None
    if category_id:
        category = Category.objects.filter(id=category_id, store=store).first()

    with transaction.atomic():
        slug_base = slugify(preset["name_ru"]) or f"custom-{preset_id}"
        slug = f"{slug_base}-{random.randint(100, 999)}"

        product = Product.objects.create(
            store=store,
            category=category,
            name_uz=preset["name_uz"],
            name_ru=preset["name_ru"],
            name_en=preset["name_en"],
            slug=slug,
            price=Decimal(str(preset["price"])),
            description_ru=preset["description_ru"],
            description_uz=preset["description_uz"],
            image_url=preset["image_url"],
            stock=100,
            has_constructor=True,
            is_active=True,
        )

        for g_idx, g in enumerate(preset["groups"]):
            cg = ConstructorGroup.objects.create(
                store=store,
                product=product,
                name_ru=g["name_ru"],
                name_uz=g["name_uz"],
                group_type=g["group_type"],
                is_required=g["is_required"],
                min_required=g["min_required"],
                max_allowed=g["max_allowed"],
                sort_order=g["sort_order"],
                is_active=True,
            )
            for it_idx, it in enumerate(g["items"]):
                ConstructorItem.objects.create(
                    group=cg,
                    name_ru=it["name_ru"],
                    name_uz=it["name_uz"],
                    price=Decimal(str(it["price"])),
                    is_default=it["is_default"],
                    is_active=True,
                    sort_order=it_idx + 1,
                )

        if preset.get("removables"):
            rem_group = ConstructorGroup.objects.create(
                store=store,
                product=product,
                name_ru="Убрать ингредиенты",
                name_uz="Tarkibidan olib tashlash",
                group_type="MULTIPLE",
                is_required=False,
                min_required=0,
                max_allowed=10,
                sort_order=999,
                is_active=True,
            )
            for r_idx, r_item in enumerate(preset["removables"]):
                ConstructorItem.objects.create(
                    group=rem_group,
                    name_ru=r_item["name_ru"],
                    name_uz=r_item["name_uz"],
                    price=Decimal("0"),
                    is_default=False,
                    is_active=True,
                    sort_order=r_idx + 1,
                )

    return Response({
        "success": True,
        "message": f"«{preset['name_ru']}» shabloni muvaffaqiyatli yuklandi!",
        "product_id": product.id,
    })


# -----------------------------------------------------------------
# 5. PUBLIC STOREFRONT GET CONSTRUCTOR FOR MODAL / PAGE
# -----------------------------------------------------------------
@api_view(["GET"])
@permission_classes([AllowAny])
def constructor_storefront_get_view(request, product_id):
    try:
        product = Product.objects.prefetch_related("constructor_groups__items").get(id=product_id, is_active=True)
    except Product.DoesNotExist:
        return Response({"error": "Mahsulot topilmadi"}, status=404)

    lang = request.GET.get("lang", "ru").lower()
    all_groups = list(product.constructor_groups.filter(is_active=True).order_by("sort_order", "id"))
    rem_group = next((g for g in all_groups if g.name_ru == "Убрать ингредиенты"), None)
    regular_groups = [g for g in all_groups if g.name_ru != "Убрать ингредиенты"]

    groups_data = []
    for g in regular_groups:
        active_items = g.items.filter(is_active=True).order_by("sort_order", "id")
        g_name = g.get_name(lang) or (g.name_ru if lang == "ru" else (g.name_uz or g.name_ru))
        groups_data.append({
            "id": g.id,
            "name": g_name,
            "title": g_name,
            "group_type": g.group_type,
            "is_required": g.is_required,
            "min_required": g.min_required,
            "max_allowed": g.max_allowed,
            "items": [
                {
                    "id": it.id,
                    "name": it.get_name(lang) or (it.name_ru if lang == "ru" else (it.name_uz or it.name_ru)),
                    "title": it.get_name(lang) or (it.name_ru if lang == "ru" else (it.name_uz or it.name_ru)),
                    "price": float(it.price),
                    "image_url": it.image_url,
                    "is_default": it.is_default,
                }
                for it in active_items
            ],
        })

    is_pizza = "пицц" in (product.name_ru or '').lower() or "pitsa" in (product.name_uz or '').lower()
    is_boutique = bool(product.store and product.store.theme_template == 'boutique')
    if rem_group:
        removables = [
            {
                "id": str(it.id),
                "name": it.get_name(lang) or (it.name_ru if lang == "ru" else (it.name_uz or it.name_ru)),
                "name_ru": it.name_ru,
                "name_uz": it.name_uz,
            }
            for it in rem_group.items.filter(is_active=True).order_by("sort_order", "id")
        ]
    elif is_boutique:
        removables = []
    else:
        default_burger_removables = [
            {"id": "lettuce", "name_ru": "Салат Айсберг", "name_uz": "Aysberg salati"},
            {"id": "tomato", "name_ru": "Свежий помидор", "name_uz": "Yangi pomidor"},
            {"id": "mayo", "name_ru": "Майонез", "name_uz": "Mayonez"},
            {"id": "cheese_mix", "name_ru": "Микс сыров", "name_uz": "Pishloqlar"},
            {"id": "crispy_onion", "name_ru": "Хрустящий лук", "name_uz": "Qarsildoq piyoz"},
            {"id": "pickles", "name_ru": "Маринованные огурцы", "name_uz": "Tuzlangan bodring"},
        ]
        default_pizza_removables = [
            {"id": "oregano", "name_ru": "Орегано", "name_uz": "Oregano"},
            {"id": "onion", "name_ru": "Красный лук", "name_uz": "Qizil piyoz"},
            {"id": "olives", "name_ru": "Маслины", "name_uz": "Zaytun"},
        ]
        raw_removables = default_pizza_removables if is_pizza else default_burger_removables
        removables = [
            {
                "id": r["id"],
                "name": r.get(f"name_{lang}", r.get("name_ru")),
                "name_ru": r.get("name_ru", ""),
                "name_uz": r.get("name_uz", ""),
            }
            for r in raw_removables
        ]

    if product.image_url:
        p_img = product.image_url
    elif product.primary_image_url:
        p_img = product.primary_image_url
    elif is_pizza:
        p_img = "/static/images/constructor/real_pizza_isolated.png"
    elif is_boutique:
        p_img = "/media/products/packshots/gift_zielinski_coffret.jpg"
    elif "бургер" in (product.name_ru or '').lower() or "burger" in (product.name_uz or '').lower() or "ангус" in (product.name_ru or '').lower():
        p_img = "/static/images/constructor/real_burger_full.png"
    else:
        p_img = "/static/images/constructor/real_burger_full.png"

    return Response({
        "success": True,
        "product": {
            "id": product.id,
            "name": product.get_name(lang),
            "price": float(product.price),
            "base_price": float(product.price),
            "image": p_img,
            "description": product.get_description(lang),
            "unit": product.get_unit_name(lang),
            "is_pizza": is_pizza,
            "is_boutique": is_boutique,
            "removables": removables,
            "nutrition": None if is_boutique else {
                "weight_g": 340 if not is_pizza else 480,
                "calories": 740 if not is_pizza else 1150,
                "protein": 38 if not is_pizza else 42,
                "fat": 34 if not is_pizza else 36,
                "carbs": 48 if not is_pizza else 110,
            }
        },
        "groups": groups_data,
    })
