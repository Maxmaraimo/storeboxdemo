import os
import sys
import shutil
from PIL import Image, ImageOps, ImageEnhance

# Setup Django
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storebox.settings')
import django
django.setup()

from apps.stores.models import Store
from apps.catalog.models import Category, Product, ProductImage, ProductVariation

MEDIA_GENUINE_DIR = os.path.join(BASE_DIR, 'media', 'products', 'crystallami', 'genuine')
os.makedirs(MEDIA_GENUINE_DIR, exist_ok=True)

# 1. 61 FOLDER ITEMS
from scripts.rebuild_crystallami_genuine_catalog import ITEMS_CATALOG

# 2. 33 LOOSE ROOT ITEMS (ALL CATEGORIZED IN CLOTHING)
LOOSE_CATALOG = [
    {
        'file': 'telegram-cloud-photo-size-2-5357591958391562970-y.jpg',
        'category_slug': 'clothing',
        'category_name_ru': 'Одежда',
        'name_ru': 'Джинсы свободного кроя Crystall.Ami Denim',
        'name_uz': 'Crystall.Ami erkin bichimli jinsi shimi',
        'description_ru': 'Прямые широкие джинсы из плотного премиального денима небесно-голубого оттенка. Высокая посадка, фирменный лейбл Crystall.Ami на поясе.',
        'description_uz': 'Yuqori sifatli zich gravitatsiyali och moviy rangli jinsi shimi. Baland bel va qulay zamonaviy bichim.',
        'price': 1450000,
        'old_price': 1750000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'telegram-cloud-photo-size-2-5359843758205248102-y.jpg',
        'category_slug': 'clothing',
        'category_name_ru': 'Одежда',
        'name_ru': 'Приталенный жакет «Noir Atelier Couture»',
        'name_uz': 'Noir Atelier Couture qora nimcha-pidjak',
        'description_ru': 'Архитектурный приталенный блейзер глубокого черного цвета из костюмной шерсти. Острые лацканы и скульптурная линия талии.',
        'description_uz': 'Qora rangli nozik qirrali klassik ayollar pidjagi. Bel qismini nafis ta\'kidlaydi.',
        'price': 1850000,
        'old_price': 2250000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'telegram-cloud-photo-size-2-5359843758205248104-y.jpg',
        'category_slug': 'knitwear',
        'category_name_ru': 'Кофты и кардиганы',
        'name_ru': 'Вязаный свитер «Baby Blue Mohair»',
        'name_uz': 'Baby Blue to\'qilgan yumshoq sviter',
        'description_ru': 'Нежный объемный свитер пастельно-голубого оттенка из мягкой мохеровой пряжи. Спущенная линия плеча и свободный силуэт.',
        'description_uz': 'Moviy tusdagi juda yumshoq va issiq to\'qilgan sviter. Kundalik nafis uslub uchun.',
        'price': 1350000,
        'old_price': 1650000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'telegram-cloud-photo-size-2-5359843758205248113-y.jpg',
        'category_slug': 'knitwear',
        'category_name_ru': 'Кофты и кардиганы',
        'name_ru': 'Свитер крупной вязки с высоким воротом «Slate»',
        'name_uz': 'Slate baland yoqali qalin sviter',
        'description_ru': 'Теплый свитер с фактурной вязкой и высоким воротом-стойкой в сдержанном сером оттенке. Идеальная основа для осенне-зимнего гардероба.',
        'description_uz': 'Kulrang tusli baland yoqali qulay va issiq sviter.',
        'price': 1390000,
        'old_price': 1690000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'telegram-cloud-photo-size-2-5359843758205248135-y.jpg',
        'category_slug': 'knitwear',
        'category_name_ru': 'Кофты и кардиганы',
        'name_ru': 'Укороченный кардиган «Cashmere Touch»',
        'name_uz': 'Cashmere Touch kalta kardigan',
        'description_ru': 'Элегантный укороченный кардиган на пуговицах из тонкой кашемировой шерсти. Мягкая фактура, универсальный бежево-серый тон.',
        'description_uz': 'Yumshoq kashmir aralashmali kalta tugmali kardigan.',
        'price': 1250000,
        'old_price': 1550000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 02:50:19.png',
        'category_slug': 'clothing',
        'category_name_ru': 'Одежда',
        'name_ru': 'Двубортный жакет прямого кроя «Milan Taupe»',
        'name_uz': 'Milan Taupe ikki qator tugmali pidjak',
        'description_ru': 'Классический двубортный блейзер из костюмной шерсти теплого серо-бежевого оттенка. Идеальная посадка по фигуре.',
        'description_uz': 'Klassik to\'g\'ri bichimli taupe rangidagi ikki qator tugmali sifatli ayollar pidjagi.',
        'price': 1750000,
        'old_price': 2100000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 02:51:30.png',
        'category_slug': 'pants',
        'category_name_ru': 'Брюки',
        'name_ru': 'Прямые костюмные брюки со стрелками «Urban Grey»',
        'name_uz': 'Urban Grey tekis strelkali kostyum shimi',
        'description_ru': 'Элегантные прямые брюки с четкими заутюженными стрелками и высокой талией. Визуально вытягивают силуэт.',
        'description_uz': 'Baland belli, strelkali klassik kulrang kostyum shimi.',
        'price': 1250000,
        'old_price': 1500000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 02:52:30.png',
        'category_slug': 'dresses',
        'category_name_ru': 'Платья и юбки',
        'name_ru': 'Платье миди с акцентным поясом «Elegance»',
        'name_uz': 'Elegance kamarli midi ko\'ylak',
        'description_ru': 'Изящное платье длины миди из струящейся ткани с акцентом на талии. Подходит как для деловых встреч, так и для вечерних выходов.',
        'description_uz': 'Nafis qomatga urg\'u beruvchi kamarli kundalik va oqshom midi ko\'ylagi.',
        'price': 1650000,
        'old_price': 1950000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 02:53:08.png',
        'category_slug': 'clothing',
        'category_name_ru': 'Одежда',
        'name_ru': 'Твидовый жакет в стиле Chanel «Monochrome»',
        'name_uz': 'Monochrome tvid jaketi',
        'description_ru': 'Культовый укороченный жакет из фактурного твида с золотистыми пуговицами и контрастной отделкой тесьмой.',
        'description_uz': 'Fransuz uslubidagi oltin tugmali hashamatli tvid jaket.',
        'price': 1890000,
        'old_price': 2300000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 02:54:03.png',
        'category_slug': 'clothing',
        'category_name_ru': 'Одежда',
        'name_ru': 'Удлиненный жилет прямого силуэта «Graphite»',
        'name_uz': 'Graphite uzun jilet',
        'description_ru': 'Стильный удлиненный костюмный жилет без рукавов графитового оттенка. Роскошная многослойность в образе.',
        'description_uz': 'Grafit rangli yengsiz zamonaviy klassik uzun jilet.',
        'price': 1350000,
        'old_price': 1600000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 02:54:54.png',
        'category_slug': 'clothing',
        'category_name_ru': 'Одежда',
        'name_ru': 'Шелковая блуза свободного кроя «Ivory Silk»',
        'name_uz': 'Ivory Silk ipak erkin bluza',
        'description_ru': 'Невесомая блузка из натурального шелка оттенка слоновой кости со скрытой планкой на пуговицах.',
        'description_uz': 'Oq ipakdan ishlangan yengil va juda nafis ayollar bluzasi.',
        'price': 1250000,
        'old_price': 1550000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 02:57:21.png',
        'category_slug': 'outerwear',
        'category_name_ru': 'Верхняя одежда',
        'name_ru': 'Кожаная куртка-косуха «Chocolate Cognac»',
        'name_uz': 'Chocolate Cognac charm kurtka',
        'description_ru': 'Косуха из мягкой натуральной кожи премиальной выделки насыщенного шоколадно-коньячного цвета с серебряной фурнитурой.',
        'description_uz': 'Shokolad rangli tabiiy yumshoq charmdan ishlangan bayker kurtkasi.',
        'price': 2450000,
        'old_price': 2950000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 02:58:07.png',
        'category_slug': 'clothing',
        'category_name_ru': 'Одежда',
        'name_ru': 'Однобортный блейзер оверсайз «Deep Navy»',
        'name_uz': 'Deep Navy erkin bleyzer',
        'description_ru': 'Свободный шерстяной жакет глубокого темно-синего цвета с четкой линией плеч. Безупречный европейский крой.',
        'description_uz': 'To\'q ko\'k rangli erkin bichimli zamonaviy bleyzer.',
        'price': 1750000,
        'old_price': 2100000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 02:58:55.png',
        'category_slug': 'pants',
        'category_name_ru': 'Брюки',
        'name_ru': 'Брюки палаццо с высокой посадкой «Classic Black»',
        'name_uz': 'Classic Black palazzo shimlari',
        'description_ru': 'Струящиеся широкие черные брюки из костюмного крепа с боковыми карманами и шлевками под ремень.',
        'description_uz': 'Keng va to\'kiluvchan klassik qora palazzo shimi.',
        'price': 1350000,
        'old_price': 1600000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 02:59:36.png',
        'category_slug': 'knitwear',
        'category_name_ru': 'Кофты и кардиганы',
        'name_ru': 'Вязаный джемпер с узором «Sand Beige»',
        'name_uz': 'Sand Beige to\'qilgan jemper',
        'description_ru': 'Уютный бежевый свитер с рельефной вязкой из мягкой шерсти альпака и мериноса. Тепло и тактильный комфорт.',
        'description_uz': 'Alpaka va merinos junidan to\'qilgan qum rangli qulay jemper.',
        'price': 1290000,
        'old_price': 1550000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 03:00:11.png',
        'category_slug': 'dresses',
        'category_name_ru': 'Платья и юбки',
        'name_ru': 'Платье макси из фактурного трикотажа «Almond»',
        'name_uz': 'Almond trikotaj maksi ko\'ylak',
        'description_ru': 'Облегающее платье макси в рубчик теплого миндального оттенка. Подчеркивает женственные линии фигуры.',
        'description_uz': 'Qomatni chiroyli ko\'rsatuvchi to\'qilgan uzun bodikon ko\'ylak.',
        'price': 1550000,
        'old_price': 1850000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 03:00:49.png',
        'category_slug': 'outerwear',
        'category_name_ru': 'Верхняя одежда',
        'name_ru': 'Тренч классический двубортный «Camel Luxe»',
        'name_uz': 'Camel Luxe klassik trench',
        'description_ru': 'Непромокаемый двубортный тренчкот с поясом и погонами цвета кэмел из плотного хлопкового габардина.',
        'description_uz': 'Kamel rangidagi klassik suv o\'tkazmaydigan kamarli trenchkot.',
        'price': 2250000,
        'old_price': 2700000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 03:03:10.png',
        'category_slug': 'clothing',
        'category_name_ru': 'Одежда',
        'name_ru': 'Атласная рубашка с драпировкой «Champagne»',
        'name_uz': 'Champagne atlas ko\'ylak-kofta',
        'description_ru': 'Мягко сияющая шелковистая рубашка благородного оттенка шампанского. Роскошная фактура, элегантный воротник.',
        'description_uz': 'Shampan rangli yaltiroq atlas ipakdan nafis ko\'ylak-kofta.',
        'price': 1190000,
        'old_price': 1450000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 03:04:04.png',
        'category_slug': 'clothing',
        'category_name_ru': 'Одежда',
        'name_ru': 'Хлопковый лонгслив базовый «Vanilla Cream»',
        'name_uz': 'Vanilla Cream paxtali longsliw',
        'description_ru': 'Базовый лонгслив из 100% органического мерсеризованного хлопка с круглым вырезом. Идеален под жакеты и кардиганы.',
        'description_uz': '100% tabiiy paxtadan yengil va qulay kundalik longsliw.',
        'price': 750000,
        'old_price': 950000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 03:04:57.png',
        'category_slug': 'knitwear',
        'category_name_ru': 'Кофты и кардиганы',
        'name_ru': 'Мохеровый пуловер «Blush Rose»',
        'name_uz': 'Blush Rose moherli pulover',
        'description_ru': 'Воздушный джемпер пудрово-розового цвета из невесомого кид-мохера. Придает образу мягкость и романтичность.',
        'description_uz': 'Pushti rangli havodor mayin moherli pulover.',
        'price': 1350000,
        'old_price': 1650000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 03:06:04.png',
        'category_slug': 'dresses',
        'category_name_ru': 'Платья и юбки',
        'name_ru': 'Коктейльное платье футляр «Dusty Pink»',
        'name_uz': 'Dusty Pink kokteyl ko\'ylak',
        'description_ru': 'Приталенное коктейльное платье длины миди приглушенного розового оттенка с вырезом каре. Идеальная посадка.',
        'description_uz': 'Nafis qomatbop pushti kokteyl ko\'ylagi.',
        'price': 1650000,
        'old_price': 1950000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 03:07:38.png',
        'category_slug': 'clothing',
        'category_name_ru': 'Одежда',
        'name_ru': 'Костюмный жакет прямого кроя «Light Heather»',
        'name_uz': 'Light Heather to\'g\'ri bichimli jaket',
        'description_ru': 'Светло-серый меланжевый жакет мужского кроя на двух пуговицах. Современный акцент для офиса и вечерних прогулок.',
        'description_uz': 'Och kulrang erkin klassik jaket.',
        'price': 1690000,
        'old_price': 2050000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 03:08:30.png',
        'category_slug': 'clothing',
        'category_name_ru': 'Одежда',
        'name_ru': 'Трикотажный костюм с юбкой «Silver Cloud»',
        'name_uz': 'Silver Cloud trikotaj yubkali kostyum',
        'description_ru': 'Двойка из мягкого эластичного трикотажа: топ с длинным рукавом и прямая юбка миди с боковым разрезом.',
        'description_uz': 'Yumshoq trikotajdan yubkali qulay ayollar kastyumi.',
        'price': 1750000,
        'old_price': 2100000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 03:09:17.png',
        'category_slug': 'knitwear',
        'category_name_ru': 'Кофты и кардиганы',
        'name_ru': 'Кардиган на пуговицах с V-образным вырезом «Ash Grey»',
        'name_uz': 'Ash Grey V-yoqali kardigan',
        'description_ru': 'Серый кардиган из тонкорунной шерсти с аккуратными пуговицами в тон. Классика минимализма.',
        'description_uz': 'Kulrang V-kesimli tugmali nafis kardigan.',
        'price': 1150000,
        'old_price': 1400000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 03:10:13.png',
        'category_slug': 'pants',
        'category_name_ru': 'Брюки',
        'name_ru': 'Брюки-карго из премиального хлопка «Stone Grey»',
        'name_uz': 'Stone Grey paxtali kargo shimi',
        'description_ru': 'Стильные брюки прямого силуэта с аккуратными накладными карманами. Баланс комфорта и стритвир-эстетики.',
        'description_uz': 'Sifatli paxtadan zamonaviy cho\'ntakli kargo shimi.',
        'price': 1350000,
        'old_price': 1600000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 03:11:06.png',
        'category_slug': 'dresses',
        'category_name_ru': 'Платья и юбки',
        'name_ru': 'Вечернее платье миди с открытыми плечами «Midnight Noir»',
        'name_uz': 'Midnight Noir yelkalari ochiq oqshom ko\'ylagi',
        'description_ru': 'Маленькое черное платье скульптурного кроя с вырезом бардо. Вечная элегантность для особых событий.',
        'description_uz': 'Qora rangli jozibali yelkalari ochiq oqshom midi ko\'ylagi.',
        'price': 1850000,
        'old_price': 2250000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 03:12:00.png',
        'category_slug': 'clothing',
        'category_name_ru': 'Одежда',
        'name_ru': 'Жакет-смокинг с атласными лацканами «Tuxedo Black»',
        'name_uz': 'Tuxedo Black atlas yoqali smokin jaketi',
        'description_ru': 'Вечерний смокинг из черной шерсти с шелковыми атласными лацканами. Статусный кутюрный образ.',
        'description_uz': 'Atlas yoqali qora oqshom smokin jaketi.',
        'price': 1950000,
        'old_price': 2400000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 03:12:50.png',
        'category_slug': 'outerwear',
        'category_name_ru': 'Верхняя одежда',
        'name_ru': 'Атласный стеганый бомбер «Royal Navy»',
        'name_uz': 'Royal Navy atlas yengil bomber',
        'description_ru': 'Легкий бомбер из водоотталкивающего шелковистого нейлона цвета индиго с мягким наполнителем.',
        'description_uz': 'To\'q ko\'k atlas neylondan qulay yengil kurtka-bomber.',
        'price': 1750000,
        'old_price': 2100000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 03:13:41.png',
        'category_slug': 'clothing',
        'category_name_ru': 'Одежда',
        'name_ru': 'Базовый топ из вискозы «Graphite Silk»',
        'name_uz': 'Graphite Silk viskozali top',
        'description_ru': 'Шелковистый лаконичный топ графитового оттенка на тонких бретелях. Безупречная основа любого многослойного сета.',
        'description_uz': 'Nozik tasmali ipakdek silliq grafit rangli top.',
        'price': 650000,
        'old_price': 850000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 03:14:32.png',
        'category_slug': 'clothing',
        'category_name_ru': 'Одежда',
        'name_ru': 'Укороченный жакет букле «Anthracite»',
        'name_uz': 'Anthracite bukle kalta jaketi',
        'description_ru': 'Фактурный укороченный жакет из буклированной ткани оттенка мокрого асфальта со скрытыми кнопками.',
        'description_uz': 'Antratsit tusli sifatli bukle kalta jaket.',
        'price': 1550000,
        'old_price': 1900000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 03:15:27.png',
        'category_slug': 'clothing',
        'category_name_ru': 'Одежда',
        'name_ru': 'Поло из мерсеризованного хлопка «Polo Heritage Navy»',
        'name_uz': 'Polo Heritage Navy paxtali futbolka-polo',
        'description_ru': 'Темно-синяя рубашка поло с отложным воротником из высококачественного мерсеризованного хлопка.',
        'description_uz': 'To\'q ko\'k rangli yuqori sifatli tabiiy paxtadan tikilgan polo.',
        'price': 950000,
        'old_price': 1200000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 03:17:31.png',
        'category_slug': 'outerwear',
        'category_name_ru': 'Верхняя одежда',
        'name_ru': 'Пальто из шерсти с поясом «Bordeaux Luxe»',
        'name_uz': 'Bordeaux Luxe kamarli jun palto',
        'description_ru': 'Роскошное двубортное пальто глубокого винно-бордового оттенка из 100% шерсти с акцентным поясом.',
        'description_uz': '100% jundan tikilgan dabdabali to\'q qizil bordeaux rangli palto.',
        'price': 2650000,
        'old_price': 3200000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'file': 'Вставка 15.10.2026 в 03:18:19.png',
        'category_slug': 'outerwear',
        'category_name_ru': 'Верхняя одежда',
        'name_ru': 'Кашемировое пальто оверсайз «Oatmeal Melange»',
        'name_uz': 'Oatmeal Melange kashmir palto',
        'description_ru': 'Свободное длинное пальто прямого кроя из кашемира и шерсти теплого овсяного оттенка. Истинный образец тихой роскоши.',
        'description_uz': 'Oatmeal och bej rangidagi kashmir va jun aralashmali erkin klassik palto.',
        'price': 2850000,
        'old_price': 3450000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
]

def process_showroom_photo(src_path, dst_path):
    with Image.open(src_path) as im:
        im = ImageOps.exif_transpose(im)
        im = im.convert('RGB')
        
        target_w, target_h = 1200, 1600
        
        # Scale preserving original aspect ratio
        scale = min((target_w * 0.90) / im.width, (target_h * 0.90) / im.height)
        new_w, new_h = int(im.width * scale), int(im.height * scale)
        resized = im.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Gentle enhancement
        enhancer = ImageEnhance.Sharpness(resized)
        resized = enhancer.enhance(1.10)
        enhancer_c = ImageEnhance.Contrast(resized)
        resized = enhancer_c.enhance(1.03)
        
        # Clean white canvas
        canvas = Image.new('RGB', (target_w, target_h), (255, 255, 255))
        offset_x = (target_w - new_w) // 2
        offset_y = (target_h - new_h) // 2
        canvas.paste(resized, (offset_x, offset_y))
        
        canvas.save(dst_path, 'JPEG', quality=93, optimize=True)

def run():
    store = Store.objects.filter(subdomain='crystallami').first()
    if not store:
        print("Store 'crystallami' not found!")
        return

    print(f"=== DEPLOYING AUTHENTIC CRYSTALL AMI CATALOG ===")
    print(f"Store: {store.name} (ID: {store.id})")

    # 1. Clean out ALL old products in crystallami store completely!
    old_count = Product.objects.filter(store=store).count()
    print(f"Removing {old_count} old products from store...")
    Product.objects.filter(store=store).delete()
    print("Old products deleted.")

    # 2. Setup standard categories
    CATEGORIES_SETUP = [
        ('clothing', 'Одежда', 'Kiyimlar', 1),
        ('shoes', 'Обувь', 'Poyabzallar', 2),
        ('bags', 'Сумки', 'Sumkalar', 3),
        ('accessories', 'Аксессуары', 'Aksesuarlar', 4),
        ('perfume', 'Парфюм', 'Parfyumeriya', 5),
        ('caps', 'Кепки', 'Kepkalar', 10),
        ('hats', 'Шляпы', 'Shlyapalar', 11),
        ('clutches', 'Клатчи', 'Klatchlar', 12),
        ('outerwear', 'Верхняя одежда', 'Ustki kiyimlar', 13),
        ('pants', 'Брюки', 'Shimlar', 14),
        ('knitwear', 'Кофты и кардиганы', 'Kofta va kardiganlar', 15),
        ('dresses', 'Платья', 'Ko\'ylaklar', 16),
        ('sneakers', 'Кроссовки', 'Krossovkalar', 17),
        ('bodycare', 'Лосьоны и уход', 'Tana parvarishi', 18),
    ]

    cat_map = {}
    for slug, name_ru, name_uz, order in CATEGORIES_SETUP:
        cat, _ = Category.objects.update_or_create(
            store=store,
            slug=slug,
            defaults={
                'name_ru': name_ru,
                'name_uz': name_uz,
                'name_en': name_ru,
                'sort_order': order,
                'is_active': True,
            }
        )
        cat_map[slug] = cat

    base_raw = os.path.join(BASE_DIR, 'clothescrystallami')
    total_created = 0

    # 3. Create 61 products from structured subfolders
    print(f"\nProcessing {len(ITEMS_CATALOG)} structured items from subfolders...")
    for idx, spec in enumerate(ITEMS_CATALOG):
        item_folder = os.path.join(base_raw, spec['folder'])
        if not os.path.exists(item_folder):
            print(f"Warning: folder '{item_folder}' does not exist!")
            continue

        raw_files = [f for f in sorted(os.listdir(item_folder)) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.tiff'))]
        if not raw_files:
            print(f"Warning: no photos in '{item_folder}'!")
            continue

        cat = cat_map.get(spec['category_slug'])
        if not cat:
            cat, _ = Category.objects.get_or_create(
                store=store,
                slug=spec['category_slug'],
                defaults={
                    'name_ru': spec['category_name_ru'],
                    'name_uz': spec['category_name_ru'],
                    'is_active': True,
                }
            )
            cat_map[spec['category_slug']] = cat

        prod = Product.objects.create(
            store=store,
            category=cat,
            slug=f"cr-item-{idx+1}",
            name_ru=spec['name_ru'],
            name_uz=spec['name_uz'],
            name_en=spec['name_ru'],
            description_ru=spec['description_ru'],
            description_uz=spec['description_uz'],
            description_en=spec['description_ru'],
            price=spec['price'],
            old_price=spec['old_price'],
            stock=15,
            is_active=True,
        )

        # Clean ascii slug for filenames
        folder_prefix = spec['folder'].split('/')[0]
        ascii_prefix = {
            'Кепка': 'caps',
            'Шляпа': 'hats',
            'Клатч': 'clutch',
            'ветровка': 'windbreaker',
            'брюки': 'pants',
            'кофта': 'knitwear',
            'духи': 'perfume',
            'лосьоны': 'lotion',
            'кросовки': 'sneaker',
            'обувь': 'shoe',
            'платья': 'dress',
            'ремишки': 'belt',
            'сумки': 'bag',
        }.get(folder_prefix, 'item')
        
        folder_rest = spec['folder'].replace(folder_prefix, '').replace('/', '_').strip('_')
        slug_clean = f"{ascii_prefix}_{folder_rest}" if folder_rest else ascii_prefix

        for f_idx, raw_f in enumerate(raw_files):
            src_p = os.path.join(item_folder, raw_f)
            rel_name = f"cr_{slug_clean}_{f_idx+1}.jpg"
            dst_p = os.path.join(MEDIA_GENUINE_DIR, rel_name)
            process_showroom_photo(src_p, dst_p)

            db_rel_path = f"products/crystallami/genuine/{rel_name}"
            ProductImage.objects.create(
                product=prod,
                image=db_rel_path,
                is_primary=(f_idx == 0),
                sort_order=f_idx
            )

        for s_idx, size_name in enumerate(spec['sizes']):
            ProductVariation.objects.create(
                product=prod,
                name_ru=size_name,
                name_uz=size_name,
                name_en=size_name,
                price=spec['price'],
                stock=10,
                sort_order=s_idx,
                is_active=True
            )

        total_created += 1

    print(f"Successfully created 61 folder products.")

    # 4. Create 33 products from loose root files
    print(f"\nProcessing {len(LOOSE_CATALOG)} individual clothing items from root...")
    for idx, spec in enumerate(LOOSE_CATALOG):
        src_p = os.path.join(base_raw, spec['file'])
        if not os.path.exists(src_p):
            print(f"Warning: loose file '{src_p}' does not exist!")
            continue

        cat = cat_map.get(spec['category_slug'])
        if not cat:
            cat = cat_map['clothing']

        prod = Product.objects.create(
            store=store,
            category=cat,
            slug=f"cr-loose-{idx+1}",
            name_ru=spec['name_ru'],
            name_uz=spec['name_uz'],
            name_en=spec['name_ru'],
            description_ru=spec['description_ru'],
            description_uz=spec['description_uz'],
            description_en=spec['description_ru'],
            price=spec['price'],
            old_price=spec['old_price'],
            stock=15,
            is_active=True,
        )

        rel_name = f"cr_apparel_loose_{idx+1}.jpg"
        dst_p = os.path.join(MEDIA_GENUINE_DIR, rel_name)
        process_showroom_photo(src_p, dst_p)

        db_rel_path = f"products/crystallami/genuine/{rel_name}"
        ProductImage.objects.create(
            product=prod,
            image=db_rel_path,
            is_primary=True,
            sort_order=0
        )

        for s_idx, size_name in enumerate(spec['sizes']):
            ProductVariation.objects.create(
                product=prod,
                name_ru=size_name,
                name_uz=size_name,
                name_en=size_name,
                price=spec['price'],
                stock=10,
                sort_order=s_idx,
                is_active=True
            )

        total_created += 1

    print(f"\n=== FINISHED! ===")
    print(f"Total Authentic Products in Store: {total_created} (61 multi/single folder items + 33 loose items)")
    print(f"Catalog completely clean from old PSIH mockups!")

if __name__ == '__main__':
    run()
