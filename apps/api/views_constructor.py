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
        "price": 25000,
        "description_ru": "Соберите фирменный бургер на свой вкус: выберите любимую булочку, сочную котлету, нежные сыры, авторские соусы и аппетитные добавки.",
        "description_uz": "O'zingiz yoqtirgan bulochka, shirali kotlet, pishloqlar va souslar bilan mukammal burgerni yarating.",
        "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
        "groups": [
            {
                "name_ru": "1. Выберите булочку",
                "name_uz": "1. Bulochkani tanlang",
                "group_type": "SINGLE",
                "is_required": True,
                "min_required": 1,
                "max_allowed": 1,
                "sort_order": 1,
                "items": [
                    {"name_ru": "Бриошь (сливочная)", "name_uz": "Brioshe (sariyog'li)", "price": 0, "is_default": True},
                    {"name_ru": "Булочка с кунжутом", "name_uz": "Kunjutli bulochka", "price": 0, "is_default": False},
                    {"name_ru": "Черная картофельная", "name_uz": "Qora kartoshkali", "price": 4000, "is_default": False},
                    {"name_ru": "Без булки (в листьях салата)", "name_uz": "Bulochkasiz (salat bargida)", "price": 0, "is_default": False},
                ],
            },
            {
                "name_ru": "2. Котлета / Мясо",
                "name_uz": "2. Kotlet / Go'sht",
                "group_type": "SINGLE",
                "is_required": True,
                "min_required": 1,
                "max_allowed": 1,
                "sort_order": 2,
                "items": [
                    {"name_ru": "Говяжья котлета Black Angus (150г)", "name_uz": "Black Angus mol go'shti (150g)", "price": 18000, "is_default": True},
                    {"name_ru": "Двойная говяжья котлета (300г)", "name_uz": "Qo'shaloq mol go'shti (300g)", "price": 32000, "is_default": False},
                    {"name_ru": "Хрустящее куриное филе в панировке", "name_uz": "Qarsildoq tovuq filesi", "price": 14000, "is_default": False},
                    {"name_ru": "Растительная котлета Beyond Meat (Веган)", "name_uz": "O'simlik kotleti (Vegan)", "price": 22000, "is_default": False},
                ],
            },
            {
                "name_ru": "3. Сыры",
                "name_uz": "3. Pishloqlar",
                "group_type": "MULTIPLE",
                "is_required": False,
                "min_required": 0,
                "max_allowed": 3,
                "sort_order": 3,
                "items": [
                    {"name_ru": "Сыр Чеддер", "name_uz": "Chedder pishlog'i", "price": 5000, "is_default": True},
                    {"name_ru": "Моцарелла плавленая", "name_uz": "Erigan Motsarella", "price": 6000, "is_default": False},
                    {"name_ru": "Дорблю с благородной плесенью", "name_uz": "Dorblu pishlog'i", "price": 9000, "is_default": False},
                ],
            },
            {
                "name_ru": "4. Фирменные соусы",
                "name_uz": "4. Maxsus souslar",
                "group_type": "MULTIPLE",
                "is_required": False,
                "min_required": 0,
                "max_allowed": 4,
                "sort_order": 4,
                "items": [
                    {"name_ru": "Копченый BBQ соус", "name_uz": "Dudlangan BBQ sousi", "price": 3000, "is_default": True},
                    {"name_ru": "Нежный сырный соус", "name_uz": "Mayin pishloqli sous", "price": 3500, "is_default": False},
                    {"name_ru": "Трюфельный майонез", "name_uz": "Tryufelli mayonez", "price": 6000, "is_default": False},
                    {"name_ru": "Острый Sriracha", "name_uz": "Achchiq Sriracha", "price": 3000, "is_default": False},
                ],
            },
            {
                "name_ru": "5. Дополнительные топпинги",
                "name_uz": "5. Qo'shimcha qo'shimchalar",
                "group_type": "QUANTITY",
                "is_required": False,
                "min_required": 0,
                "max_allowed": 10,
                "sort_order": 5,
                "items": [
                    {"name_ru": "Хрустящий жареный бекон", "name_uz": "Qovurilgan bekon", "price": 7000, "is_default": False},
                    {"name_ru": "Острый перчик халапеньо", "name_uz": "Xalapeno qalampiri", "price": 4000, "is_default": False},
                    {"name_ru": "Карамелизированный лук", "name_uz": "Karamellangan piyoz", "price": 4000, "is_default": False},
                    {"name_ru": "Маринованные огурчики", "name_uz": "Tuzlangan bodring", "price": 3000, "is_default": False},
                    {"name_ru": "Жареное яйцо (глазунья)", "name_uz": "Qovurilgan tuxum", "price": 4000, "is_default": False},
                ],
            },
        ],
    },
    "pizza": {
        "name_uz": "O'z pitsangizni yarating (Pitsa Konstruktor)",
        "name_ru": "Собери свою Пиццу (Конструктор)",
        "name_en": "Build Your Own Pizza (Constructor)",
        "price": 45000,
        "description_ru": "Создайте идеальную пиццу: выберите тип теста, основу, соусы, мясные деликатесы и овощи.",
        "description_uz": "Xamir turi, sous va sevimli masalliqlar bilan o'z pitsangizni yarating.",
        "image_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
        "groups": [
            {
                "name_ru": "1. Размер и основа",
                "name_uz": "1. O'lchami va xamir",
                "group_type": "SINGLE",
                "is_required": True,
                "min_required": 1,
                "max_allowed": 1,
                "sort_order": 1,
                "items": [
                    {"name_ru": "Традиционное тесто 30 см", "name_uz": "An'anaviy xamir 30 sm", "price": 0, "is_default": True},
                    {"name_ru": "Тонкое итальянское 30 см", "name_uz": "Yupqa italyancha 30 sm", "price": 0, "is_default": False},
                    {"name_ru": "Большая 35 см (+Сырный бортик)", "name_uz": "Katta 35 sm (+Pishloqli hoshiya)", "price": 18000, "is_default": False},
                ],
            },
            {
                "name_ru": "2. Соус для основы",
                "name_uz": "2. Asos sousi",
                "group_type": "SINGLE",
                "is_required": True,
                "min_required": 1,
                "max_allowed": 1,
                "sort_order": 2,
                "items": [
                    {"name_ru": "Фирменный томатный соус с базиликом", "name_uz": "Rayhonli tomat sousi", "price": 0, "is_default": True},
                    {"name_ru": "Нежный сливочный ранч", "name_uz": "Mayin qaymoqli ranch", "price": 3000, "is_default": False},
                    {"name_ru": "Барбекю соус", "name_uz": "Barbekyu sousi", "price": 3000, "is_default": False},
                ],
            },
            {
                "name_ru": "3. Мясная начинка",
                "name_uz": "3. Go'shtli masalliqlar",
                "group_type": "MULTIPLE",
                "is_required": False,
                "min_required": 0,
                "max_allowed": 4,
                "sort_order": 3,
                "items": [
                    {"name_ru": "Пряная пепперони", "name_uz": "Pepperoni kolbasasi", "price": 10000, "is_default": True},
                    {"name_ru": "Ветчина из индейки", "name_uz": "Kurka go'shti vetchinasi", "price": 9000, "is_default": False},
                    {"name_ru": "Копченая куриная грудка", "name_uz": "Dudlangan tovuq", "price": 8000, "is_default": False},
                    {"name_ru": "Охотничьи колбаски", "name_uz": "Ovchilar kolbasasi", "price": 9000, "is_default": False},
                ],
            },
            {
                "name_ru": "4. Овощи и зелень",
                "name_uz": "4. Sabzavotlar",
                "group_type": "MULTIPLE",
                "is_required": False,
                "min_required": 0,
                "max_allowed": 5,
                "sort_order": 4,
                "items": [
                    {"name_ru": "Свежие томаты черри", "name_uz": "Cherri pomidorlari", "price": 4000, "is_default": False},
                    {"name_ru": "Шампиньоны свежие", "name_uz": "Yangi shampinyon qo'ziqorinlari", "price": 5000, "is_default": False},
                    {"name_ru": "Маслины черные", "name_uz": "Zaytun donalari", "price": 4000, "is_default": False},
                    {"name_ru": "Сладкий болгарский перец", "name_uz": "Shirin bulg'or qalampiri", "price": 3500, "is_default": False},
                ],
            },
        ],
    },
    "flower": {
        "name_uz": "O'z guldastangizni yarating (Gullar Konstruktori)",
        "name_ru": "Собери свой Букет (Цветочный конструктор)",
        "name_en": "Build Your Own Bouquet (Flower Constructor)",
        "price": 80000,
        "description_ru": "Создайте неповторимый авторский букет: выберите премиальные цветы, количество стеблей, стильную упаковку и персональную открытку.",
        "description_uz": "O'ziga xos mualliflik guldastasini yarating: gullar soni, o'rash qog'ozi va tabriknomani tanlang.",
        "image_url": "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&auto=format&fit=crop&q=80",
        "groups": [
            {
                "name_ru": "1. Основные цветы",
                "name_uz": "1. Asosiy gullar",
                "group_type": "SINGLE",
                "is_required": True,
                "min_required": 1,
                "max_allowed": 1,
                "sort_order": 1,
                "items": [
                    {"name_ru": "Эквадорские розы Explorer (Красные)", "name_uz": "Ekvador qizil atirgullari", "price": 0, "is_default": True},
                    {"name_ru": "Пионовидные розы Мисти Баблс (Розовые)", "name_uz": "Pionli atirgullar (Pushti)", "price": 25000, "is_default": False},
                    {"name_ru": "Белоснежные голландские тюльпаны", "name_uz": "Gollandiya lolalari (Oq)", "price": -10000, "is_default": False},
                    {"name_ru": "Гортензия королевская (Голубая / Сиреневая)", "name_uz": "Qirollik Gortenziyasi", "price": 45000, "is_default": False},
                ],
            },
            {
                "name_ru": "2. Количество стеблей в букете",
                "name_uz": "2. Gullar soni",
                "group_type": "SINGLE",
                "is_required": True,
                "min_required": 1,
                "max_allowed": 1,
                "sort_order": 2,
                "items": [
                    {"name_ru": "Компактный (11 шт.)", "name_uz": "Ixcham (11 dona)", "price": 0, "is_default": True},
                    {"name_ru": "Пышный букет (21 шт.)", "name_uz": "Yam-yashil guldasta (21 dona)", "price": 95000, "is_default": False},
                    {"name_ru": "Роскошный букет (35 шт.)", "name_uz": "Hashamatli (35 dona)", "price": 210000, "is_default": False},
                    {"name_ru": "Гранд Букет (51 шт.)", "name_uz": "Grand guldasta (51 dona)", "price": 380000, "is_default": False},
                    {"name_ru": "Королевский (101 шт.)", "name_uz": "Qirollik (101 dona)", "price": 850000, "is_default": False},
                ],
            },
            {
                "name_ru": "3. Стиль оформления и упаковка",
                "name_uz": "3. Qadoqlash uslubi",
                "group_type": "SINGLE",
                "is_required": True,
                "min_required": 1,
                "max_allowed": 1,
                "sort_order": 3,
                "items": [
                    {"name_ru": "Премиум матовая корейская бумага", "name_uz": "Koreys mat qog'ozi", "price": 15000, "is_default": True},
                    {"name_ru": "Крафтовая экологичная бумага", "name_uz": "Kraft ekologik qog'oz", "price": 10000, "is_default": False},
                    {"name_ru": "Круглая шляпная коробка", "name_uz": "Dumaloq quti (Shlyapnaya)", "price": 45000, "is_default": False},
                    {"name_ru": "Просто под атласную ленту (без упаковки)", "name_uz": "Faqat atlas lenta bilan", "price": 0, "is_default": False},
                ],
            },
            {
                "name_ru": "4. Дополнительно к цветам",
                "name_uz": "4. Qo'shimchalar",
                "group_type": "MULTIPLE",
                "is_required": False,
                "min_required": 0,
                "max_allowed": 3,
                "sort_order": 4,
                "items": [
                    {"name_ru": "Бесплатная открытка с вашим текстом", "name_uz": "Bepul tabriknoma", "price": 0, "is_default": True},
                    {"name_ru": "Деревянный топпер «С Днём Рождения»", "name_uz": "Yog'och topper «Tug'ilgan kuningiz bilan»", "price": 12000, "is_default": False},
                    {"name_ru": "Акриловая ваза для цветов", "name_uz": "Gullar uchun akril vaza", "price": 35000, "is_default": False},
                    {"name_ru": "Подкормка Chrysal для долгой свежести", "name_uz": "Gullarni uzoq saqlash kukun (Chrysal)", "price": 5000, "is_default": False},
                ],
            },
        ],
    },
    "apparel": {
        "name_uz": "Kiyimingizni yarating (Kiyim Konstruktori)",
        "name_ru": "Собери свой Мерч / Одежду (Конструктор)",
        "name_en": "Custom Apparel / Merch Builder",
        "price": 140000,
        "description_ru": "Создайте уникальную кастомную одежду: выберите изделие, крой, ткань, цвет, размер и варианты нанесения принта или вышивки.",
        "description_uz": "O'z didingizga mos kiyim yarating: mato, o'lcham, rang va maxsus print/kashta tanlang.",
        "image_url": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
        "groups": [
            {
                "name_ru": "1. Базовая модель одежды",
                "name_uz": "1. Asosiy kiyim modeli",
                "group_type": "SINGLE",
                "is_required": True,
                "min_required": 1,
                "max_allowed": 1,
                "sort_order": 1,
                "items": [
                    {"name_ru": "Футболка Оверсайз Плотная (240г)", "name_uz": "Oversize qalin futbolka (240g)", "price": 0, "is_default": True},
                    {"name_ru": "Худи Оверсайз с капюшоном (начёс)", "name_uz": "Kapushonli xudi (Oversize)", "price": 120000, "is_default": False},
                    {"name_ru": "Свитшот классический свободный", "name_uz": "Klassik svitshot", "price": 90000, "is_default": False},
                    {"name_ru": "Футболка классический крой (180г)", "name_uz": "Klassik futbolka (180g)", "price": -20000, "is_default": False},
                ],
            },
            {
                "name_ru": "2. Цвет ткани",
                "name_uz": "2. Mato rangi",
                "group_type": "SINGLE",
                "is_required": True,
                "min_required": 1,
                "max_allowed": 1,
                "sort_order": 2,
                "items": [
                    {"name_ru": "Глубокий черный (Pitch Black)", "name_uz": "Qop-qora (Black)", "price": 0, "is_default": True},
                    {"name_ru": "Молочный белый (Off-White)", "name_uz": "Sutrang oq (Off-White)", "price": 0, "is_default": False},
                    {"name_ru": "Теплый бежевый (Sand / Beige)", "name_uz": "Iliq bej (Beige)", "price": 5000, "is_default": False},
                    {"name_ru": "Графитовый меланж (Graphite)", "name_uz": "Grafit rang (Graphite)", "price": 5000, "is_default": False},
                ],
            },
            {
                "name_ru": "3. Размер",
                "name_uz": "3. O'lchami",
                "group_type": "SINGLE",
                "is_required": True,
                "min_required": 1,
                "max_allowed": 1,
                "sort_order": 3,
                "items": [
                    {"name_ru": "S (44-46)", "name_uz": "S (44-46)", "price": 0, "is_default": False},
                    {"name_ru": "M (48-50)", "name_uz": "M (48-50)", "price": 0, "is_default": True},
                    {"name_ru": "L (52-54)", "name_uz": "L (52-54)", "price": 0, "is_default": False},
                    {"name_ru": "XL (56-58)", "name_uz": "XL (56-58)", "price": 0, "is_default": False},
                    {"name_ru": "XXL Оверсайз (60+)", "name_uz": "XXL Oversize (60+)", "price": 10000, "is_default": False},
                ],
            },
            {
                "name_ru": "4. Кастомизация / Нанесение",
                "name_uz": "4. Naqsh va bosma",
                "group_type": "MULTIPLE",
                "is_required": False,
                "min_required": 0,
                "max_allowed": 3,
                "sort_order": 4,
                "items": [
                    {"name_ru": "Мини-вышивка на груди (лого/текст)", "name_uz": "Ko'krakda kichik kashta", "price": 30000, "is_default": True},
                    {"name_ru": "Большой принт DTF на спине (A3)", "name_uz": "Orqa tarafda katta DTF print", "price": 45000, "is_default": False},
                    {"name_ru": "Фирменный тканевый патч на рукаве", "name_uz": "Yengda matoli brend patch", "price": 15000, "is_default": False},
                    {"name_ru": "Без нанесения (Чистая базовая вещь)", "name_uz": "Naqshsiz (Sof asosiy kiyim)", "price": 0, "is_default": False},
                ],
            },
        ],
    },
    "hotdog": {
        "name_uz": "O'z hot-dogingizni yig'ing (Xot-dog Konstruktori)",
        "name_ru": "Собери свой Хот-дог (Конструктор)",
        "name_en": "Build Your Own Hot Dog",
        "price": 22000,
        "description_ru": "Американские и датские хот-доги: выберите булочку, премиальную колбаску, авторские соусы и хрустящие топпинги.",
        "description_uz": "Bulochka, sersuv sosiska, souslar va qarsildoq piyoz bilan xot-dog yarating.",
        "image_url": "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=600&auto=format&fit=crop&q=80",
        "groups": [
            {
                "name_ru": "1. Булочка для хот-дога",
                "name_uz": "1. Xot-dog bulochkasi",
                "group_type": "SINGLE",
                "is_required": True,
                "min_required": 1,
                "max_allowed": 1,
                "sort_order": 1,
                "items": [
                    {"name_ru": "Сливочная бриошь (мягкая)", "name_uz": "Sariyog'li brioshe", "price": 0, "is_default": True},
                    {"name_ru": "Французский багет (хрустящий)", "name_uz": "Fransuzcha baget", "price": 2000, "is_default": False},
                ],
            },
            {
                "name_ru": "2. Колбаска / Сосиска",
                "name_uz": "2. Sosiska turi",
                "group_type": "SINGLE",
                "is_required": True,
                "min_required": 1,
                "max_allowed": 1,
                "sort_order": 2,
                "items": [
                    {"name_ru": "Баварская говяжья гриль", "name_uz": "Bavariya mol go'shti", "price": 0, "is_default": True},
                    {"name_ru": "Охотничья подкопченная", "name_uz": "Ovchilar dudlangan", "price": 4000, "is_default": False},
                    {"name_ru": "Нежная куриная с сыром", "name_uz": "Tovuqli pishloqli", "price": 2000, "is_default": False},
                ],
            },
            {
                "name_ru": "3. Соусы и заправка",
                "name_uz": "3. Souslar",
                "group_type": "MULTIPLE",
                "is_required": False,
                "min_required": 0,
                "max_allowed": 3,
                "sort_order": 3,
                "items": [
                    {"name_ru": "Дижонская сладкая горчица", "name_uz": "Shirin xantallik sous", "price": 0, "is_default": True},
                    {"name_ru": "Классический томатный кетчуп", "name_uz": "Klassik ketchup", "price": 0, "is_default": True},
                    {"name_ru": "Сырный чеддер соус", "name_uz": "Chedder sousi", "price": 3000, "is_default": False},
                ],
            },
            {
                "name_ru": "4. Хрустящие топпинги",
                "name_uz": "4. Qo'shimchalar",
                "group_type": "MULTIPLE",
                "is_required": False,
                "min_required": 0,
                "max_allowed": 4,
                "sort_order": 4,
                "items": [
                    {"name_ru": "Хрустящий жареный лук фри (Crispy)", "name_uz": "Qarsildoq qovurilgan piyoz", "price": 3000, "is_default": True},
                    {"name_ru": "Маринованный огуречный релиш", "name_uz": "Tuzlangan bodringli relish", "price": 3000, "is_default": True},
                    {"name_ru": "Перчик халапеньо (острый)", "name_uz": "Xalapeno", "price": 3000, "is_default": False},
                ],
            },
        ],
    },
    "coffee": {
        "name_uz": "O'z kofeingizni yarating (Kofe Konstruktori)",
        "name_ru": "Собери свой Кофе / Напиток (Конструктор)",
        "name_en": "Custom Coffee & Drink Builder",
        "price": 18000,
        "description_ru": "Соберите идеальный кофе: выберите основу (эспрессо/латте/капучино), альтернативное молоко, сиропы и топпинги.",
        "description_uz": "Kofe turi, o'simlik suti, siroplar va qo'shimchalar bilan ichimlik yarating.",
        "image_url": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80",
        "groups": [
            {
                "name_ru": "1. Основа напитка и размер",
                "name_uz": "1. Asosiy ichimlik va hajmi",
                "group_type": "SINGLE",
                "is_required": True,
                "min_required": 1,
                "max_allowed": 1,
                "sort_order": 1,
                "items": [
                    {"name_ru": "Капучино Стандарт (300 мл)", "name_uz": "Kapuchino standart (300 ml)", "price": 0, "is_default": True},
                    {"name_ru": "Латте Большой (400 мл)", "name_uz": "Latte katta (400 ml)", "price": 4000, "is_default": False},
                    {"name_ru": "Айс Латте со льдом (450 мл)", "name_uz": "Muzli Ays Latte (450 ml)", "price": 6000, "is_default": False},
                    {"name_ru": "Матча Латте зеленый (350 мл)", "name_uz": "Matcha Latte (350 ml)", "price": 8000, "is_default": False},
                ],
            },
            {
                "name_ru": "2. Выбор молока",
                "name_uz": "2. Sut turi",
                "group_type": "SINGLE",
                "is_required": True,
                "min_required": 1,
                "max_allowed": 1,
                "sort_order": 2,
                "items": [
                    {"name_ru": "Классическое цельное молоко 3.2%", "name_uz": "Klassik sut 3.2%", "price": 0, "is_default": True},
                    {"name_ru": "Овсяное Barista (растительное)", "name_uz": "Suli suti (Oat)", "price": 6000, "is_default": False},
                    {"name_ru": "Кокосовое нежное", "name_uz": "Kokos suti", "price": 7000, "is_default": False},
                    {"name_ru": "Миндальное ароматное", "name_uz": "Bodom suti", "price": 8000, "is_default": False},
                ],
            },
            {
                "name_ru": "3. Ароматные сиропы",
                "name_uz": "3. Xushbo'y siroplar",
                "group_type": "MULTIPLE",
                "is_required": False,
                "min_required": 0,
                "max_allowed": 2,
                "sort_order": 3,
                "items": [
                    {"name_ru": "Соленая карамель", "name_uz": "Tuzli karamel", "price": 4000, "is_default": False},
                    {"name_ru": "Мадагаскарская ваниль", "name_uz": "Vanil", "price": 4000, "is_default": False},
                    {"name_ru": "Лесной орех (Фундук)", "name_uz": "O'rmon yong'og'i", "price": 4000, "is_default": False},
                    {"name_ru": "Лавандовый сироп", "name_uz": "Lavanda", "price": 5000, "is_default": False},
                ],
            },
            {
                "name_ru": "4. Топпинги и добавки",
                "name_uz": "4. Qo'shimchalar",
                "group_type": "MULTIPLE",
                "is_required": False,
                "min_required": 0,
                "max_allowed": 3,
                "sort_order": 4,
                "items": [
                    {"name_ru": "Шапка взбитых сливок", "name_uz": "Qaymoq ko'pigi", "price": 5000, "is_default": False},
                    {"name_ru": "Маршмеллоу мини", "name_uz": "Marshmellou", "price": 4000, "is_default": False},
                    {"name_ru": "Дополнительный шот эспрессо", "name_uz": "Qo'shimcha espresso shot", "price": 6000, "is_default": False},
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
            "category_name": p.category.name_uz if p.category else "",
            "has_constructor": p.has_constructor,
            "groups_count": c_groups.count(),
            "items_count": sum(g.items.count() for g in c_groups),
            "is_active": p.is_active,
        }
        if p.has_constructor or c_groups.exists():
            constructor_products.append(p_data)
        else:
            regular_products.append(p_data)

    return Response({
        "constructor_products": constructor_products,
        "regular_products": regular_products[:50],
        "total_constructors": len(constructor_products),
        "available_presets": [
            {"id": "burger", "name": "🍔 Бургер-конструктор (Рестораны / Фастфуд)", "desc": "Булочки, котлеты, сыры, соусы, топпинги"},
            {"id": "pizza", "name": "🍕 Пицца-конструктор (Пиццерии / Кафе)", "desc": "Тесто, соусы, мясо, сыры, овощи"},
            {"id": "flower", "name": "💐 Собери букет (Цветочные магазины)", "desc": "Цветы, количество стеблей, упаковка, декор"},
            {"id": "apparel", "name": "👕 Кастомный мерч / Одежда", "desc": "Фасон, цвет, размер, принты, вышивка"},
        ],
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

    groups = product.constructor_groups.prefetch_related("items").order_by("sort_order", "id")

    return Response({
        "product": {
            "id": product.id,
            "name_ru": product.name_ru or product.name_uz,
            "name_uz": product.name_uz,
            "price": float(product.price),
            "primary_image_url": product.primary_image_url or "",
            "has_constructor": product.has_constructor,
            "category_id": product.category_id,
        },
        "groups": [_serialize_group(g) for g in groups],
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

    with transaction.atomic():
        product.has_constructor = bool(has_constructor)
        product.save(update_fields=["has_constructor"])

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

        # Delete removed groups for this product
        product.constructor_groups.exclude(id__in=keep_group_ids).delete()

    return Response({
        "success": True,
        "message": "Konstruktor sozlamalari muvaffaqiyatli saqlandi!",
        "groups": [_serialize_group(g) for g in product.constructor_groups.prefetch_related("items").order_by("sort_order", "id")],
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
    groups = product.constructor_groups.filter(is_active=True).order_by("sort_order", "id")

    groups_data = []
    for g in groups:
        active_items = g.items.filter(is_active=True).order_by("sort_order", "id")
        groups_data.append({
            "id": g.id,
            "title": g.get_name(lang),
            "group_type": g.group_type,
            "is_required": g.is_required,
            "min_required": g.min_required,
            "max_allowed": g.max_allowed,
            "items": [
                {
                    "id": it.id,
                    "title": it.get_name(lang),
                    "price": float(it.price),
                    "image_url": it.image_url,
                    "is_default": it.is_default,
                }
                for it in active_items
            ],
        })

    return Response({
        "success": True,
        "product": {
            "id": product.id,
            "name": product.get_name(lang),
            "price": float(product.price),
            "base_price": float(product.price),
            "image": product.primary_image_url or "",
            "description": product.get_description(lang),
            "unit": product.get_unit_name(lang),
        },
        "groups": groups_data,
    })
