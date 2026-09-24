# -*- coding: utf-8 -*-
"""
Intelligent Multilingual Catalog Translation Resolver for StoreBox.
Translates category and product names and descriptions dynamically across
UZ, RU, EN, and TR.
"""

CATALOG_DICT = {
    # ---------------- Categories ----------------
    "mevalar": {
        "uz": "Mevalar",
        "ru": "Фрукты",
        "en": "Fruits",
        "tr": "Meyveler"
    },
    "sabzavotlar": {
        "uz": "Sabzavotlar",
        "ru": "Овощи",
        "en": "Vegetables",
        "tr": "Sebzeler"
    },
    "g`osht maxsulotlari": {
        "uz": "Go'sht mahsulotlari",
        "ru": "Мясные продукты",
        "en": "Meat Products",
        "tr": "Et Ürünleri"
    },
    "g'osht maxsulotlari": {
        "uz": "Go'sht mahsulotlari",
        "ru": "Мясные продукты",
        "en": "Meat Products",
        "tr": "Et Ürünleri"
    },
    "g`osht mahsulotlari": {
        "uz": "Go'sht mahsulotlari",
        "ru": "Мясные продукты",
        "en": "Meat Products",
        "tr": "Et Ürünleri"
    },
    "gosht mahsulotlari": {
        "uz": "Go'sht mahsulotlari",
        "ru": "Мясные продукты",
        "en": "Meat Products",
        "tr": "Et Ürünleri"
    },
    "kolbasa": {
        "uz": "Kolbasa mahsulotlari",
        "ru": "Колбасные изделия",
        "en": "Sausages & Deli",
        "tr": "Sosis ve Şarküteri"
    },
    "kolbasa mahsulotlari": {
        "uz": "Kolbasa mahsulotlari",
        "ru": "Колбасные изделия",
        "en": "Sausages & Deli",
        "tr": "Sosis ve Şarküteri"
    },
    "issiq taomlar": {
        "uz": "Issiq taomlar",
        "ru": "Горячие блюда",
        "en": "Hot Dishes",
        "tr": "Sıcak Yemekler"
    },
    "fast-fud & pitsa": {
        "uz": "Fast-fud & Pitsa",
        "ru": "Фастфуд и Пицца",
        "en": "Fast Food & Pizza",
        "tr": "Fast Food & Pizza"
    },
    "fast food": {
        "uz": "Fast Food",
        "ru": "Фастфуд",
        "en": "Fast Food",
        "tr": "Fast Food"
    },
    "salatlar": {
        "uz": "Salatlar",
        "ru": "Салаты",
        "en": "Salads",
        "tr": "Salatalar"
    },
    "ichimliklar": {
        "uz": "Ichimliklar",
        "ru": "Напитки",
        "en": "Beverages",
        "tr": "İçecekler"
    },
    "ichimliklar & desertlar": {
        "uz": "Ichimliklar va desertlar",
        "ru": "Напитки и десерты",
        "en": "Drinks & Desserts",
        "tr": "İçecekler ve Tatlılar"
    },
    "desertlar & tortlar": {
        "uz": "Desertlar va tortlar",
        "ru": "Десерты и торты",
        "en": "Desserts & Cakes",
        "tr": "Tatlılar ve Pastalar"
    },
    "pishiriqlar & kruassan": {
        "uz": "Pishiriqlar va kruassanlar",
        "ru": "Выпечка и круассаны",
        "en": "Bakery & Croissants",
        "tr": "Hamur İşleri ve Kruvasan"
    },
    "qahva & choylar": {
        "uz": "Qahva va choylar",
        "ru": "Кофе и чай",
        "en": "Coffee & Tea",
        "tr": "Kahve ve Çaylar"
    },
    "gullar": {
        "uz": "Gullar",
        "ru": "Цветы",
        "en": "Flowers",
        "tr": "Çiçekler"
    },
    "guldastalar": {
        "uz": "Guldastalar",
        "ru": "Букеты",
        "en": "Bouquets",
        "tr": "Buketler"
    },
    "atirgullar": {
        "uz": "Atirgullar",
        "ru": "Розы",
        "en": "Roses",
        "tr": "Güller"
    },
    "sovg'alar & qutilar": {
        "uz": "Sovg'alar va qutilar",
        "ru": "Подарки и боксы",
        "en": "Gifts & Boxes",
        "tr": "Hediyeler ve Kutular"
    },
    "ustki kiyimlar": {
        "uz": "Ustki kiyimlar",
        "ru": "Верхняя одежда",
        "en": "Outerwear",
        "tr": "Dış Giyim"
    },
    "poyabzal & krossovkalar": {
        "uz": "Poyabzal va krossovkalar",
        "ru": "Обувь и кроссовки",
        "en": "Shoes & Sneakers",
        "tr": "Ayakkabı ve Spor Ayakkabı"
    },
    "sumkalar & aksessuarlar": {
        "uz": "Sumkalar va aksessuarlar",
        "ru": "Сумки и аксессуары",
        "en": "Bags & Accessories",
        "tr": "Çantalar ve Aksesuarlar"
    },
    "smartfonlar": {
        "uz": "Smartfonlar",
        "ru": "Смартфоны",
        "en": "Smartphones",
        "tr": "Akıllı Telefonlar"
    },
    "noutbuklar & planshetlar": {
        "uz": "Noutbuklar va planshetlar",
        "ru": "Ноутбуки и планшеты",
        "en": "Laptops & Tablets",
        "tr": "Dizüstü ve Tabletler"
    },
    "audio & aksessuarlar": {
        "uz": "Audio va gadjetlar",
        "ru": "Аудио и гаджеты",
        "en": "Audio & Gadgets",
        "tr": "Ses ve Aletler"
    },
    "yangi mahsulotlar": {
        "uz": "Yangi mahsulotlar",
        "ru": "Новинки",
        "en": "New Arrivals",
        "tr": "Yeni Gelenler"
    },
    "asosiy to'plam": {
        "uz": "Asosiy to'plam",
        "ru": "Основная коллекция",
        "en": "Main Collection",
        "tr": "Ana Koleksiyon"
    },
    "lavashlar": {
        "uz": "Lavashlar",
        "ru": "Лаваши",
        "en": "Lavash Wraps",
        "tr": "Dürümler"
    },
    "burgerlar": {
        "uz": "Burgerlar",
        "ru": "Бургеры",
        "en": "Burgers",
        "tr": "Burgerler"
    },
    "kombo to’plamlar": {
        "uz": "Kombo to'plamlar",
        "ru": "Комбо сеты",
        "en": "Combo Sets",
        "tr": "Kombo Menüler"
    },
    "kombo to'plamlar": {
        "uz": "Kombo to'plamlar",
        "ru": "Комбо сеты",
        "en": "Combo Sets",
        "tr": "Kombo Menüler"
    },

    # ---------------- Grocery & Food Products ----------------
    "banan kg": {
        "uz": "Banan (1 kg)",
        "ru": "Бананы спелые (1 кг)",
        "en": "Fresh Bananas (1 kg)",
        "tr": "Taze Muz (1 kg)"
    },
    "sabzi kg": {
        "uz": "Sabzi (1 kg)",
        "ru": "Свежая сочная морковь (1 кг)",
        "en": "Fresh Carrots (1 kg)",
        "tr": "Taze Havuç (1 kg)"
    },
    "piyoz kg": {
        "uz": "Piyoz (1 kg)",
        "ru": "Репчатый лук отборный (1 кг)",
        "en": "Yellow Onions (1 kg)",
        "tr": "Kuru Soğan (1 kg)"
    },
    "mo'l goshti kg": {
        "uz": "Mol go'shti (1 kg)",
        "ru": "Говядина свежая отборная (1 кг)",
        "en": "Fresh Prime Beef (1 kg)",
        "tr": "Taze Sığır Eti (1 kg)"
    },
    "mol goshti kg": {
        "uz": "Mol go'shti (1 kg)",
        "ru": "Говядина свежая отборная (1 кг)",
        "en": "Fresh Prime Beef (1 kg)",
        "tr": "Taze Sığır Eti (1 kg)"
    },
    "mo'l goshti laxim kg": {
        "uz": "Mol go'shti lahm (1 kg)",
        "ru": "Говяжье филе бескостное (1 кг)",
        "en": "Boneless Beef Fillet (1 kg)",
        "tr": "Kemiksiz Dana Bonfile (1 kg)"
    },
    "mol goshti laxim kg": {
        "uz": "Mol go'shti lahm (1 kg)",
        "ru": "Говяжье филе бескостное (1 кг)",
        "en": "Boneless Beef Fillet (1 kg)",
        "tr": "Kemiksiz Dana Bonfile (1 kg)"
    },
    "qoy goshti kg": {
        "uz": "Qo'y go'shti (1 kg)",
        "ru": "Баранина свежая отборная (1 кг)",
        "en": "Fresh Tender Mutton (1 kg)",
        "tr": "Taze Kuzu Eti (1 kg)"
    },
    "farsh kg": {
        "uz": "Mol go'shti qiyma (1 kg)",
        "ru": "Фарш говяжий домашний (1 кг)",
        "en": "Minced Beef (1 kg)",
        "tr": "Dana Kıyma (1 kg)"
    },
    "kareyka kg": {
        "uz": "Kareyka (1 kg)",
        "ru": "Корейка на кости (1 кг)",
        "en": "Beef Loin on Bone (1 kg)",
        "tr": "Kemikli Pirzola (1 kg)"
    },
    "tovuq gusht kg": {
        "uz": "Tovuq go'shti (1 kg)",
        "ru": "Куриное филе свежее (1 кг)",
        "en": "Fresh Chicken Breast (1 kg)",
        "tr": "Taze Tavuk Göğsü (1 kg)"
    },
    "tovuq gosht kg": {
        "uz": "Tovuq go'shti (1 kg)",
        "ru": "Куриное филе свежее (1 кг)",
        "en": "Fresh Chicken Breast (1 kg)",
        "tr": "Taze Tavuk Göğsü (1 kg)"
    },
    "krilishki kg": {
        "uz": "Tovuq qanotchalari (1 kg)",
        "ru": "Куриные крылышки (1 кг)",
        "en": "Chicken Wings (1 kg)",
        "tr": "Tavuk Kanat (1 kg)"
    },
    "oyoqcha kg": {
        "uz": "Tovuq boldirlari (1 kg)",
        "ru": "Куриные голени (1 кг)",
        "en": "Chicken Drumsticks (1 kg)",
        "tr": "Tavuk But (1 kg)"
    },
    "aplesin kg": {
        "uz": "Apelsin (1 kg)",
        "ru": "Апельсины сладкие (1 кг)",
        "en": "Sweet Oranges (1 kg)",
        "tr": "Tatlı Portakal (1 kg)"
    },
    "olma kizil kg": {
        "uz": "Qizil olma (1 kg)",
        "ru": "Яблоки красные хрустящие (1 кг)",
        "en": "Crisp Red Apples (1 kg)",
        "tr": "Kırmızı Elma (1 kg)"
    },
    "anor kg": {
        "uz": "Anor (1 kg)",
        "ru": "Гранаты сочные отборные (1 кг)",
        "en": "Fresh Pomegranates (1 kg)",
        "tr": "Taze Sulu Nar (1 kg)"
    },
    "bodiring kg": {
        "uz": "Bodring (1 kg)",
        "ru": "Огурцы свежие грунтовые (1 кг)",
        "en": "Crisp Cucumbers (1 kg)",
        "tr": "Taze Çıtır Salatalık (1 kg)"
    },
    "pomidor kg": {
        "uz": "Pomidor (1 kg)",
        "ru": "Помидоры сочные грунтовые (1 кг)",
        "en": "Fresh Juicy Tomatoes (1 kg)",
        "tr": "Taze Sulu Domates (1 kg)"
    },
    "lavlagi kg": {
        "uz": "Lavlagi (1 kg)",
        "ru": "Свекла столовая сладкая (1 кг)",
        "en": "Sweet Beetroot (1 kg)",
        "tr": "Kırmızı Pancar (1 kg)"
    },
    "servelat kg": {
        "uz": "Servelat kolbasi (1 kg)",
        "ru": "Колбаса Сервелат высший сорт (1 кг)",
        "en": "Cervelat Premium Sausage (1 kg)",
        "tr": "Servelat Kaliteli Sucuk (1 kg)"
    },
    "doktorski kg": {
        "uz": "Doktorskaya kolbasi (1 kg)",
        "ru": "Колбаса Докторская классическая (1 кг)",
        "en": "Doktorskaya Classic Sausage (1 kg)",
        "tr": "Doktor Salamı (1 kg)"
    },
    "kopchonni kolbasa kg": {
        "uz": "Dudlangan kolbasa (1 kg)",
        "ru": "Копченая колбаса ароматная (1 кг)",
        "en": "Smoked Aromatic Sausage (1 kg)",
        "tr": "Tütsülenmiş Sucuk (1 kg)"
    },
    "sosiska kiriniy kg": {
        "uz": "Tovuqli sosiska (1 kg)",
        "ru": "Сосиски куриные нежные (1 кг)",
        "en": "Tender Chicken Sausages (1 kg)",
        "tr": "Tavuk Sosis (1 kg)"
    },
    "kartoshka yangi hosil (1 kg)": {
        "uz": "Kartoshka yangi hosil (1 kg)",
        "ru": "Молодой картофель отборный (1 кг)",
        "en": "Fresh New Crop Potatoes (1 kg)",
        "tr": "Taze Yeni Hasat Patates (1 kg)"
    },
    "pasta karbonara (parmesan)": {
        "uz": "Pasta Karbonara (Parmesan)",
        "ru": "Паста Карбонара с пармезаном",
        "en": "Pasta Carbonara with Parmesan",
        "tr": "Parmesanlı Makarna Carbonara"
    },
    "sezar salati tovuq go'shti bilan": {
        "uz": "Sezar salati tovuq go'shti bilan",
        "ru": "Салат Цезарь с нежной куриной грудкой",
        "en": "Caesar Salad with Tender Chicken",
        "tr": "Tavuklu Sezar Salatası"
    },
    "steyk ribay black angus": {
        "uz": "Steyk Ribay Black Angus",
        "ru": "Сочный стейк Рибай Black Angus",
        "en": "Juicy Ribeye Steak Black Angus",
        "tr": "Sulu Black Angus Antrikot"
    },
    "pitsa margarita 32sm (mozzarella)": {
        "uz": "Pitsa Margarita 32sm (Mozzarella)",
        "ru": "Пицца Маргарита с моцареллой 32см",
        "en": "Pizza Margherita 32cm with Mozzarella",
        "tr": "Margarita Pizza 32cm (Mozzarella)"
    },
    "katta burger classic (marmar mol go'shti)": {
        "uz": "Katta Burger Classic (Marmar mol go'shti)",
        "ru": "Бургер Классический из мраморной говядины",
        "en": "Classic Burger with Marbled Beef",
        "tr": "Klasik Mermer Dana Burger"
    },
    "klassik nyu-york chizkeyk": {
        "uz": "Klassik Nyu-York Chizkeyk",
        "ru": "Классический чизкейк Нью-Йорк",
        "en": "Classic New York Cheesecake",
        "tr": "Klasik New York Cheesecake"
    },
    "qizil atirgullar guldastasi (25 dona)": {
        "uz": "Qizil atirgullar guldastasi (25 dona)",
        "ru": "Букет отборных красных роз (25 шт)",
        "en": "Bouquet of Selected Red Roses (25 pcs)",
        "tr": "Seçkin Kırmızı Gül Buketi (25 adet)"
    },
    "pushti lolalar to'plami (19 dona)": {
        "uz": "Pushti lolalar to'plami (19 dona)",
        "ru": "Нежный букет розовых тюльпанов (19 шт)",
        "en": "Delicate Pink Tulips Bouquet (19 pcs)",
        "tr": "Pembe Lale Buketi (19 adet)"
    },
    "pionlar va gipsofila kompozitsiyasi": {
        "uz": "Pionlar va gipsofila kompozitsiyasi",
        "ru": "Роскошная композиция с пионами и эвкалиптом",
        "en": "Peony and Gypsophila Luxury Composition",
        "tr": "Şakayık ve Cipsofilya Çiçek Tanzimi"
    },
    "krossovkalar nike air max 270": {
        "uz": "Krossovkalar Nike Air Max 270",
        "ru": "Кроссовки Nike Air Max 270",
        "en": "Nike Air Max 270 Sneakers",
        "tr": "Nike Air Max 270 Spor Ayakkabı"
    },
    "xudi oversayz storebox basic": {
        "uz": "Xudi oversayz StoreBox Basic",
        "ru": "Худи оверсайз StoreBox Basic",
        "en": "Oversized Hoodie StoreBox Basic",
        "tr": "Oversize Kapüşonlu Sweatshirt"
    },
    "djinlar to'g'ri bichimli classic denim": {
        "uz": "Djinlar to'g'ri bichimli Classic Denim",
        "ru": "Джинсы прямые Classic Denim",
        "en": "Straight Fit Classic Denim Jeans",
        "tr": "Düz Kesim Klasik Denim Kot Pantolon"
    },
    "smartfon storebox pro": {
        "uz": "Smartfon StoreBox Pro",
        "ru": "Смартфон StoreBox Pro",
        "en": "Smartphone StoreBox Pro",
        "tr": "Akıllı Telefon StoreBox Pro"
    },
}

def resolve_translation(text: str, lang: str = 'uz', fallback: str = '') -> str:
    """
    Looks up pre-translated clean terms for common catalog items across uz, ru, en, tr.
    """
    if not text:
        return fallback or ''

    raw_key = text.strip().lower()
    
    # Direct match
    if raw_key in CATALOG_DICT:
        entry = CATALOG_DICT[raw_key]
        if lang in entry and entry[lang]:
            return entry[lang]

    # Clean key matching (removing double spaces, apostrophes)
    norm_key = raw_key.replace("'", "`").replace("’", "`").replace("ʻ", "`")
    for k, entry in CATALOG_DICT.items():
        k_norm = k.replace("'", "`").replace("’", "`").replace("ʻ", "`")
        if norm_key == k_norm:
            if lang in entry and entry[lang]:
                return entry[lang]

    # Partial / suffix matching e.g. "BANAN kg" -> "Banan"
    for k, entry in CATALOG_DICT.items():
        if norm_key.startswith(k) or k.startswith(norm_key):
            if lang in entry and entry[lang]:
                return entry[lang]

    return fallback or text
