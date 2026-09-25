# -*- coding: utf-8 -*-
"""
Intelligent Multilingual Catalog Translation Resolver for StoreBox.
Translates category and product names and descriptions dynamically across
UZ, RU, EN, and TR.
"""
import re
import os
import json
import html
import urllib.request
import urllib.parse
import ssl
from typing import Optional

# Global in-memory cache for ultra-fast translations
_TRANSLATION_CACHE = {}

_SSL_CTX = None
def _get_ssl_context():
    global _SSL_CTX
    if _SSL_CTX is None:
        try:
            _SSL_CTX = ssl.create_default_context()
            _SSL_CTX.check_hostname = False
            _SSL_CTX.verify_mode = ssl.CERT_NONE
        except Exception:
            _SSL_CTX = ssl._create_unverified_context()
    return _SSL_CTX

_DISK_CACHE_PATH = os.path.join(os.path.dirname(__file__), 'translations_cache.json')

def is_valid_translation(original: str, target_lang: str, translated: str, src_lang: str = 'auto') -> bool:
    """
    Validates whether a translated string is genuinely translated and valid.
    Prevents poisoned fallback entries (like Russian text cached for English/Uzbek/Turkish).
    """
    if not translated or not isinstance(translated, str):
        return False
    t_clean = translated.strip()
    if not t_clean:
        return False

    orig_clean = original.strip()
    target_lang = (target_lang or 'uz').lower()
    if src_lang == 'auto':
        src_lang = detect_text_language(orig_clean)

    # 1. Target is English, Turkish or Uzbek Latin, but result contains Cyrillic
    if target_lang in ['en', 'tr', 'uz'] and re.search(r'[\u0400-\u04FF]', t_clean):
        return False

    # 2. Target is Russian or Uzbek, but result contains Chinese/Arabic
    if target_lang in ['ru', 'uz', 'en', 'tr'] and re.search(r'[\u4e00-\u9fff\u0600-\u06FF]', t_clean):
        if not re.search(r'[\u4e00-\u9fff\u0600-\u06FF]', orig_clean):
            return False

    # 3. Source and target differ, but output is identical to input
    if src_lang != target_lang and t_clean.lower() == orig_clean.lower():
        # Only brand names with ASCII letters (e.g. Nike, iPhone, Coca-Cola) can be identical
        if re.search(r'[\u0400-\u04FF\u4e00-\u9fff\u0600-\u06FF]', orig_clean):
            return False

    return True

