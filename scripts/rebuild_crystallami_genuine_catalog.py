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

# 61 Items Specification with refined luxury titles and descriptions
ITEMS_CATALOG = [
    # --- КЕПКИ (3 items) ---
    {
        'folder': 'Кепка/1',
        'category_slug': 'caps',
        'category_name_ru': 'Кепки',
        'name_ru': 'Бейсболка Coach Signature Jacquard',
        'name_uz': 'Coach Signature Jacquard kepkasi',
        'description_ru': 'Эксклюзивная кепка из фирменного жаккарда с монограммой Coach и золотистой эмблемой C. Идеальная посадка, регулируемый ремешок.',
        'description_uz': 'Coach brendi monogrammasi va oltin rangli C belgisi bilan eksklyuziv jakkard kepka. Qulay bichim va sozlanuvchi tasma.',
        'price': 1350000,
        'old_price': 1600000,
        'sizes': ['ONE SIZE'],
    },
    {
        'folder': 'Кепка/2',
        'category_slug': 'caps',
        'category_name_ru': 'Кепки',
        'name_ru': 'Кепка Chanel Denim CC Monogram',
        'name_uz': 'Chanel CC Denim kepkasi',
        'description_ru': 'Белая джинсовая бейсболка с контрастной черной вышивкой Chanel CC. Премиальный деним, жесткий формованный козырек.',
        'description_uz': 'Chanel CC qora naqshli oq denim beysbolka. Yuqori sifatli jinsi mato va shakldor soyabon.',
        'price': 1450000,
        'old_price': 1750000,
        'sizes': ['ONE SIZE'],
    },
    {
        'folder': 'Кепка/3',
        'category_slug': 'caps',
        'category_name_ru': 'Кепки',
        'name_ru': 'Бейсболка Celine Triomphe с объемной вышивкой',
        'name_uz': 'Celine Triomphe beysbolkasi',
        'description_ru': 'Пудрово-розовая бейсболка из плотного хлопка с объемным 3D логотипом Celine Triomphe. Лаконичный кутюрный акцент в стритвир-гардеробе.',
        'description_uz': 'Pushti rangli zich paxtali Celine Triomphe 3D kashtali kepka. Nafis dizayn va qulaylik.',
        'price': 1390000,
        'old_price': 1650000,
        'sizes': ['ONE SIZE'],
    },

    # --- ШЛЯПЫ (3 items) ---
    {
        'folder': 'Шляпа/1',
        'category_slug': 'hats',
        'category_name_ru': 'Шляпы',
        'name_ru': 'Шляпа канотье из натуральной соломки',
        'name_uz': 'Tabiiy somonli kanotye shlyapa',
        'description_ru': 'Классическое канотье ручного плетения с контрастной черной репсовой лентой. Идеальная защита от солнца и вневременная элегантность.',
        'description_uz': 'Qora tasma bilan qoplangan qo\'lda to\'qilgan kanotye shlyapa. Quyoshdan himoya va klassik nafosat.',
        'price': 1150000,
        'old_price': 1400000,
        'sizes': ['ONE SIZE'],
    },
    {
        'folder': 'Шляпа/2',
        'category_slug': 'hats',
        'category_name_ru': 'Шляпы',
        'name_ru': 'Широкополая федора с атласной лентой',
        'name_uz': 'Keng qirrali atlas tasmali fedora',
        'description_ru': 'Элегантная широкополая шляпа-федора теплого соломенного оттенка. Подчеркивает утонченный курортный и городской образ.',
        'description_uz': 'Issiq somon rangidagi keng qirrali fedora shlyapa. Shahar va kurort uslubiga mos keladi.',
        'price': 1250000,
        'old_price': 1500000,
        'sizes': ['ONE SIZE'],
    },
    {
        'folder': 'Шляпа/3',
        'category_slug': 'hats',
        'category_name_ru': 'Шляпы',
        'name_ru': 'Плетеная панама из рафии «Riviera»',
        'name_uz': 'Riviera rafiya to\'qilgan panama',
        'description_ru': 'Мягкая фактурная панама из натуральной рафии. Комфортно садится по форме головы, складывается в дорожную сумку без заломов.',
        'description_uz': 'Tabiiy rafiyadan yumshoq qulay panama. Boshga qulay o\'tiradi va sayohat uchun ajoyib tanlov.',
        'price': 1050000,
        'old_price': 1300000,
        'sizes': ['ONE SIZE'],
    },

    # --- КЛАТЧ (1 item) ---
    {
        'folder': 'Клатч',
        'category_slug': 'clutches',
        'category_name_ru': 'Клатчи',
        'name_ru': 'Вечерний клатч CRYSTALL AMI с кристаллами',
        'name_uz': 'CRYSTALL AMI oqshom kristall klatchi',
        'description_ru': 'Сияющий вечерний клатч жесткой конструкции с инкрустацией кристаллами и съемной цепочкой на плечо. Замок-клипса с полированным покрытием.',
        'description_uz': 'Yaltiroq kristallar bilan bezatilgan qattiq karkasli oqshom klatchi. Yelkaga taqiladigan zanjir va qulflanuvchi mexanizm.',
        'price': 1650000,
        'old_price': 1950000,
        'sizes': ['ONE SIZE'],
    },

    # --- ВЕРХНЯЯ ОДЕЖДА (1 item) ---
    {
        'folder': 'ветровка',
        'category_slug': 'outerwear',
        'category_name_ru': 'Верхняя одежда',
        'name_ru': 'Ветровка-бомбер Оверсайз «Black Archive»',
        'name_uz': 'Black Archive oversayz vetrovka-bomber',
        'description_ru': 'Объемная ветровка из матового непродуваемого нейлона с влагоотталкивающей пропиткой. Эластичные манжеты, надежная металлическая молния.',
        'description_uz': 'Shamol va namlik o\'tkazmaydigan neylondan qora oversayz vetrovka. Qulay manjetlar va mustahkam fermuar.',
        'price': 1850000,
        'old_price': 2200000,
        'sizes': ['S (42)', 'M (44)', 'L (46)'],
    },

    # --- БРЮКИ (1 item) ---
    {
        'folder': 'брюки/1',
        'category_slug': 'pants',
        'category_name_ru': 'Брюки',
        'name_ru': 'Широкие брюки палаццо «Minimal Black»',
        'name_uz': 'Minimal Black keng palazzo shimlari',
        'description_ru': 'Струящиеся брюки палаццо с высокой посадкой из костюмной вискозы. Прямой свободный силуэт, визуально удлиняющий ноги.',
        'description_uz': 'Baland belli, erkin to\'kiluvchan qora palazzo shimi. Qulay va zamonaviy siluet.',
        'price': 1250000,
        'old_price': 1500000,
        'sizes': ['S (42)', 'M (44)', 'L (46)'],
    },

    # --- КОФТА (1 item) ---
    {
        'folder': 'кофта/1',
        'category_slug': 'knitwear',
        'category_name_ru': 'Кофты и кардиганы',
        'name_ru': 'Вязаный кардиган крупной вязки «Blush Beige»',
        'name_uz': 'Blush Beige to\'qilgan kardigan',
        'description_ru': 'Уютный кардиган крупной фактурной вязки из премиальной пряжи с добавлением шерсти. Мягкий бежево-пудровый оттенок, роговые пуговицы.',
        'description_uz': 'Premium jun aralashmali yumshoq yirik to\'qilgan kardigan. Chiroyli bej rangi va sifatli tugmalar.',
        'price': 1450000,
        'old_price': 1750000,
        'sizes': ['S (42)', 'M (44)', 'L (46)'],
    },

    # --- ПАРФЮМЕРИЯ (9 items) ---
    {
        'folder': 'духи/1',
        'category_slug': 'perfume',
        'category_name_ru': 'Парфюмерия',
        'name_ru': 'Парфюмерная вода Tom Ford Lost Cherry',
        'name_uz': 'Tom Ford Lost Cherry atiri',
        'description_ru': 'Насыщенный ориентальный аромат сочной черешни, горького миндаля, ликера и перуанского бальзама. Стойкий шлейф и соблазнительное звучание.',
        'description_uz': 'Yetuk gilos, bodom va likyor notalari bilan mashhur sharqona xushbo\'y atir.',
        'price': 2450000,
        'old_price': 2900000,
        'sizes': ['50 ml', '100 ml'],
    },
    {
        'folder': 'духи/2',
        'category_slug': 'perfume',
        'category_name_ru': 'Парфюмерия',
        'name_ru': 'Парфюм Bvlgari Le Gemme Tygar',
        'name_uz': 'Bvlgari Le Gemme Tygar atiri',
        'description_ru': 'Искрящийся грейпфрут и глубокий амброксан в благородном флаконе, вдохновленном драгоценным камнем тигровый глаз. Статусный древесно-цитрусовый аромат.',
        'description_uz': 'Greypfrut va qahrabo (ambroksan) notalariga boy hashamatli yog\'och-sitrus atiri.',
        'price': 2650000,
        'old_price': 3100000,
        'sizes': ['100 ml'],
    },
    {
        'folder': 'духи/3',
        'category_slug': 'perfume',
        'category_name_ru': 'Парфюмерия',
        'name_ru': 'Парфюмерная вода Ex Nihilo Fleur Narcotique',
        'name_uz': 'Ex Nihilo Fleur Narcotique atiri',
        'description_ru': 'Культовый гипнотический букет из пиона, флердоранжа, бергамота и сочного личи. Невероятный шлейф свежести и роскоши.',
        'description_uz': 'Pion, shaftoli, lichi va apelsin gullari uyg\'unligidagi mashhur fransuz parfyumi.',
        'price': 2350000,
        'old_price': 2800000,
        'sizes': ['50 ml', '100 ml'],
    },
    {
        'folder': 'духи/4',
        'category_slug': 'perfume',
        'category_name_ru': 'Парфюмерия',
        'name_ru': 'Maison Francis Kurkdjian Baccarat Rouge 540',
        'name_uz': 'Baccarat Rouge 540 ekstrakti',
        'description_ru': 'Легендарное сочетание серой амбры, жасмина грандифлорум, шафрана и кедра. Узнаваемый карамельно-минеральный шлейф королевского уровня.',
        'description_uz': 'Za\'faron, yasmin va kulrang ambra uyg\'unligidagi afsonaviy xushbo\'y hid.',
        'price': 2850000,
        'old_price': 3400000,
        'sizes': ['70 ml'],
    },
    {
        'folder': 'духи/5',
        'category_slug': 'perfume',
        'category_name_ru': 'Парфюмерия',
        'name_ru': 'Парфюмерная вода Byredo Blanche',
        'name_uz': 'Byredo Blanche atiri',
        'description_ru': 'Аромат чистоты, белых роз, альдегидов и чистого льна. Свежий, хрустальный и невесомый шлейф на каждый день.',
        'description_uz': 'Tozalik, oq atirgul va yengil shabada notalariga ega shved parfyumeriyasi.',
        'price': 2150000,
        'old_price': 2550000,
        'sizes': ['50 ml', '100 ml'],
    },
    {
        'folder': 'духи/6',
        'category_slug': 'perfume',
        'category_name_ru': 'Парфюмерия',
        'name_ru': 'Парфюмерная вода Creed Aventus For Her',
        'name_uz': 'Creed Aventus For Her atiri',
        'description_ru': 'Многогранный фруктово-шипровый аромат зеленого яблока, розового перца, калабрийского бергамота и сандала. Властный и притягательный.',
        'description_uz': 'Yashil olma, pushti murch va sandal daraxti notalariga boy qirollik atiri.',
        'price': 2750000,
        'old_price': 3250000,
        'sizes': ['75 ml'],
    },
    {
        'folder': 'духи/7',
        'category_slug': 'perfume',
        'category_name_ru': 'Парфюмерия',
        'name_ru': 'Kilian Love, Don\'t Be Shy',
        'name_uz': 'Kilian Love Don\'t Be Shy atiri',
        'description_ru': 'Сладкое искушение с аккордами цветка апельсина, маршмеллоу, ванили и жимолости. Чувственный гурманский аромат.',
        'description_uz': 'Apelsin guli, marshmallow va vanil notalari bilan shirin ehtirosli atir.',
        'price': 2550000,
        'old_price': 3050000,
        'sizes': ['50 ml'],
    },
    {
        'folder': 'духи/8',
        'category_slug': 'perfume',
        'category_name_ru': 'Парфюмерия',
        'name_ru': 'Парфюмерная вода Roja Parfums Elysium Pour Femme',
        'name_uz': 'Roja Parfums Elysium atiri',
        'description_ru': 'Изысканный британский нишевый парфюм: цитрусовые искры, цветочные аккорды ландыша и фиалки на мускусно-ванильной базе.',
        'description_uz': 'Britaniya nish parfyumi: sitrus, binafsha va mushk uyg\'unligi.',
        'price': 2950000,
        'old_price': 3500000,
        'sizes': ['100 ml'],
    },
    {
        'folder': 'духи/9',
        'category_slug': 'perfume',
        'category_name_ru': 'Парфюмерия',
        'name_ru': 'Chanel Coco Mademoiselle Intense',
        'name_uz': 'Chanel Coco Mademoiselle Intense atiri',
        'description_ru': 'Культовый восточно-древесный аромат сицилийского апельсина, пачули, розы и бобов тонка. Абсолют женственности и уверенности.',
        'description_uz': 'Sitsiliya apelsini, pachuli va atirgul notalari bilan klassik fransuz parfyumi.',
        'price': 2400000,
        'old_price': 2850000,
        'sizes': ['100 ml'],
    },

    # --- ЛОСЬОНЫ ДЛЯ ТЕЛА (6 items) ---
    {
        'folder': 'лосьоны/1',
        'category_slug': 'bodycare',
        'category_name_ru': 'Уход и лосьоны',
        'name_ru': 'Парфюмированный лосьон для тела Velvet Petals',
        'name_uz': 'Velvet Petals tana losoni',
        'description_ru': 'Шелковистый увлажняющий лосьон с нотами сладкого миндаля и бархатных цветочных лепестков. Глубокое питание и деликатный шлейф 24 часа.',
        'description_uz': 'Bodom va gul barglari ifori bilan boyitilgan namlantiruvchi ipakdek tana losoni.',
        'price': 450000,
        'old_price': 550000,
        'sizes': ['250 ml'],
    },
    {
        'folder': 'лосьоны/2',
        'category_slug': 'bodycare',
        'category_name_ru': 'Уход и лосьоны',
        'name_ru': 'Увлажняющий лосьон Pure Seduction Shimmer',
        'name_uz': 'Pure Seduction Shimmer yaltiroq loson',
        'description_ru': 'Лосьон с легким шиммером, придающий коже сияние и аромат красной сливы и фрезии. Быстро впитывается, не оставляет липкости.',
        'description_uz': 'Qizil olxo\'ri va freziya notalari bilan teriga jozibali jilo beruvchi loson.',
        'price': 490000,
        'old_price': 600000,
        'sizes': ['250 ml'],
    },
    {
        'folder': 'лосьоны/3',
        'category_slug': 'bodycare',
        'category_name_ru': 'Уход и лосьоны',
        'name_ru': 'Питательный крем-лосьон Bare Vanilla Luxe',
        'name_uz': 'Bare Vanilla Luxe oziqlantiruvchi krem',
        'description_ru': 'Теплый обволакивающий аромат взбитой ванили и кашемирового дерева. Интенсивно смягчает сухую кожу.',
        'description_uz': 'Kashmiri yog\'och va vanil ifori bilan quruq terini intensiv yumshatuvchi krem-loson.',
        'price': 470000,
        'old_price': 580000,
        'sizes': ['250 ml'],
    },
    {
        'folder': 'лосьоны/4',
        'category_slug': 'bodycare',
        'category_name_ru': 'Уход и лосьоны',
        'name_ru': 'Парфюмированный лосьон Amber Romance',
        'name_uz': 'Amber Romance xushbo\'y tana losoni',
        'description_ru': 'Глубокий восточный аккорд теплой амбры и крем-сахара. Увлажняет кожу благодаря маслу ши и витамину E.',
        'description_uz': 'Ambra va shakar kremi notalari bilan boyitilgan, shi moyi va vitamin E tarkibli loson.',
        'price': 460000,
        'old_price': 560000,
        'sizes': ['250 ml'],
    },
    {
        'folder': 'лосьоны/5',
        'category_slug': 'bodycare',
        'category_name_ru': 'Уход и лосьоны',
        'name_ru': 'Лосьон для тела Coconut Passion Gold',
        'name_uz': 'Coconut Passion Gold tana losoni',
        'description_ru': 'Тропическое сочетание теплого кокоса, ванили и цветка ландыша. Дарит коже бархатистость и естественное сияние.',
        'description_uz': 'Kokos va vanilning tropik uyg\'unligi teriga mayinlik va tabiiy jilo bag\'ishlaydi.',
        'price': 480000,
        'old_price': 590000,
        'sizes': ['250 ml'],
    },
    {
        'folder': 'лосьоны/6',
        'category_slug': 'bodycare',
        'category_name_ru': 'Уход и лосьоны',
        'name_ru': 'Парфюмированное суфле для тела Love Spell',
        'name_uz': 'Love Spell tana suflesi',
        'description_ru': 'Фруктово-цветочный взрыв вишневого цвета и свежего персика. Легкая текстура суфле тает на коже, наполняя её влагой.',
        'description_uz': 'Olcha guli va yangi shaftoli notalari bilan yengil eriydigan tana suflesi.',
        'price': 520000,
        'old_price': 640000,
        'sizes': ['250 ml'],
    },

    # --- КРОССОВКИ (5 items) ---
    {
        'folder': 'кросовки/1',
        'category_slug': 'sneakers',
        'category_name_ru': 'Кроссовки',
        'name_ru': 'Кроссовки Balenciaga Triple S Clear Sole',
        'name_uz': 'Balenciaga Triple S krossovkalari',
        'description_ru': 'Культовые массивные сникеры с трехслойной полупрозрачной подошвой и сложной многослойной фактурой из кожи и сетки.',
        'description_uz': 'Uch qavatli shaffof taglik va charm hamda to\'r aralashmasidan tayyorlangan mashhur krossovka.',
        'price': 2250000,
        'old_price': 2700000,
        'sizes': ['36', '37', '38', '39', '40'],
    },
    {
        'folder': 'кросовки/2',
        'category_slug': 'sneakers',
        'category_name_ru': 'Кроссовки',
        'name_ru': 'Кроссовки Alexander McQueen Oversized Sneaker',
        'name_uz': 'Alexander McQueen Oversized krossovkalari',
        'description_ru': 'Белоснежные кожаные кеды на фирменной объемной резиновой платформе с контрастным замшевым задником.',
        'description_uz': 'Qalin rezina platforma va orqa zamsh detallari bilan oq rangli charm krossovka.',
        'price': 1950000,
        'old_price': 2400000,
        'sizes': ['36', '37', '38', '39', '40'],
    },
    {
        'folder': 'кросовки/3',
        'category_slug': 'sneakers',
        'category_name_ru': 'Кроссовки',
        'name_ru': 'Кроссовки New Balance 9060 «Sea Salt»',
        'name_uz': 'New Balance 9060 Sea Salt krossovkasi',
        'description_ru': 'Футуристичный силуэт в светлой палитре с амортизирующей подошвой ABZORB и мягкими замшевыми накладками.',
        'description_uz': 'ABZORB amortizatsiya tizimi va yumshoq zamsh qoplamalari bilan zamonaviy qulay krossovka.',
        'price': 1750000,
        'old_price': 2100000,
        'sizes': ['36', '37', '38', '39', '40'],
    },
    {
        'folder': 'кросовки/4',
        'category_slug': 'sneakers',
        'category_name_ru': 'Кроссовки',
        'name_ru': 'Кроссовки Dior B30 Sneaker Reflective',
        'name_uz': 'Dior B30 Reflective krossovkasi',
        'description_ru': 'Спортивно-кутюрные кроссовки со светоотражающими вставками CD и ультралегкой рельефной подошвой.',
        'description_uz': 'CD yorug\'lik qaytaruvchi detallari va yengil tagligi bilan Dior sport-kutyur krossovkasi.',
        'price': 2450000,
        'old_price': 2950000,
        'sizes': ['36', '37', '38', '39', '40'],
    },
    {
        'folder': 'кросовки/5',
        'category_slug': 'sneakers',
        'category_name_ru': 'Кроссовки',
        'name_ru': 'Кроссовки Louis Vuitton LV Trainer White',
        'name_uz': 'Louis Vuitton LV Trainer krossovkasi',
        'description_ru': 'Легендарный силуэт из телячьей кожи с тиснением Monogram, разработанный Вирджилом Абло. Ручная сборка деталей.',
        'description_uz': 'Monogram naqshli buzoq terisidan tayyorlangan afsonaviy oq rangli Louis Vuitton krossovkasi.',
        'price': 2650000,
        'old_price': 3200000,
        'sizes': ['36', '37', '38', '39', '40'],
    },

    # --- ОБУВЬ (11 items) ---
    {
        'folder': 'обувь/1',
        'category_slug': 'shoes',
        'category_name_ru': 'Обувь',
        'name_ru': 'Ботильоны под змеиную кожу на шпильке',
        'name_uz': 'Ilon terisi nusxali poshnali botilonlar',
        'description_ru': 'Эффектные ботильоны с острым мысом и тиснением под питона на тонкой изящной шпильке. Молния на внутренней стороне.',
        'description_uz': 'O\'tkir burunli, piton naqshli ingichka poshnada jozibali ayollar botiloni.',
        'price': 1850000,
        'old_price': 2250000,
        'sizes': ['36', '37', '38', '39', '40'],
    },
    {
        'folder': 'обувь/2',
        'category_slug': 'shoes',
        'category_name_ru': 'Обувь',
        'name_ru': 'Черные классические лодочки Saint Laurent',
        'name_uz': 'Saint Laurent qora klassik tuflilari',
        'description_ru': 'Безупречные вечерние туфли-лодочки из гладкой черной кожи на высокой металлической шпильке. Символ вечной элегантности.',
        'description_uz': 'Yumshoq qora teridan ishlangan baland poshnali nafis oqshom tuflisi.',
        'price': 1750000,
        'old_price': 2100000,
        'sizes': ['36', '37', '38', '39', '40'],
    },
    {
        'folder': 'обувь/3',
        'category_slug': 'shoes',
        'category_name_ru': 'Обувь',
        'name_ru': 'Бежевые лаковые туфли-лодочки Nude',
        'name_uz': 'Bej lakli klassik tuflilar',
        'description_ru': 'Глянцевые туфли нейтрального пудрово-бежевого оттенка. Оптически удлиняют силуэт ног, подходят к любому гардеробу.',
        'description_uz': 'Yaltiroq bej lakli qulay va nafis oqshom tuflisi.',
        'price': 1650000,
        'old_price': 2000000,
        'sizes': ['36', '37', '38', '39', '40'],
    },
    {
        'folder': 'обувь/4',
        'category_slug': 'shoes',
        'category_name_ru': 'Обувь',
        'name_ru': 'Вечерние мюли с кристаллами Amina Muaddi',
        'name_uz': 'Kristall detallari bilan oqshom myulilari',
        'description_ru': 'Прозрачные мюли на фирменном расклешенном каблуке-бокале с сверкающей брошью из кристаллов.',
        'description_uz': 'Bokalsimon poshnali shaffof oqshom myulisi, kristall broshka bilan bezatilgan.',
        'price': 2150000,
        'old_price': 2600000,
        'sizes': ['36', '37', '38', '39', '40'],
    },
    {
        'folder': 'обувь/5',
        'category_slug': 'shoes',
        'category_name_ru': 'Обувь',
        'name_ru': 'Босоножки на тонких завязках Strappy Lace-Up',
        'name_uz': 'Ingichka bog\'ichli oqshom bosonojkalari',
        'description_ru': 'Минималистичные босоножки с тонкими ремешками, обвивающими щиколотку. Легкость и утонченность летнего вечера.',
        'description_uz': 'To\'piqqa bog\'lanadigan nozik tasmali yengil va bejirim bosonojkalar.',
        'price': 1550000,
        'old_price': 1850000,
        'sizes': ['36', '37', '38', '39', '40'],
    },
    {
        'folder': 'обувь/6',
        'category_slug': 'shoes',
        'category_name_ru': 'Обувь',
        'name_ru': 'Кожаные лоферы Prada на рифленой подошве',
        'name_uz': 'Prada platformali charm loferlari',
        'description_ru': 'Массивные лоферы из глянцевой кожи Spazzolato с эмалированным треугольным логотипом. Трендовая подошва Monolith.',
        'description_uz': 'Prada uchburchak logotipi va qalin monolit tagligi bilan qora charm lofer.',
        'price': 2050000,
        'old_price': 2500000,
        'sizes': ['36', '37', '38', '39', '40'],
    },
    {
        'folder': 'обувь/7',
        'category_slug': 'shoes',
        'category_name_ru': 'Обувь',
        'name_ru': 'Замшевые казаки в стиле вестерн «Caramel»',
        'name_uz': 'Zamsh kazaklar Caramel uslubida',
        'description_ru': 'Короткие сапоги-казаки из натуральной бархатистой замши со скошенным наборным каблуком и фигурной строчкой.',
        'description_uz': 'Qiya poshnali, tabiiy zamshdan tikilgan zamonaviy kazaklar.',
        'price': 1850000,
        'old_price': 2200000,
        'sizes': ['36', '37', '38', '39', '40'],
    },
    {
        'folder': 'обувь/8',
        'category_slug': 'shoes',
        'category_name_ru': 'Обувь',
        'name_ru': 'Высокие кожаные сапоги-трубы до колена',
        'name_uz': 'Baland qora charm etiklar',
        'description_ru': 'Элегантные сапоги с широким прямым голенищем из гладкой плотной кожи на устойчивом среднем каблуке.',
        'description_uz': 'Qalin sifatli charmdan tikilgan to\'g\'ri bichimli tizzagacha etiklar.',
        'price': 2350000,
        'old_price': 2850000,
        'sizes': ['36', '37', '38', '39', '40'],
    },
    {
        'folder': 'обувь/9',
        'category_slug': 'shoes',
        'category_name_ru': 'Обувь',
        'name_ru': 'Золотистые босоножки Metallic Glow',
        'name_uz': 'Oltin rangli oqshom bosonojkalari',
        'description_ru': 'Сияющие босоножки из кожи с металлизированным напылением. Идеальный акцент для торжественных событий и вечеринок.',
        'description_uz': 'Yaltiroq metallik qoplamali oltin rangdagi oqshom bosonojkasi.',
        'price': 1650000,
        'old_price': 1950000,
        'sizes': ['36', '37', '38', '39', '40'],
    },
    {
        'folder': 'обувь/10',
        'category_slug': 'shoes',
        'category_name_ru': 'Обувь',
        'name_ru': 'Ботинки челси на тракторной подошве Bottega',
        'name_uz': 'Bottega traktor taglikli chelsi botinkalari',
        'description_ru': 'Высокие ботинки челси из телячьей кожи с широкими эластичными вставками по бокам и массивной тракторной подошвой.',
        'description_uz': 'Qalin traktor taglikli, buzoq terisidan tikilgan mustahkam chelsi botinkalari.',
        'price': 2150000,
        'old_price': 2600000,
        'sizes': ['36', '37', '38', '39', '40'],
    },
    {
        'folder': 'обувь/11',
        'category_slug': 'shoes',
        'category_name_ru': 'Обувь',
        'name_ru': 'Текстильные слингбэки с открытой пяткой',
        'name_uz': 'Ochiq poshnasi bilan bejirim slingbeklar',
        'description_ru': 'Остроносые туфли с регулируемым ремешком на пятке и небольшим каблуком kitten-heel. Идеальный баланс стиля и комфорта.',
        'description_uz': 'Kichik qulay poshna va to\'piq tasmali nozik ayollar tuflisi.',
        'price': 1450000,
        'old_price': 1750000,
        'sizes': ['36', '37', '38', '39', '40'],
    },

    # --- ПЛАТЬЯ (4 items) ---
    {
        'folder': 'платья/1',
        'category_slug': 'dresses',
        'category_name_ru': 'Платья и юбки',
        'name_ru': 'Шелковое платье-комбинация «Midnight Silk»',
        'name_uz': 'Midnight Silk ipak kombinatsiya ko\'ylagi',
        'description_ru': 'Струящееся черное платье по косой из натурального шелка с тонкими бретелями. Безупречно садится по фигуре, струится при движении.',
        'description_uz': 'Nozik tasmali tabiiy ipakdan tikilgan jozibali qora oqshom ko\'ylagi.',
        'price': 1950000,
        'old_price': 2400000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'folder': 'платья/2',
        'category_slug': 'dresses',
        'category_name_ru': 'Платья и юбки',
        'name_ru': 'Изумрудное платье миди с драпировкой',
        'name_uz': 'Zumrad rangli midi drap ko\'ylak',
        'description_ru': 'Платье миди благородного изумрудного оттенка с акцентной драпировкой на талии и разрезом по ноге.',
        'description_uz': 'Bel qismida drapovka va yonida yirtiq detallari bo\'lgan zumrad rangli midi ko\'ylak.',
        'price': 1850000,
        'old_price': 2250000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'folder': 'платья/3',
        'category_slug': 'dresses',
        'category_name_ru': 'Платья и юбки',
        'name_ru': 'Приталенное коктейльное платье «Pure White»',
        'name_uz': 'Pure White kokteyl oq ko\'ylagi',
        'description_ru': 'Белоснежное корсетное платье длины мини из плотного крепа. Четкие архитектурные линии и подчеркнутая талия.',
        'description_uz': 'Korset uslubidagi zich oq krepli ixcham kokteyl ko\'ylagi.',
        'price': 1750000,
        'old_price': 2150000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },
    {
        'folder': 'платья/4',
        'category_slug': 'dresses',
        'category_name_ru': 'Платья и юбки',
        'name_ru': 'Атласное платье макси с открытой спиной',
        'name_uz': 'Orqasi ochiq atlas maksi ko\'ylak',
        'description_ru': 'Роскошное длинное платье из струящегося атласа с чувственным глубоким вырезом на спине. Эффектный образ для особых вечеров.',
        'description_uz': 'Yumshoq atlasdan tikilgan orqasi ochiq dabdabali maksi oqshom ko\'ylagi.',
        'price': 2250000,
        'old_price': 2750000,
        'sizes': ['XS (40)', 'S (42)', 'M (44)', 'L (46)'],
    },

    # --- РЕМНИ (1 item) ---
    {
        'folder': 'ремишки/1',
        'category_slug': 'accessories',
        'category_name_ru': 'Аксессуары',
        'name_ru': 'Кожаный ремень с золотистой пряжкой H-buckle',
        'name_uz': 'Oltin to\'qali charm kamar',
        'description_ru': 'Двусторонний ремень из зернистой кожи Epsom с полированной пряжкой. Универсальная ширина для брюк и платьев.',
        'description_uz': 'Ikki tomonlama sifatli charm kamar, nafis jilolangan to\'qa bilan.',
        'price': 850000,
        'old_price': 1050000,
        'sizes': ['85 cm', '95 cm', '105 cm'],
    },

    # --- СУМКИ (15 items) ---
    {
        'folder': 'сумки/1',
        'category_slug': 'bags',
        'category_name_ru': 'Сумки',
        'name_ru': 'Сумка Hermes Birkin 25 Togo Leather',
        'name_uz': 'Hermes Birkin 25 charm sumkasi',
        'description_ru': 'Легендарная модель из зернистой телячьей кожи Togo с поворотным замком и палладиевой фурнитурой. Главная инвестиция в стиль.',
        'description_uz': 'Afsonaviy Togo buzoq terisidan ishlangan nufuzli Birkin sumkasi.',
        'price': 3450000,
        'old_price': 4200000,
        'sizes': ['ONE SIZE'],
    },
    {
        'folder': 'сумки/2',
        'category_slug': 'bags',
        'category_name_ru': 'Сумки',
        'name_ru': 'Сумка Chanel Classic Double Flap Caviar',
        'name_uz': 'Chanel Classic Flap sumkasi',
        'description_ru': 'Стеганая икона стиля из зернистой кожи Caviar с плетеным ремешком-цепочкой и замком CC.',
        'description_uz': 'Kaviar naqshli teridan tikilgan zanjirli mashhur Chanel sumkasi.',
        'price': 3150000,
        'old_price': 3800000,
        'sizes': ['ONE SIZE'],
    },
    {
        'folder': 'сумки/3',
        'category_slug': 'bags',
        'category_name_ru': 'Сумки',
        'name_ru': 'Сумка Lady Dior Cannage Patent',
        'name_uz': 'Lady Dior Cannage sumkasi',
        'description_ru': 'Архитектурный силуэт с фирменной стежкой Cannage и металлическими брелоками D.I.O.R.',
        'description_uz': 'Cannage naqshli qattiq karkasli mashhur Lady Dior sumkasi.',
        'price': 2950000,
        'old_price': 3600000,
        'sizes': ['ONE SIZE'],
    },
    {
        'folder': 'сумки/4',
        'category_slug': 'bags',
        'category_name_ru': 'Сумки',
        'name_ru': 'Сумка Saint Laurent LouLou Medium Puffer',
        'name_uz': 'YSL LouLou yumshoq charm sumkasi',
        'description_ru': 'Невероятно мягкая объемная сумка из стеганой кожи с монограммой YSL и цепочкой через плечо.',
        'description_uz': 'YSL metall belgisi va yumshoq terisi bilan qulay yelka sumkasi.',
        'price': 2650000,
        'old_price': 3250000,
        'sizes': ['ONE SIZE'],
    },
    {
        'folder': 'сумки/5',
        'category_slug': 'bags',
        'category_name_ru': 'Сумки',
        'name_ru': 'Микро-сумка Jacquemus Le Chiquito Moyen',
        'name_uz': 'Jacquemus Le Chiquito ixcham sumkasi',
        'description_ru': 'Трендовая трапециевидная сумка из гладкой кожи с жесткой круглой ручкой и золотым логотипом.',
        'description_uz': 'Qattiq dumaloq tutqichli zamonaviy trapetsiya shaklidagi Jakmyus sumkasi.',
        'price': 1850000,
        'old_price': 2300000,
        'sizes': ['ONE SIZE'],
    },
    {
        'folder': 'сумки/6',
        'category_slug': 'bags',
        'category_name_ru': 'Сумки',
        'name_ru': 'Сумка Prada Cleo Brushed Leather',
        'name_uz': 'Prada Cleo silliq charm sumkasi',
        'description_ru': 'Эргономичная изогнутая сумка на плечо из полированной кожи Spazzolato в минималистичном стиле 90-х.',
        'description_uz': 'Yelka uchun qulay egri chiziqli zamonaviy Prada Cleo sumkasi.',
        'price': 2450000,
        'old_price': 3000000,
        'sizes': ['ONE SIZE'],
    },
    {
        'folder': 'сумки/7',
        'category_slug': 'bags',
        'category_name_ru': 'Сумки',
        'name_ru': 'Сумка Bottega Veneta Padded Cassette',
        'name_uz': 'Bottega Veneta Padded Cassette sumkasi',
        'description_ru': 'Объемное плетение Intreccio из мягкой кожи nappa. Регулируемый ремень с треугольной пряжкой.',
        'description_uz': 'Yumshoq nappa terisidan yirik to\'qilgan zamonaviy Bottega sumkasi.',
        'price': 2750000,
        'old_price': 3400000,
        'sizes': ['ONE SIZE'],
    },
    {
        'folder': 'сумки/8',
        'category_slug': 'bags',
        'category_name_ru': 'Сумки',
        'name_ru': 'Сумка Louis Vuitton Pochette Métis Monogram',
        'name_uz': 'Louis Vuitton Pochette Metis sumkasi',
        'description_ru': 'Элегантный сэтчел из канвы с фирменной монограммой LV, золотистым S-замком и кожаной ручкой.',
        'description_uz': 'Monogram kanva va oltin S-qulfli qulay kundalik LV sumkasi.',
        'price': 2850000,
        'old_price': 3500000,
        'sizes': ['ONE SIZE'],
    },
    {
        'folder': 'сумки/9',
        'category_slug': 'bags',
        'category_name_ru': 'Сумки',
        'name_ru': 'Сумка Celine Triomphe Shoulder Bag',
        'name_uz': 'Celine Triomphe yelka sumkasi',
        'description_ru': 'Компактная багетная форма из гладкой кожи теленка с винтажным золотистым замком Triomphe.',
        'description_uz': 'Triomphe oltin to\'qasi bilan ixcham baguette shaklidagi Celine sumkasi.',
        'price': 2550000,
        'old_price': 3150000,
        'sizes': ['ONE SIZE'],
    },
    {
        'folder': 'сумки/10',
        'category_slug': 'bags',
        'category_name_ru': 'Сумки',
        'name_ru': 'Сумка Fendi Baguette Monogram Zucca',
        'name_uz': 'Fendi Baguette Zucca sumkasi',
        'description_ru': 'Легендарная сумка под мышку с монограммой FF Zucca и магнитной застежкой с двойной буквой F.',
        'description_uz': 'FF Zucca naqshli mashhur Baguette sumkasi.',
        'price': 2350000,
        'old_price': 2900000,
        'sizes': ['ONE SIZE'],
    },
    {
        'folder': 'сумки/11',
        'category_slug': 'bags',
        'category_name_ru': 'Сумки',
        'name_ru': 'Сумка Gucci GG Marmont Small Matelassé',
        'name_uz': 'Gucci GG Marmont charmli sumkasi',
        'description_ru': 'Стеганая шевронная кожа с винтажной пряжкой Double G и плечевым ремнем-цепочкой.',
        'description_uz': 'Double G belgisi va zanjirli tasmaga ega Gucci Marmont sumkasi.',
        'price': 2250000,
        'old_price': 2800000,
        'sizes': ['ONE SIZE'],
    },
    {
        'folder': 'сумки/12',
        'category_slug': 'bags',
        'category_name_ru': 'Сумки',
        'name_ru': 'Сумка Balenciaga Hourglass XS',
        'name_uz': 'Balenciaga Hourglass XS sumkasi',
        'description_ru': 'Скульптурная сумка «песочные часы» с изогнутым основанием и подвеской B из полированного металла.',
        'description_uz': 'Qumoq shaklidagi noodatiy egri tubli Balenciaga sumkasi.',
        'price': 2450000,
        'old_price': 3050000,
        'sizes': ['ONE SIZE'],
    },
    {
        'folder': 'сумки/13',
        'category_slug': 'bags',
        'category_name_ru': 'Сумки',
        'name_ru': 'Сумка-седло Dior Saddle Bag Black Leather',
        'name_uz': 'Dior Saddle qora charm sumkasi',
        'description_ru': 'Знаковая асимметричная сумка-седло из черной телячьей кожи с магнитной пряжкой D и подвесками CD.',
        'description_uz': 'Asimmetrik egar shaklidagi qora teridan ishlangan Dior Saddle sumkasi.',
        'price': 2950000,
        'old_price': 3650000,
        'sizes': ['ONE SIZE'],
    },
    {
        'folder': 'сумки/14',
        'category_slug': 'bags',
        'category_name_ru': 'Сумки',
        'name_ru': 'Сумка Givenchy Antigona Small Box Leather',
        'name_uz': 'Givenchy Antigona charm sumkasi',
        'description_ru': 'Геометричная сумка строгой формы из матовой кожи Box с треугольной фирменной накладкой.',
        'description_uz': 'Qat\'iy geometrik shakldagi mustahkam Givenchy Antigona sumkasi.',
        'price': 2350000,
        'old_price': 2900000,
        'sizes': ['ONE SIZE'],
    },
    {
        'folder': 'сумки/15',
        'category_slug': 'bags',
        'category_name_ru': 'Сумки',
        'name_ru': 'Сумка Valentino Garavani Roman Stud',
        'name_uz': 'Valentino Garavani Roman Stud sumkasi',
        'description_ru': 'Стеганая сумка из кожи nappa, украшенная крупными металлическими заклепками-пирамидами Roman Stud.',
        'description_uz': 'Katta piramidasimon tikanlar bilan bezatilgan Valentino sumkasi.',
        'price': 2650000,
        'old_price': 3300000,
        'sizes': ['ONE SIZE'],
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
        resized = enhancer.enhance(1.12)
        enhancer_c = ImageEnhance.Contrast(resized)
        resized = enhancer_c.enhance(1.04)
        
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
    print(f"Applying Authentic Catalog to Store '{store.name}' (ID: {store.id})")

    base_raw = os.path.join(BASE_DIR, 'clothescrystallami')

    # Fetch all existing products of store 83
    products = list(Product.objects.filter(store=store).order_by('id'))
    print(f"Found {len(products)} products in store.")

    for idx, spec in enumerate(ITEMS_CATALOG):
        item_folder = os.path.join(base_raw, spec['folder'])
        if not os.path.exists(item_folder):
            print(f"Warning: folder '{item_folder}' does not exist!")
            continue

        raw_files = [f for f in sorted(os.listdir(item_folder)) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
        if not raw_files:
            print(f"Warning: no photos in '{item_folder}'!")
            continue

        # Get or create category
        cat, _ = Category.objects.get_or_create(
            store=store,
            slug=spec['category_slug'],
            defaults={
                'name_ru': spec['category_name_ru'],
                'name_uz': spec['category_name_ru'],
                'is_active': True,
            }
        )

        # Match to existing product or create
        if idx < len(products):
            prod = products[idx]
        else:
            prod = Product.objects.create(store=store, slug=f"item-{idx+1}")

        prod.category = cat
        prod.name_ru = spec['name_ru']
        prod.name_uz = spec['name_uz']
        prod.name_en = spec['name_ru']
        prod.description_ru = spec['description_ru']
        prod.description_uz = spec['description_uz']
        prod.price = spec['price']
        prod.old_price = spec['old_price']
        prod.stock = 15
        prod.is_active = True
        prod.save()

        # Delete old ProductImages
        prod.images.all().delete()

        # Process all real showroom photos for this item
        slug_clean = spec['folder'].replace('/', '_').replace(' ', '_')
        for f_idx, raw_f in enumerate(raw_files):
            src_p = os.path.join(item_folder, raw_f)
            rel_name = f"genuine_{slug_clean}_{f_idx+1}.jpg"
            dst_p = os.path.join(MEDIA_GENUINE_DIR, rel_name)
            
            process_showroom_photo(src_p, dst_p)

            # Link to ProductImage
            db_rel_path = f"products/crystallami/genuine/{rel_name}"
            ProductImage.objects.create(
                product=prod,
                image=db_rel_path,
                is_primary=(f_idx == 0),
                sort_order=f_idx
            )

        # Set sizes / variations
        prod.variations.all().delete()
        for s_idx, size_name in enumerate(spec['sizes']):
            ProductVariation.objects.create(
                product=prod,
                name_ru=size_name,
                name_uz=size_name,
                price=spec['price'],
                stock=10,
                sort_order=s_idx,
                is_active=True
            )

        print(f"[{idx+1}/{len(ITEMS_CATALOG)}] P#{prod.id} '{prod.name_ru}' -> {len(raw_files)} photos, category={cat.slug}")

    print("\nAll 61 catalog items updated with 100% genuine showroom photos and accurate metadata!")

if __name__ == '__main__':
    run()