def _load_disk_cache():
    if os.path.exists(_DISK_CACHE_PATH):
        try:
            with open(_DISK_CACHE_PATH, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for k, v in data.items():
                    parts = k.split('||', 1)
                    if len(parts) == 2:
                        orig_text, tgt_l = parts[0], parts[1]
                        if is_valid_translation(orig_text, tgt_l, v):
                            _TRANSLATION_CACHE[(orig_text, tgt_l)] = v
        except Exception:
            pass

def _save_to_disk_cache(text, target_lang, translated, src_lang='auto'):
    if not is_valid_translation(text, target_lang, translated, src_lang):
        return
    try:
        data = {}
        if os.path.exists(_DISK_CACHE_PATH):
            try:
                with open(_DISK_CACHE_PATH, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except Exception:
                data = {}
        key = f"{text}||{target_lang}"
        data[key] = translated
        with open(_DISK_CACHE_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

_load_disk_cache()

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
    "g'osht maxsulotlari": {
        "uz": "G'osht mahsulotlari",
        "ru": "Мясные продукты",
        "en": "Meat Products",
        "tr": "Et Ürünleri"
    },
    "g`osht maxsulotlari": {
        "uz": "G'osht mahsulotlari",
        "ru": "Мясные продукты",
        "en": "Meat Products",
        "tr": "Et Ürünleri"
    },
    "gosht maxsulotlari": {
        "uz": "G'osht mahsulotlari",
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
    "fast-fud": {
        "uz": "Fast-Fud",
        "ru": "Фастфуд",
        "en": "Fast Food",
        "tr": "Fast Food"
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
    "qahva & ichimliklar": {
        "uz": "Qahva & Ichimliklar",
        "ru": "Кофе и Напитки",
        "en": "Coffee & Drinks",
        "tr": "Kahve ve İçecekler"
    },
    "burgerlar": {
        "uz": "Burgerlar",
        "ru": "Бургеры",
        "en": "Burgers",
        "tr": "Burgerler"
    },
    "maxsus nonushtalar": {
        "uz": "Maxsus Nonushtalar",
        "ru": "Фирменные Завтраки",
        "en": "Special Breakfasts",
        "tr": "Özel Kahvaltılar"
    },
    "nonushtalar": {
        "uz": "Nonushtalar",
        "ru": "Завтраки",
        "en": "Breakfasts",
        "tr": "Kahvaltılar"
    },
    "shaurma & doner": {
        "uz": "Shaurma & Doner",
        "ru": "Шаурма и Донер",
        "en": "Shawarma & Doner",
        "tr": "Şavarma ve Döner"
    },
    "lavashlar": {
        "uz": "Lavashlar",
        "ru": "Лаваши",
        "en": "Lavash Wraps",
        "tr": "Lavaş Dürümleri"
    },
    "hot-doglar": {
        "uz": "Hot-doglar",
        "ru": "Хот-доги",
        "en": "Hot Dogs",
        "tr": "Sosisli Sandviçler"
    },
    "maxsus desertlar": {
        "uz": "Maxsus Desertlar",
        "ru": "Фирменные Десерты",
        "en": "Signature Desserts",
        "tr": "Özel Tatlılar"
    },
    "gazaklar & fri": {
        "uz": "Gazaklar & Fri",
        "ru": "Закуски и Фри",
        "en": "Snacks & Fries",
        "tr": "Atıştırmalıklar ve Patates"
    },
    "gazaklar": {
        "uz": "Gazaklar",
        "ru": "Закуски",
        "en": "Snacks",
        "tr": "Atıştırmalıklar"
    },
    "kombo to'plamlar": {
        "uz": "Kombo to'plamlar",
        "ru": "Комбо наборы",
        "en": "Combo Sets",
        "tr": "Kombo Menüler"
    },
    "gullar": {
        "uz": "Gullar",
        "ru": "Цветы",
        "en": "Flowers",
        "tr": "Çiçekler"
    },
    "gul": {
        "uz": "Gul",
        "ru": "Цветок",
        "en": "Flower",
        "tr": "Çiçek"
    },
    "qizil gul": {
        "uz": "Qizil gul",
        "ru": "Красный цветок",
        "en": "Red Flower",
        "tr": "Kırmızı Çiçek"
    },
    "oq gul": {
        "uz": "Oq gul",
        "ru": "Белый цветок",
        "en": "White Flower",
        "tr": "Beyaz Çiçek"
    },
    "atirgul": {
        "uz": "Atirgul",
        "ru": "Роза",
        "en": "Rose",
        "tr": "Gül"
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
    "elektronika & gadjetlar": {
        "uz": "Elektronika va gadjetlar",
        "ru": "Электроника и гаджеты",
        "en": "Electronics & Gadgets",
        "tr": "Elektronik ve Aletler"
    },

    # ---------------- Popular Products ----------------
    "kartoshka yangi hosil (1 kg)": {
        "uz": "Kartoshka yangi hosil (1 kg)",
        "ru": "Картофель свежий отборный (1 кг)",
        "en": "Fresh Farm Potatoes (1 kg)",
        "tr": "Taze Çiftlik Patatesi (1 kg)"
    },
    "pasta karbonara (parmesan)": {
        "uz": "Pasta Karbonara (Parmesan)",
        "ru": "Паста Карбонара с пармезаном",
        "en": "Pasta Carbonara with Parmesan",
        "tr": "Parmesanlı Makarna Carbonara"
    },
    "sezar salati tovuq go'shti bilan": {
        "uz": "Sezar salati tovuq go'shti bilan",
        "ru": "Салат Цезарь с нежной курочкой",
        "en": "Caesar Salad with Tender Chicken",
        "tr": "Tavuklu Sezar Salatası"
    },
    "steyk ribay black angus": {
        "uz": "Steyk Ribay Black Angus",
        "ru": "Стейк Рибай Black Angus",
        "en": "Black Angus Ribeye Steak",
        "tr": "Black Angus Antrikot Biftek"
    },
    "pitsa margarita 32sm (mozzarella)": {
        "uz": "Pitsa Margarita 32sm (Mozzarella)",
        "ru": "Пицца Маргарита с моцареллой 32см",
        "en": "Pizza Margherita 32cm with Mozzarella",
        "tr": "Margarita Pizza 32cm (Mozzarella)"
    },
    "katta burger classic (marmar mol go'shti)": {
        "uz": "Katta Burger Classic (Marmar mol go'shti)",
        "ru": "Большой Бургер Классик из мраморной говядины",
        "en": "Classic Big Burger with Marbled Beef",
        "tr": "Klasik Büyük Mermer Dana Burger"
    },
    "chizburger": {
        "uz": "Chizburger",
        "ru": "Чизбургер Классический",
        "en": "Classic Cheeseburger",
        "tr": "Klasik Çizburger"
    },
    "double chizburger": {
        "uz": "Double Chizburger",
        "ru": "Дабл Чизбургер (Double Cheeseburger)",
        "en": "Double Cheeseburger",
        "tr": "Duble Çizburger"
    },
    "dabl chizburger": {
        "uz": "Double Chizburger",
        "ru": "Дабл Чизбургер (Double Cheeseburger)",
        "en": "Double Cheeseburger",
        "tr": "Duble Çizburger"
    },
    "steyk burger": {
        "uz": "Steyk Burger",
        "ru": "Стейк Бургер (Steak Burger)",
        "en": "Steak Burger",
        "tr": "Biftek Burger"
    },
    "egg burger (tuxumli)": {
        "uz": "EGG Burger (Tuxumli)",
        "ru": "EGG Burger (Завтрак-Бургер с яйцом)",
        "en": "EGG Burger (Breakfast Burger with Egg)",
        "tr": "EGG Burger (Yumurtalı Kahvaltı Burgeri)"
    },
    "crispy chicken burger": {
        "uz": "Crispy Chicken Burger",
        "ru": "Криспи Чикен Бургер (Crispy Chicken)",
        "en": "Crispy Chicken Burger",
        "tr": "Çıtır Tavuk Burger"
    },
    "bbq burger": {
        "uz": "BBQ Burger",
        "ru": "Барбекю Бургер (BBQ Burger)",
        "en": "BBQ Burger",
        "tr": "Barbekü Burger"
    },
    "halapeno burger": {
        "uz": "Halapeno Burger",
        "ru": "Халапеньо Бургер (Spicy Jalapeno)",
        "en": "Spicy Jalapeno Burger",
        "tr": "Acılı Jalapeno Burger"
    },
    "katta shaurma lavash": {
        "uz": "Katta Shaurma Lavash",
        "ru": "Шаурма Лаваш (Большая)",
        "en": "Large Shawarma Lavash",
        "tr": "Büyük Şavarma Lavaş"
    },
    "katta shaurma pita": {
        "uz": "Katta Shaurma Pita",
        "ru": "Шаурма Пита (Большая)",
        "en": "Large Shawarma Pita",
        "tr": "Büyük Şavarma Pide"
    },
    "tovuqli shaurma klassik": {
        "uz": "Tovuqli Shaurma Klassik",
        "ru": "Шаурма Куриная Классик",
        "en": "Classic Chicken Shawarma",
        "tr": "Klasik Tavuk Şavarma"
    },
    "katta hot-dog": {
        "uz": "Katta Hot-dog",
        "ru": "Хот-дог Большой",
        "en": "Large Hot Dog",
        "tr": "Büyük Sosisli Sandviç"
    },
    "halapeno dog (achchiq)": {
        "uz": "Halapeno Dog (Achchiq)",
        "ru": "Халапеньо Дог (Острый)",
        "en": "Spicy Jalapeno Hot Dog",
        "tr": "Acılı Jalapeno Sosisli"
    },
    "qahva kapuchino (350 ml)": {
        "uz": "Qahva Kapuchino (350 ml)",
        "ru": "Кофе Капучино (350 мл)",
        "en": "Cappuccino Coffee (350 ml)",
        "tr": "Kapuçino Kahve (350 ml)"
    },
    "qahva latte (350 ml)": {
        "uz": "Qahva Latte (350 ml)",
        "ru": "Кофе Латте (350 мл)",
        "en": "Latte Coffee (350 ml)",
        "tr": "Latte Kahve (350 ml)"
    },
    "shokoladli milksheyk oreo": {
        "uz": "Shokoladli Milksheyk Oreo",
        "ru": "Шоколадный Милкшейк Орео",
        "en": "Chocolate Milkshake Oreo",
        "tr": "Çikolatalı Oreo Milkshake"
    },
    "san-sebastian chizkeyk": {
        "uz": "San-Sebastian Chizkeyk",
        "ru": "Чизкейк Сан-Себастьян с шоколадом",
        "en": "San Sebastian Cheesecake with Chocolate",
        "tr": "Çikolatalı San Sebastian Cheesecake"
    },
    "klassik sirniklar": {
        "uz": "Klassik Sirniklar",
        "ru": "Сырники классические",
        "en": "Classic Cottage Cheese Pancakes",
        "tr": "Klasik Lor Peynirli Pankek"
    },
    "inglizcha nonushta": {
        "uz": "Inglizcha Nonushta",
        "ru": "Английский завтрак (Full English)",
        "en": "Full English Breakfast",
        "tr": "Tam İngiliz Kahvaltısı"
    },
    "ovchi nonushtasi": {
        "uz": "Ovchi Nonushtasi",
        "ru": "Завтрак охотника",
        "en": "Hunter's Breakfast",
        "tr": "Avcı Kahvaltısı"
    },
    "klassik shakshuka": {
        "uz": "Klassik Shakshuka",
        "ru": "Шакшука классическая",
        "en": "Classic Shakshuka",
        "tr": "Klasik Şakşuka"
    },
    "go'shtli shakshuka": {
        "uz": "Go'shtli Shakshuka",
        "ru": "Шакшука с мясом",
        "en": "Meat Shakshuka",
        "tr": "Etli Şakşuka"
    },
    "motsarella pishloqli tayoqchalar (6 dona)": {
        "uz": "Motsarella Pishloqli Tayoqchalar (6 dona)",
        "ru": "Сырные Палочки Моцарелла (6 шт)",
        "en": "Mozzarella Cheese Sticks (6 pcs)",
        "tr": "Mozzarella Peynir Çubukları (6 adet)"
    },
    "tovuqli naggets (9 dona)": {
        "uz": "Tovuqli Naggets (9 dona)",
        "ru": "Куриные Наггетсы (9 шт)",
        "en": "Chicken Nuggets (9 pcs)",
        "tr": "Tavuk Nugget (9 adet)"
    },
    "qarsildoq kartoshka fri": {
        "uz": "Qarsildoq Kartoshka Fri",
        "ru": "Хрустящий Картофель Фри",
        "en": "Crispy French Fries",
        "tr": "Çıtır Patates Kızartması"
    },
    "yangi terilgan bananlar (1 kg)": {
        "uz": "Yangi terilgan bananlar (1 kg)",
        "ru": "Бананы свежие Эквадор (1 кг)",
        "en": "Fresh Ecuadorian Bananas (1 kg)",
        "tr": "Taze Ekvador Muzu (1 kg)"
    },
    "qizil olma gala (1 kg)": {
        "uz": "Qizil olma Gala (1 kg)",
        "ru": "Яблоки красные Гала (1 кг)",
        "en": "Red Gala Apples (1 kg)",
        "tr": "Kırmızı Gala Elması (1 kg)"
    },
    "apelsin navel (1 kg)": {
        "uz": "Apelsin Navel (1 kg)",
        "ru": "Апельсины сочные Навел (1 кг)",
        "en": "Juicy Navel Oranges (1 kg)",
        "tr": "Sulu Navel Portakal (1 kg)"
    },
    "anor shirin (1 kg)": {
        "uz": "Anor shirin (1 kg)",
        "ru": "Гранаты сладкие отборные (1 кг)",
        "en": "Sweet Selected Pomegranates (1 kg)",
        "tr": "Tatlı Seçkin Nar (1 kg)"
    },
    "pomidor qizil sarxil (1 kg)": {
        "uz": "Pomidor qizil sarxil (1 kg)",
        "ru": "Помидоры свежие красные (1 кг)",
        "en": "Fresh Red Tomatoes (1 kg)",
        "tr": "Taze Kırmızı Domates (1 kg)"
    },
    "bodring bodomiy (1 kg)": {
        "uz": "Bodring bodomiy (1 kg)",
        "ru": "Огурцы базарные хрустящие (1 кг)",
        "en": "Crispy Fresh Cucumbers (1 kg)",
        "tr": "Çıtır Taze Salatalık (1 kg)"
    },
    "lavlagi sarxil (1 kg)": {
        "uz": "Lavlagi sarxil (1 kg)",
        "ru": "Свекла свежая отборная (1 кг)",
        "en": "Fresh Selected Beetroot (1 kg)",
        "tr": "Taze Seçkin Pancar (1 kg)"
    },
    "yangi mol go'shti (lahm, 1 kg)": {
        "uz": "Yangi mol go'shti (lahm, 1 kg)",
        "ru": "Свежая говядина мякоть (1 кг)",
        "en": "Fresh Boneless Beef (1 kg)",
        "tr": "Taze Kemiksiz Dana Eti (1 kg)"
    },
    "mol go'shti antrekot (1 kg)": {
        "uz": "Mol go'shti antrekot (1 kg)",
        "ru": "Антрекот говяжий на кости (1 kg)",
        "en": "Beef Entrecote Steak (1 kg)",
        "tr": "Dana Antrikot (1 kg)"
    },
    "qo'y go'shti qovurg'asi (1 kg)": {
        "uz": "Qo'y go'shti qovurg'asi (1 kg)",
        "ru": "Бараньи ребрышки свежие (1 кг)",
        "en": "Fresh Lamb Ribs (1 kg)",
        "tr": "Taze Kuzu Kaburga (1 kg)"
    },
    "doktorskaya kolbasi (1 kg)": {
        "uz": "Doktorskaya kolbasi (1 kg)",
        "ru": "Докторская вареная колбаса (1 кг)",
        "en": "Doctor's Bologna Sausage (1 kg)",
        "tr": "Doktor Salamı (1 kg)"
    },
    "servelat yarim dudlangan kolbasa (1 kg)": {
        "uz": "Servelat yarim dudlangan kolbasa (1 kg)",
        "ru": "Сервелат полукопченый мясной (1 кг)",
        "en": "Semi-Smoked Cervelat Sausage (1 kg)",
        "tr": "Yarı Füme Servelat Sosis (1 kg)"
    },
    "halol sosiskalar (1 kg)": {
        "uz": "Halol sosiskalar (1 kg)",
        "ru": "Сосиски говяжьи Халяль (1 кг)",
        "en": "Halal Beef Sausages (1 kg)",
        "tr": "Helal Dana Sosis (1 kg)"
    },
    "coca-cola classic (1.5l)": {
        "uz": "Coca-Cola Classic (1.5L)",
        "ru": "Кока-Кола Классическая (1.5л)",
        "en": "Coca-Cola Classic (1.5L)",
        "tr": "Coca-Cola Klasik (1.5L)"
    },
    "fanta orange (1.5l)": {
        "uz": "Fanta Orange (1.5L)",
        "ru": "Фанта Апельсин (1.5л)",
        "en": "Fanta Orange (1.5L)",
        "tr": "Fanta Portakal (1.5L)"
    },

    # ---------------- Promotional & Marketing Banners ----------------
    "quality meats burger & co. ® since 2014": {
        "uz": "Sifatli Go'sht BURGER & Co. ® 2014-yildan beri",
        "ru": "Настоящее Мясо BURGER & Co. ® С 2014 года",
        "en": "Quality Meats BURGER & Co. ® Since 2014",
        "tr": "Kaliteli Et BURGER & Co. ® 2014'ten beri"
    },
    "настоящие бургеры из мраморной говядины и свежая выпечка в самарканде!": {
        "uz": "Samarqandda marmar mol go'shtidan haqiqiy burgerlar va yangi pishiriqlar!",
        "ru": "Настоящие бургеры из мраморной говядины и свежая выпечка в Самарканде!",
        "en": "Authentic marbled beef burgers and fresh bakery in Samarkand!",
        "tr": "Semerkant'ta mermer dana etinden gerçek burgerler ve taze unlu mamuller!"
    },
    "фирменные завтраки с 7:00 до 12:00": {
        "uz": "Maxsus nonushtalar soat 7:00 dan 12:00 gacha",
        "ru": "Фирменные Завтраки с 7:00 до 12:00",
        "en": "Signature Breakfasts from 7:00 to 12:00",
        "tr": "Özel Kahvaltılar 7:00 - 12:00 arası"
    },
    "шакшука, сырники и классический английский завтрак со скидкой!": {
        "uz": "Shakshuka, sirniklar va klassik ingliz nonushtasi chegirma bilan!",
        "ru": "Шакшука, сырники и классический английский завтрак со скидкой!",
        "en": "Shakshuka, cottage cheese pancakes and classic English breakfast at a discount!",
        "tr": "Şakşuka, lor peynirli pankek ve klasik İngiliz kahvaltısı indirimli!"
    },
    "бесплатная доставка от 100 000 uzs": {
        "uz": "100 000 UZS dan bepul yetkazib berish",
        "ru": "Бесплатная доставка от 100 000 UZS",
        "en": "Free delivery from 100,000 UZS",
        "tr": "100.000 UZS üzeri ücretsiz teslimat"
    },
    "горячий заказ прямо к вашей двери за 25-35 минут.": {
        "uz": "25-35 daqiqada to'g'ridan-to'g'ri eshigingizgacha issiq buyurtma.",
        "ru": "Горячий заказ прямо к вашей двери за 25-35 минут.",
        "en": "Hot order right to your door in 25-35 minutes.",
        "tr": "25-35 dakikada doğrudan kapınıza sıcak teslimat."
    },
    "bepul yetkazib berish 150 000 uzs dan": {
        "uz": "150 000 UZS dan bepul yetkazib berish",
        "ru": "Бесплатная доставка от 150 000 UZS",
        "en": "Free delivery from 150,000 UZS",
        "tr": "150.000 UZS üzeri ücretsiz teslimat"
    },
    "issiq taomlar 35 daqiqada to'g'ridan-to'g'ri eshigingizgacha": {
        "uz": "Issiq taomlar 35 daqiqada to'g'ridan-to'g'ri eshigingizgacha",
        "ru": "Горячие блюда за 35 минут прямо к вашей двери",
        "en": "Hot dishes in 35 minutes directly to your door",
        "tr": "35 dakikada doğrudan kapınıza sıcak yemekler"
    },
    "maxsus kombo: big burger + fri + cola": {
        "uz": "Maxsus Kombo: Big Burger + Fri + Cola",
        "ru": "Специальное Комбо: Биг Бургер + Фри + Кола",
        "en": "Special Combo: Big Burger + Fries + Cola",
        "tr": "Özel Menü: Big Burger + Patates + Kola"
    },
    "atigi 49 000 uzs. 30 daqiqada issiq holda yetkazib beramiz!": {
        "uz": "Atigi 49 000 UZS. 30 daqiqada issiq holda yetkazib beramiz!",
        "ru": "Всего 49 000 UZS. Доставим горячим за 30 минут!",
        "en": "Only 49,000 UZS. Delivered hot in 30 minutes!",
        "tr": "Sadece 49.000 UZS. 30 dakikada sıcak teslimat!"
    },
    "«storebox» — issiq va mazali taomlar": {
        "uz": "«StoreBox» — Issiq va mazali taomlar",
        "ru": "«StoreBox» — Горячие и вкусные блюда",
        "en": "«StoreBox» — Hot and delicious food",
        "tr": "«StoreBox» — Sıcak ve lezzetli yemekler"
    },
    "sevimli taomlaringizni to'g'ridan-to'g'ri eshigingizgacha tezkor yetkazib beramiz!": {
        "uz": "Sevimli taomlaringizni to'g'ridan-to'g'ri eshigingizgacha tezkor yetkazib beramiz!",
        "ru": "Быстро доставим ваши любимые блюда прямо к вашей двери!",
        "en": "Fast delivery of your favorite dishes right to your door!",
        "tr": "En sevdiğiniz yemekleri hızlıca kapınıza kadar ulaştırıyoruz!"
    },
    "«ozodbek fullstackdev» — zamonaviy moda va uslub": {
        "uz": "«Ozodbek FullStackDev» — Zamonaviy moda va uslub",
        "ru": "«Ozodbek FullStackDev» — Современная мода и стиль",
        "en": "«Ozodbek FullStackDev» — Modern fashion and style",
        "tr": "«Ozodbek FullStackDev» — Modern moda ve stil"
    },
    "eng so'nggi trenddagi kiyimlar va aksessuarlar. o'zingizga mos uslubni toping!": {
        "uz": "Eng so'nggi trenddagi kiyimlar va aksessuarlar. O'zingizga mos uslubni toping!",
        "ru": "Одежда и аксессуары в последних трендах. Найдите свой стиль!",
        "en": "Latest trending clothes and accessories. Find your own style!",
        "tr": "En son trend kıyafetler ve aksesuarlar. Kendi tarzınızı keşfedin!"
    },
    "super taklif!": {
        "uz": "Super Taklif!",
        "ru": "Супер предложение!",
        "en": "Super Offer!",
        "tr": "Süper Teklif!"
    },
    "barcha tovarlarga chegirma": {
        "uz": "Barcha tovarlarga chegirma",
        "ru": "Скидка на все товары",
        "en": "Discount on all items",
        "tr": "Tüm ürünlerde indirim"
    },
    "maxsus takliflar va yangi aksiyalar": {
        "uz": "Maxsus takliflar va yangi aksiyalar",
        "ru": "Специальные предложения и новые акции",
        "en": "Special offers and new promotions",
        "tr": "Özel teklifler ve yeni kampanyalar"
    },
}

# ----------------- Lexical Components Dictionary -----------------
LEXICAL_MAP = [
    # Multi-word food expressions
    (r"\bikkita sersuv mol go'?shti kotleti\b", {
        "ru": "две сочные котлеты из говядины",
        "en": "two juicy beef patties",
        "tr": "iki sulu dana köftesi"
    }),
    (r"\bikki karra chedder pishlog'?i\b", {
        "ru": "двойная порция тающего сыра Чеддер",
        "en": "double melted Cheddar cheese",
        "tr": "çift eritilmiş Cheddar peyniri"
    }),
    (r"\bmarinadlangan bodring\b", {
        "ru": "маринованные бочковые огурчики",
        "en": "pickled cucumbers",
        "tr": "turşu salatalık"
    }),
    (r"\btuzlangan bodring\b", {
        "ru": "соленые огурцы",
        "en": "salted pickles",
        "tr": "tuzlu salatalık"
    }),
    (r"\bmaxsus sous\b", {
        "ru": "фирменный соус",
        "en": "signature special sauce",
        "tr": "özel imza sos"
    }),
    (r"\bmaxsus sousli\b", {
        "ru": "с фирменным соусом",
        "en": "with signature sauce",
        "tr": "özel sos ile"
    }),
    (r"\bmol go'?shti kotleti\b", {
        "ru": "котлета из говядины",
        "en": "beef patty",
        "tr": "dana eti köftesi"
    }),
    (r"\bmarmar mol go'?shti\b", {
        "ru": "мраморная говядина",
        "en": "marbled beef",
        "tr": "mermer dana eti"
    }),
    (r"\bmol go'?shti\b", {
        "ru": "говядина",
        "en": "beef",
        "tr": "dana eti"
    }),
    (r"\bqo'?y go'?shti\b", {
        "ru": "баранина",
        "en": "lamb",
        "tr": "kuzu eti"
    }),
    (r"\btovuq go'?shti\b", {
        "ru": "куриное филе",
        "en": "chicken fillet",
        "tr": "tavuk eti"
    }),
    (r"\btovuq filesi\b", {
        "ru": "куриное филе",
        "en": "chicken breast fillet",
        "tr": "tavuk göğsü"
    }),
    (r"\bqovurilgan tuxum\b", {
        "ru": "жареное яйцо",
        "en": "fried egg",
        "tr": "kızarmış yumurta"
    }),
    (r"\btuxumli\b", {
        "ru": "с яйцом",
        "en": "with egg",
        "tr": "yumurtalı"
    }),
    (r"\byumshoq briosh noni\b", {
        "ru": "мягкая булочка бриошь",
        "en": "soft brioche bun",
        "tr": "yumuşak brioche ekmeği"
    }),
    (r"\bqarsildoq qobiqda\b", {
        "ru": "в хрустящей панировке",
        "en": "in crispy breading",
        "tr": "çıtır kaplamada"
    }),
    (r"\bkartoshka fri\b", {
        "ru": "картофель фри",
        "en": "french fries",
        "tr": "patates kızartması"
    }),
    (r"\b100% arabika qahvasidan tayyorlangan\b", {
        "ru": "приготовленный из 100% арабики",
        "en": "brewed from 100% Arabica beans",
        "tr": "%100 Arabica kahvesinden hazırlanmış"
    }),
    (r"\bxushbo'?y kapuchino\b", {
        "ru": "ароматный капучино",
        "en": "fragrant cappuccino",
        "tr": "aromatik kapuçino"
    }),
    (r"\bxushbo'?y qahva\b", {
        "ru": "ароматный кофе",
        "en": "aromatic coffee",
        "tr": "kokulu kahve"
    }),
    (r"\bmashhur mayin\b", {
        "ru": "знаменитый нежный",
        "en": "famous delicate",
        "tr": "ünlü hafif"
    }),
    (r"\bbelgiya shokoladi bilan\b", {
        "ru": "с бельгийским шоколадом",
        "en": "with Belgian chocolate",
        "tr": "Belçika çikolatası ile"
    }),
    (r"\bysiqlikda saqlangan\b", {
        "ru": "сохраняющий тепло",
        "en": "served hot",
        "tr": "sıcak servis edilen"
    }),
    (r"\bqarsildoq\b", {
        "ru": "хрустящий",
        "en": "crispy",
        "tr": "çıtır"
    }),
    (r"\bsersuv\b", {
        "ru": "сочный",
        "en": "juicy",
        "tr": "sulu"
    }),
    (r"\byangi\b", {
        "ru": "свежий",
        "en": "fresh",
        "tr": "taze"
    }),
    (r"\bsarxil\b", {
        "ru": "отборный",
        "en": "premium",
        "tr": "seçkin"
    }),
    (r"\btabiiy\b", {
        "ru": "натуральный",
        "en": "natural",
        "tr": "doğal"
    }),
    (r"\bmuloyim\b", {
        "ru": "нежный",
        "en": "tender",
        "tr": "yumuşak"
    }),
    (r"\bklassik gamburger\b", {
        "uz": "klassik gamburger",
        "ru": "классический гамбургер",
        "en": "classic hamburger",
        "tr": "klasik hamburger"
    }),
    (r"\bklassik burger\b", {
        "uz": "klassik burger",
        "ru": "классический бургер",
        "en": "classic burger",
        "tr": "klasik burger"
    }),
    (r"\bgamburger\b", {
        "uz": "gamburger",
        "ru": "гамбургер",
        "en": "hamburger",
        "tr": "hamburger"
    }),
    (r"\bchizburger\b", {
        "uz": "chizburger",
        "ru": "чизбургер",
        "en": "cheeseburger",
        "tr": "çizburger"
    }),
    (r"\bdabl burger\b", {
        "uz": "dabl burger",
        "ru": "двойной бургер",
        "en": "double burger",
        "tr": "duble burger"
    }),
    (r"\bklub sendvich\b", {
        "uz": "klub sendvich",
        "ru": "клаб-сэндвич",
        "en": "club sandwich",
        "tr": "kulüp sandviç"
    }),
    (r"\bshaurma\b", {
        "uz": "shaurma",
        "ru": "шаурма",
        "en": "shawarma",
        "tr": "şavurma"
    }),
    (r"\blavash\b", {
        "uz": "lavash",
        "ru": "лаваш",
        "en": "lavash wrap",
        "tr": "lavaş"
    }),
    (r"\bhot-dog\b", {
        "uz": "hot-dog",
        "ru": "хот-дог",
        "en": "hot dog",
        "tr": "sosisli sandviç"
    }),
    (r"\bnaggetslar\b", {
        "uz": "naggetslar",
        "ru": "наггетсы",
        "en": "nuggets",
        "tr": "nugget"
    }),
    (r"\bfri kartoshkasi\b", {
        "uz": "fri kartoshkasi",
        "ru": "картофель фри",
        "en": "french fries",
        "tr": "patates kızartması"
    }),
    (r"\bpomidorlar\b", {
        "uz": "pomidorlar",
        "ru": "помидоры",
        "en": "tomatoes",
        "tr": "domates"
    }),
    (r"\bpomidor\b", {
        "uz": "pomidor",
        "ru": "помидоры",
        "en": "tomatoes",
        "tr": "domates"
    }),
    (r"\bbodringlar\b", {
        "uz": "bodringlar",
        "ru": "огурцы",
        "en": "cucumbers",
        "tr": "salatalık"
    }),
    (r"\bbodring\b", {
        "uz": "bodring",
        "ru": "огурец",
        "en": "cucumber",
        "tr": "salatalık"
    }),
    (r"\bpiyoz\b", {
        "uz": "piyoz",
        "ru": "лук",
        "en": "onion",
        "tr": "soğan"
    }),
    (r"\bsalat bargi\b", {
        "uz": "salat bargi",
        "ru": "листья салата",
        "en": "lettuce leaves",
        "tr": "marul yaprakları"
    }),
    (r"\bmayonez\b", {
        "uz": "mayonez",
        "ru": "майонез",
        "en": "mayonnaise",
        "tr": "mayonez"
    }),
    (r"\bketchup\b", {
        "uz": "ketchup",
        "ru": "кетчуп",
        "en": "ketchup",
        "tr": "ketçap"
    }),
    (r"\bkotlet\b", {
        "uz": "kotlet",
        "ru": "котлета",
        "en": "patty",
        "tr": "köfte"
    }),
    (r"\bnon\b", {
        "uz": "non",
        "ru": "хлеб",
        "en": "bread",
        "tr": "ekmek"
    }),
    (r"\bmuzdek\b", {
        "uz": "muzdek",
        "ru": "ледяной",
        "en": "ice-cold",
        "tr": "buz gibi"
    }),
    (r"\bissiq\b", {
        "uz": "issiq",
        "ru": "горячий",
        "en": "hot",
        "tr": "sıcak"
    }),
    (r"\bmazali\b", {
        "uz": "mazali",
        "ru": "вкусный",
        "en": "delicious",
        "tr": "lezzetli"
    }),
    (r"\bshirin va to'?yimli\b", {
        "uz": "shirin va to'yimli",
        "ru": "вкусный и сытный",
        "en": "delicious and satisfying",
        "tr": "lezzetli ve doyurucu"
    }),
    (r"\bto'?yimli\b", {
        "uz": "to'yimli",
        "ru": "сытный",
        "en": "satisfying",
        "tr": "doyurucu"
    }),
    (r"\bbilan tayyorlangan\b", {
        "uz": "bilan tayyorlangan",
        "ru": "приготовленный с",
        "en": "prepared with",
        "tr": "ile hazırlanmış"
    }),
    (r"\btayyorlangan\b", {
        "uz": "tayyorlangan",
        "ru": "приготовленный",
        "en": "prepared",
        "tr": "hazırlanmış"
    }),
    (r"\bpishirilgan\b", {
        "uz": "pishirilgan",
        "ru": "запеченный",
        "en": "baked",
        "tr": "pişirilmiş"
    }),
    (r"\bqovurilgan\b", {
        "uz": "qovurilgan",
        "ru": "жареный",
        "en": "fried",
        "tr": "kızarmış"
    }),
    (r"\bshirin\b", {
        "uz": "shirin",
        "ru": "сладкий",
        "en": "sweet",
        "tr": "tatlı"
    }),
    (r"\bachchiq\b", {
        "uz": "achchiq",
        "ru": "острый",
        "en": "spicy",
        "tr": "acılı"
    }),
    (r"\bpishloq\b", {
        "uz": "pishloq",
        "ru": "сыр",
        "en": "cheese",
        "tr": "peynir"
    }),
    (r"\bpishloqli\b", {
        "uz": "pishloqli",
        "ru": "с сыром",
        "en": "with cheese",
        "tr": "peynirli"
    }),
    (r"\bsousli\b", {
        "uz": "sousli",
        "ru": "с соусом",
        "en": "with sauce",
        "tr": "soslu"
    }),
    (r"\bva\b", {
        "uz": "va",
        "ru": "и",
        "en": "and",
        "tr": "ve"
    }),
    (r"\bbilan\b", {
        "uz": "bilan",
        "ru": "с",
        "en": "with",
        "tr": "ile"
    }),
    (r"\buchun\b", {
        "uz": "uchun",
        "ru": "для",
        "en": "for",
        "tr": "için"
    }),
    (r"\bkatta\b", {
        "uz": "katta",
        "ru": "большой",
        "en": "large",
        "tr": "büyük"
    }),
    (r"\bkichik\b", {
        "uz": "kichik",
        "ru": "маленький",
        "en": "small",
        "tr": "küçük"
    }),
    (r"\bikkita\b", {
        "uz": "ikkita",
        "ru": "два",
        "en": "two",
        "tr": "iki"
    }),
    (r"\buchta\b", {
        "uz": "uchta",
        "ru": "три",
        "en": "three",
        "tr": "üç"
    }),
    (r"\bto'?rtta\b", {
        "uz": "to'rtta",
        "ru": "четыре",
        "en": "four",
        "tr": "dört"
    }),
    (r"\bbesh\b", {
        "uz": "besh",
        "ru": "пять",
        "en": "five",
        "tr": "beş"
    }),
    (r"\boltita\b", {
        "uz": "oltita",
        "ru": "шесть",
        "en": "six",
        "tr": "altı"
    }),
    (r"\bdona\b", {
        "uz": "dona",
        "ru": "шт.",
        "en": "pcs",
        "tr": "adet"
    }),
    # --- Russian source patterns ---
    (r"\bклассический гамбургер\b", {
        "uz": "klassik gamburger",
        "ru": "классический гамбургер",
        "en": "classic hamburger",
        "tr": "klasik hamburger"
    }),
    (r"\bклассический бургер\b", {
        "uz": "klassik burger",
        "ru": "классический бургер",
        "en": "classic burger",
        "tr": "klasik burger"
    }),
    (r"\bдвойной бургер\b", {
        "uz": "dabl burger",
        "ru": "двойной бургер",
        "en": "double burger",
        "tr": "duble burger"
    }),
    (r"\bгамбургер\b", {
        "uz": "gamburger",
        "ru": "гамбургер",
        "en": "hamburger",
        "tr": "hamburger"
    }),
    (r"\bчизбургер\b", {
        "uz": "chizburger",
        "ru": "чизбургер",
        "en": "cheeseburger",
        "tr": "çizburger"
    }),
    (r"\bбургер\b", {
        "uz": "burger",
        "ru": "бургер",
        "en": "burger",
        "tr": "burger"
    }),
    (r"\bкартофель фри\b", {
        "uz": "kartoshka fri",
        "ru": "картофель фри",
        "en": "french fries",
        "tr": "patates kızartması"
    }),
    (r"\bкартошка фри\b", {
        "uz": "kartoshka fri",
        "ru": "картофель фри",
        "en": "french fries",
        "tr": "patates kızartması"
    }),
    (r"\bнаггетсы\b", {
        "uz": "naggetslar",
        "ru": "наггетсы",
        "en": "nuggets",
        "tr": "nugget"
    }),
    (r"\bлаваш\b", {
        "uz": "lavash",
        "ru": "лаваш",
        "en": "lavash wrap",
        "tr": "lavaş"
    }),
    (r"\bшаурма\b", {
        "uz": "shaurma",
        "ru": "шаурма",
        "en": "shawarma",
        "tr": "şavurma"
    }),
    (r"\bхот-дог\b", {
        "uz": "hot-dog",
        "ru": "хот-дог",
        "en": "hot dog",
        "tr": "sosisli sandviç"
    }),
    (r"\bпицца\b", {
        "uz": "pitsa",
        "ru": "пицца",
        "en": "pizza",
        "tr": "pizza"
    }),
    (r"\bкотлета из говядины\b", {
        "uz": "mol go'shti kotleti",
        "ru": "котлета из говядины",
        "en": "beef patty",
        "tr": "dana eti köftesi"
    }),
    (r"\bиз говядины\b", {
        "uz": "mol go'shtidan",
        "ru": "из говядины",
        "en": "beef",
        "tr": "dana etli"
    }),
    (r"\bговядина\b", {
        "uz": "mol go'shti",
        "ru": "говядина",
        "en": "beef",
        "tr": "dana eti"
    }),
    (r"\bбаранина\b", {
        "uz": "qo'y go'shti",
        "ru": "баранина",
        "en": "lamb",
        "tr": "kuzu eti"
    }),
    (r"\bкуриное филе\b", {
        "uz": "tovuq filesi",
        "ru": "куриное филе",
        "en": "chicken fillet",
        "tr": "tavuk göğsü"
    }),
    (r"\bкурица\b", {
        "uz": "tovuq go'shti",
        "ru": "курица",
        "en": "chicken",
        "tr": "tavuk"
    }),
    (r"\bсыр чеддер\b", {
        "uz": "chedder pishlog'i",
        "ru": "сыр Чеддер",
        "en": "Cheddar cheese",
        "tr": "Cheddar peyniri"
    }),
    (r"\bсыр\b", {
        "uz": "pishloq",
        "ru": "сыр",
        "en": "cheese",
        "tr": "peynir"
    }),
    (r"\bс сыром\b", {
        "uz": "pishloqli",
        "ru": "с сыром",
        "en": "with cheese",
        "tr": "peynirli"
    }),
    (r"\bфирменный соус\b", {
        "uz": "maxsus sous",
        "ru": "фирменный соус",
        "en": "signature sauce",
        "tr": "özel sos"
    }),
    (r"\bсоус\b", {
        "uz": "sous",
        "ru": "соус",
        "en": "sauce",
        "tr": "sos"
    }),
    (r"\bс соусом\b", {
        "uz": "sousli",
        "ru": "с соусом",
        "en": "with sauce",
        "tr": "soslu"
    }),
    (r"\bсо свежими помидорами\b", {
        "uz": "yangi pomidorlar bilan",
        "ru": "со свежими помидорами",
        "en": "with fresh tomatoes",
        "tr": "taze domates ile"
    }),
    (r"\bпомидоры\b", {
        "uz": "pomidorlar",
        "ru": "помидоры",
        "en": "tomatoes",
        "tr": "domates"
    }),
    (r"\bпомидор\b", {
        "uz": "pomidor",
        "ru": "помидоры",
        "en": "tomatoes",
        "tr": "domates"
    }),
    (r"\bогурцы\b", {
        "uz": "bodringlar",
        "ru": "огурцы",
        "en": "cucumbers",
        "tr": "salatalık"
    }),
    (r"\bсоленые огурцы\b", {
        "uz": "tuzlangan bodring",
        "ru": "соленые огурцы",
        "en": "pickles",
        "tr": "turşu salatalık"
    }),
    (r"\bмаринованные огурцы\b", {
        "uz": "marinadlangan bodring",
        "ru": "маринованные огурцы",
        "en": "pickled cucumbers",
        "tr": "turşu salatalık"
    }),
    (r"\bсвежий\b", {
        "uz": "yangi",
        "ru": "свежий",
        "en": "fresh",
        "tr": "taze"
    }),
    (r"\bсвежие\b", {
        "uz": "yangi",
        "ru": "свежие",
        "en": "fresh",
        "tr": "taze"
    }),
    (r"\bсочный\b", {
        "uz": "sersuv",
        "ru": "сочный",
        "en": "juicy",
        "tr": "sulu"
    }),
    (r"\bвкусный\b", {
        "uz": "mazali",
        "ru": "вкусный",
        "en": "delicious",
        "tr": "lezzetli"
    }),
    (r"\bсытный\b", {
        "uz": "to'yimli",
        "ru": "сытный",
        "en": "satisfying",
        "tr": "doyurucu"
    }),
    (r"\bгорячий\b", {
        "uz": "issiq",
        "ru": "горячий",
        "en": "hot",
        "tr": "sıcak"
    }),
    (r"\bприготовленный с\b", {
        "uz": "bilan tayyorlangan",
        "ru": "приготовленный с",
        "en": "prepared with",
        "tr": "ile hazırlanmış"
    }),
    (r"\bприготовленный\b", {
        "uz": "tayyorlangan",
        "ru": "приготовленный",
        "en": "prepared",
        "tr": "hazırlanmış"
    }),
    (r"\bи\b", {
        "uz": "va",
        "ru": "и",
        "en": "and",
        "tr": "ve"
    }),
    (r"\bс\b", {
        "uz": "bilan",
        "ru": "с",
        "en": "with",
        "tr": "ile"
    }),
    (r"\bдля\b", {
        "uz": "uchun",
        "ru": "для",
        "en": "for",
        "tr": "için"
    }),
    (r"\bбольшой\b", {
        "uz": "katta",
        "ru": "большой",
        "en": "large",
        "tr": "büyük"
    }),
    (r"\bмаленький\b", {
        "uz": "kichik",
        "ru": "маленький",
        "en": "small",
        "tr": "küçük"
    }),
    (r"\bпорция\b", {
        "uz": "porsiya",
        "ru": "порция",
        "en": "portion",
        "tr": "porsiyon"
    }),
    (r"\bшт\b", {
        "uz": "dona",
        "ru": "шт.",
        "en": "pcs",
        "tr": "adet"
    }),
]

_REVERSE_CATALOG_INDEX = {}

def get_reverse_catalog_index():
    global _REVERSE_CATALOG_INDEX
    if not _REVERSE_CATALOG_INDEX:
        idx = {}
        for k, entry in CATALOG_DICT.items():
            k_clean = k.strip().lower().replace("'", "`").replace("’", "`").replace("ʻ", "`")
            idx[k_clean] = entry
            for l_code, l_val in entry.items():
                if isinstance(l_val, str) and l_val.strip():
                    v_clean = l_val.strip().lower().replace("'", "`").replace("’", "`").replace("ʻ", "`")
                    idx[v_clean] = entry
        _REVERSE_CATALOG_INDEX = idx
    return _REVERSE_CATALOG_INDEX

def resolve_translation(text: str, lang: str = 'uz', fallback: str = '') -> str:
    """
    Looks up pre-translated clean terms for common catalog items across uz, ru, en, tr.
    Supports bidirectional lookups from any source language!
    """
    if not text:
        return fallback or ''

    norm_key = text.strip().lower().replace("'", "`").replace("’", "`").replace("ʻ", "`")
    rev_index = get_reverse_catalog_index()

    # 1. Exact match in reverse index
    if norm_key in rev_index:
        entry = rev_index[norm_key]
        if lang in entry and entry[lang]:
            return entry[lang]

    # 2. Prefix / partial match
    for k, entry in rev_index.items():
        if norm_key == k or (len(k) > 5 and norm_key.startswith(k)):
            if lang in entry and entry[lang]:
                return entry[lang]

    return fallback or text

def detect_text_language(text: str) -> str:
    """
    Detects the script / language of input text (RU, ZH, TR, UZ, AR, EN, etc.)
    """
    if not text:
        return 'auto'
    if re.search(r'[\u0400-\u04FF]', text):
        return 'ru'
    if re.search(r'[\u4e00-\u9fff]', text):
        return 'zh-CN'
    if re.search(r'[\u0600-\u06FF]', text):
        return 'ar'
    if re.search(r'[çğıöşüÇĞİÖŞÜ]', text):
        return 'tr'
    if re.search(r"[oO]['`ʻ‘]?[gG]['`ʻ‘]|sh|ch|ning|dan|lar|dona", text, re.IGNORECASE):
        return 'uz'
    return 'auto'


def translate_online(text: str, target_lang: str = 'en', src_lang: str = 'auto') -> Optional[str]:
    """
    Fast online multi-engine translator supporting any input language to UZ, RU, EN, TR.
    """
    if not text or not text.strip():
        return ''
    text_clean = text.strip()
    target_lang = (target_lang or 'en').lower()
    if target_lang not in ['uz', 'ru', 'en', 'tr']:
        target_lang = 'uz'

    # Determine source language name and code
    src_clean = (src_lang or 'auto').lower()
    if src_clean in ['uz', 'ru', 'en', 'tr', 'zh-cn', 'zh', 'ar']:
        src_code = 'zh-CN' if src_clean.startswith('zh') else src_clean
        src_name_map = {
            'uz': 'uzbek',
            'ru': 'russian',
            'en': 'english',
            'tr': 'turkish',
            'zh-CN': 'chinese simplified',
            'zh': 'chinese simplified',
            'ar': 'arabic'
        }
        src_name = src_name_map.get(src_code, 'english')
    else:
        # Detect language
        if re.search(r'[\u0400-\u04FF]', text_clean):
            src_name = 'russian'
            src_code = 'ru'
        elif re.search(r'[\u4e00-\u9fff]', text_clean):
            src_name = 'chinese simplified'
            src_code = 'zh-CN'
        elif re.search(r'[\u0600-\u06FF]', text_clean):
            src_name = 'arabic'
            src_code = 'ar'
        elif re.search(r'[çğıöşüÇĞİÖŞÜ]', text_clean):
            src_name = 'turkish'
            src_code = 'tr'
        elif re.search(r"[oO]['`ʻ‘]?[gG]['`ʻ‘]|sh|ch|ning|dan|lar|dona", text_clean, re.IGNORECASE):
            src_name = 'uzbek'
            src_code = 'uz'
        else:
            src_name = 'english'
            src_code = 'en'

    tgt_map = {
        'ru': 'russian',
        'en': 'english',
        'uz': 'uzbek',
        'tr': 'turkish'
    }
    tgt_name = tgt_map.get(target_lang, 'english')

    if src_name == tgt_name:
        return text_clean

    # 1. deep_translator MyMemoryTranslator
    try:
        from deep_translator import MyMemoryTranslator
        res = MyMemoryTranslator(source=src_name, target=tgt_name).translate(text_clean)
        if res and isinstance(res, str) and not res.startswith('MYMEMORY') and not res.startswith('QUERY LENGTH'):
            cleaned = html.unescape(res).strip()
            if is_valid_translation(text_clean, target_lang, cleaned, src_code):
                return cleaned
    except Exception:
        pass

    # 2. Raw MyMemory API endpoint
    try:
        ctx = _get_ssl_context()
        url = f"https://api.mymemory.translated.net/get?q={urllib.parse.quote(text_clean)}&langpair={src_code}|{target_lang}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
        with urllib.request.urlopen(req, timeout=4.0, context=ctx) as r:
            data = json.loads(r.read().decode('utf-8'))
            trans = data.get('responseData', {}).get('translatedText')
            if trans and isinstance(trans, str) and not trans.startswith('MYMEMORY') and not trans.startswith('QUERY LENGTH'):
                cleaned = html.unescape(trans).strip()
                if is_valid_translation(text_clean, target_lang, cleaned, src_code):
                    return cleaned
    except Exception:
        pass

    # 3. Google Chrome Dict API
    try:
        ctx = _get_ssl_context()
        url = f"https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl={src_code}&tl={target_lang}&q={urllib.parse.quote(text_clean)}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
        with urllib.request.urlopen(req, timeout=3.5, context=ctx) as r:
            data = json.loads(r.read().decode('utf-8'))
            if isinstance(data, list) and len(data) > 0:
                first = data[0]
                cand = None
                if isinstance(first, list) and len(first) > 0 and isinstance(first[0], str):
                    cand = first[0].strip()
                elif isinstance(first, str) and first.strip():
                    cand = first.strip()
                if cand:
                    cleaned = html.unescape(cand).strip()
                    if is_valid_translation(text_clean, target_lang, cleaned, src_code):
                        return cleaned
    except Exception:
        pass

    return None

CYRILLIC_TO_UZBEK_LATIN = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'x', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sh', 'ъ': "'",
    'ы': 'i', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya', 'ў': "o'", 'ғ': "g'",
    'ҳ': 'h', 'қ': 'q',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'J', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'X', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sh', 'Ъ': "'",
    'Ы': 'I', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya', 'Ў': "O'", 'Ғ': "G'",
    'Ҳ': 'H', 'Қ': 'Q'
}

def transliterate_cyrillic_to_latin(text: str) -> str:
    res = []
    for ch in text:
        res.append(CYRILLIC_TO_UZBEK_LATIN.get(ch, ch))
    return "".join(res)

def auto_translate_text(text: str, target_lang: str = 'ru', src_lang: str = 'auto') -> str:
    """
    Universal multi-layer translator for products and categories:
    1. Memory & disk cache (validated)
    2. Curated e-commerce dictionary (CATALOG_DICT)
    3. Online Neural Translation (Google / MyMemory)
    4. Fast lexical pattern mappings (LEXICAL_MAP)
    5. Script transliteration fallback (never leaves untranslated Cyrillic for EN/UZ/TR)
    """
    if not text or not text.strip():
        return ''

    text_clean = text.strip()
    target_lang = (target_lang or 'uz').lower()
    if target_lang not in ['uz', 'ru', 'en', 'tr']:
        target_lang = 'uz'

    if src_lang == 'auto':
        src_lang = detect_text_language(text_clean)

    cache_key = (text_clean, target_lang)
    if cache_key in _TRANSLATION_CACHE:
        cached_val = _TRANSLATION_CACHE[cache_key]
        if is_valid_translation(text_clean, target_lang, cached_val, src_lang):
            return cached_val
        else:
            del _TRANSLATION_CACHE[cache_key]

    if src_lang == target_lang and src_lang != 'auto':
        _TRANSLATION_CACHE[cache_key] = text_clean
        return text_clean

    # 1. Curated dictionary match
    dict_val = resolve_translation(text_clean, lang=target_lang)
    if dict_val and is_valid_translation(text_clean, target_lang, dict_val, src_lang):
        _TRANSLATION_CACHE[cache_key] = dict_val
        _save_to_disk_cache(text_clean, target_lang, dict_val, src_lang)
        return dict_val

    # 2. Online neural translation engine
    online_val = translate_online(text_clean, target_lang=target_lang, src_lang=src_lang)
    if online_val and is_valid_translation(text_clean, target_lang, online_val, src_lang):
        _TRANSLATION_CACHE[cache_key] = online_val
        _save_to_disk_cache(text_clean, target_lang, online_val, src_lang)
        return online_val

    # 3. Fallback to lexical pattern replacement
    translated_text = text_clean
    for pattern, trans_map in LEXICAL_MAP:
        if target_lang in trans_map:
            replacement = trans_map[target_lang]
            translated_text = re.sub(pattern, replacement, translated_text, flags=re.IGNORECASE)

    # 4. If target is Uzbek or English/Turkish and text still has Cyrillic, transliterate
    if target_lang in ['uz', 'en', 'tr'] and re.search(r'[\u0400-\u04FF]', translated_text):
        translated_text = transliterate_cyrillic_to_latin(translated_text)

    sentences = re.split(r'([.!?]\s+)', translated_text)
    capitalized_sentences = []
    for s in sentences:
        if s and not re.match(r'^[.!?]\s+$', s):
            capitalized_sentences.append(s[0].upper() + s[1:])
        else:
            capitalized_sentences.append(s)
    result = "".join(capitalized_sentences).strip()

    if is_valid_translation(text_clean, target_lang, result, src_lang):
        _TRANSLATION_CACHE[cache_key] = result
        _save_to_disk_cache(text_clean, target_lang, result, src_lang)
    return result


def auto_populate_product_translations(product, save: bool = False):
    """
    Automatically detects language and translates all product names and descriptions
    across UZ, RU, EN, and TR.
    """
    candidates = [
        (product.name_ru, 'ru'),
        (product.name_uz, 'uz'),
        (product.name_en, 'en'),
        (getattr(product, 'name_tr', None), 'tr'),
    ]
    src_name = ''
    src_l = 'auto'
    for val, default_l in candidates:
        if val and val.strip():
            src_name = val.strip()
            detected = detect_text_language(src_name)
            src_l = detected if detected != 'auto' else default_l
            break

    if src_name:
        name_tasks = []
        for l in ['uz', 'ru', 'en', 'tr']:
            attr = f'name_{l}'
            curr = (getattr(product, attr, None) or '').strip()
            needs_trans = False
            if not curr:
                needs_trans = True
            elif l != src_l:
                if curr.lower() == src_name.lower():
                    needs_trans = True
                elif re.search(r'[\u0400-\u04FF]', curr) and l in ['en', 'tr', 'uz']:
                    needs_trans = True

            if needs_trans or not is_valid_translation(src_name, l, curr, src_l):
                if l == src_l:
                    setattr(product, attr, src_name)
                else:
                    name_tasks.append((attr, l, src_name, src_l))

        if name_tasks:
            from concurrent.futures import ThreadPoolExecutor
            with ThreadPoolExecutor(max_workers=min(4, len(name_tasks))) as ex:
                def _do_name_t(item):
                    att, tgt, txt, sl = item
                    return att, tgt, auto_translate_text(txt, target_lang=tgt, src_lang=sl), txt, sl
                for att, tgt, trans, txt, sl in ex.map(_do_name_t, name_tasks):
                    if trans and is_valid_translation(txt, tgt, trans, sl):
                        setattr(product, att, trans)

    desc_candidates = [
        (product.description_ru, 'ru'),
        (product.description_uz, 'uz'),
        (product.description_en, 'en'),
        (getattr(product, 'description_tr', None), 'tr'),
    ]
    src_desc = ''
    src_dl = 'auto'
    for val, default_l in desc_candidates:
        if val and val.strip():
            src_desc = val.strip()
            detected = detect_text_language(src_desc)
            src_dl = detected if detected != 'auto' else default_l
            break

    if src_desc:
        desc_tasks = []
        for l in ['uz', 'ru', 'en', 'tr']:
            attr = f'description_{l}'
            curr = (getattr(product, attr, None) or '').strip()
            needs_trans = False
            if not curr:
                needs_trans = True
            elif l != src_dl:
                if curr.lower() == src_desc.lower():
                    needs_trans = True
                elif re.search(r'[\u0400-\u04FF]', curr) and l in ['en', 'tr', 'uz']:
                    needs_trans = True

            if needs_trans or not is_valid_translation(src_desc, l, curr, src_dl):
                if l == src_dl:
                    setattr(product, attr, src_desc)
                else:
                    desc_tasks.append((attr, l, src_desc, src_dl))

        if desc_tasks:
            from concurrent.futures import ThreadPoolExecutor
            with ThreadPoolExecutor(max_workers=min(4, len(desc_tasks))) as ex:
                def _do_desc_t(item):
                    att, tgt, txt, sl = item
                    return att, tgt, auto_translate_text(txt, target_lang=tgt, src_lang=sl), txt, sl
                for att, tgt, trans, txt, sl in ex.map(_do_desc_t, desc_tasks):
                    if trans and is_valid_translation(txt, tgt, trans, sl):
                        setattr(product, att, trans)

    if save:
        product.save(update_fields=['name_uz', 'name_ru', 'name_en', 'name_tr', 'description_uz', 'description_ru', 'description_en', 'description_tr'])


def auto_populate_category_translations(category, save: bool = False):
    """
    Automatically detects language and translates category names across UZ, RU, EN, and TR.
    """
    candidates = [
        (category.name_ru, 'ru'),
        (category.name_uz, 'uz'),
        (category.name_en, 'en'),
        (getattr(category, 'name_tr', None), 'tr'),
    ]
    src_name = ''
    src_l = 'auto'
    for val, default_l in candidates:
        if val and val.strip():
            src_name = val.strip()
            detected = detect_text_language(src_name)
            src_l = detected if detected != 'auto' else default_l
            break

    if src_name:
        cat_tasks = []
        for l in ['uz', 'ru', 'en', 'tr']:
            attr = f'name_{l}'
            curr = (getattr(category, attr, None) or '').strip()
            needs_trans = False
            if not curr:
                needs_trans = True
            elif l != src_l:
                if curr.lower() == src_name.lower():
                    needs_trans = True
                elif re.search(r'[\u0400-\u04FF]', curr) and l in ['en', 'tr', 'uz']:
                    needs_trans = True

            if needs_trans or not is_valid_translation(src_name, l, curr, src_l):
                if l == src_l:
                    setattr(category, attr, src_name)
                else:
                    cat_tasks.append((attr, l, src_name, src_l))

        if cat_tasks:
            from concurrent.futures import ThreadPoolExecutor
            with ThreadPoolExecutor(max_workers=min(4, len(cat_tasks))) as ex:
                def _do_cat_t(item):
                    att, tgt, txt, sl = item
                    return att, tgt, auto_translate_text(txt, target_lang=tgt, src_lang=sl), txt, sl
                for att, tgt, trans, txt, sl in ex.map(_do_cat_t, cat_tasks):
                    if trans and is_valid_translation(txt, tgt, trans, sl):
                        setattr(category, att, trans)

    if save:
        category.save(update_fields=['name_uz', 'name_ru', 'name_en', 'name_tr'])

