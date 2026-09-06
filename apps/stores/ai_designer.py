"""
AI Designer Engine for StoreBox
Generates curated industry-tailored themes, color palettes, card layouts,
high-resolution promotional banners, and full demo product catalogs with photos.
"""
from django.utils.text import slugify

NICHE_PRESETS = {
    'flowers': {
        'id': 'flowers',
        'name_uz': "Gullar va sovg'alar",
        'name_ru': "Цветы и флористика",
        'name_en': "Flowers & Gifts",
        'icon': 'flower-2',
        'emoji': '🌸',
        'primary_color': '#EC4899',
        'bg_color': '#FDF8F9',
        'card_style': 'modern',
        'card_radius': '3xl',
        'image_aspect': 'portrait',
        'button_style': 'solid',
        'banner_images': [
            'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1600&q=80'
        ],
        'titles': {
            'uz': "«{store_name}» — Eng sara gullar va nozik guldastalar",
            'ru': "«{store_name}» — Авторские букеты и живые цветы",
            'en': "«{store_name}» — Fresh Flowers & Elegant Bouquets"
        },
        'subtitles': {
            'uz': "Toshkent bo'ylab 60 daqiqada yetkazib berish. Birinchi buyurtmaga 10% chegirma!",
            'ru': "Быстрая доставка за 60 минут. Скидка 10% на первый заказ!",
            'en': "Express 60-min delivery. Get 10% off your first order!"
        },
        'badge': {
            'uz': "Mavsumiy to'plam",
            'ru': "Новая коллекция",
            'en': "Fresh Collection"
        },
        'categories': [
            {'slug': 'guldastalar', 'name_uz': "Guldastalar", 'name_ru': "Букеты", 'icon': 'flower'},
            {'slug': 'atirgullar', 'name_uz': "Atirgullar", 'name_ru': "Розы", 'icon': 'sparkles'},
            {'slug': 'sovgalar', 'name_uz': "Sovg'alar & Qutilar", 'name_ru': "Подарки и боксы", 'icon': 'gift'},
        ],
        'products': [
            {
                'slug': 'qizil-atirgullar-25',
                'name_uz': "Qizil atirgullar guldastasi (25 dona)",
                'name_ru': "Букет отборных красных роз (25 шт)",
                'price': 350000,
                'old_price': 400000,
                'category_slug': 'atirgullar',
                'image_url': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Yangi uzilgan, xushbo'y hidli 25 ta premium Ekvador atirgullari.",
                'description_ru': "Свежайшие эквадорские розы с крупным бутоном и утонченным ароматом."
            },
            {
                'slug': 'pushti-lolalar-19',
                'name_uz': "Pushti lolalar to'plami (19 dona)",
                'name_ru': "Нежный букет розовых тюльпанов (19 шт)",
                'price': 220000,
                'old_price': 260000,
                'category_slug': 'guldastalar',
                'image_url': 'https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Bahoriy kayfiyat bag'ishlovchi nozik va tarovatli golland lolalari.",
                'description_ru': "Изящные голландские тюльпаны, дарящие весеннюю свежесть и тепло."
            },
            {
                'slug': 'pionlar-premuim',
                'name_uz': "Pionlar va gipsofila kompozitsiyasi",
                'name_ru': "Роскошная композиция с пионами и эвкалиптом",
                'price': 480000,
                'old_price': 550000,
                'category_slug': 'guldastalar',
                'image_url': 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Katta hajmli och pushti pionlar va evkalipt shoxlari bilan dizaynerlik guldastasi.",
                'description_ru': "Премиальный авторский букет из нежно-розовых пионов и веточек эвкалипта."
            },
            {
                'slug': 'oq-orxideya-idishda',
                'name_uz': "Oq orxideya tuvakda",
                'name_ru': "Белая королевская орхидея в керамике",
                'price': 190000,
                'old_price': 220000,
                'category_slug': 'sovgalar',
                'image_url': 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Uzoq vaqt gullab turuvchi xonaki oq orxideya guli.",
                'description_ru': "Цветущая фаленопсис орхидея в элегантном белом кашпо."
            },
            {
                'slug': 'shokoladli-sovga-box',
                'name_uz': "Shokolad va gulli sovg'a qutisi",
                'name_ru': "Подарочный бокс: цветы и шоколад",
                'price': 320000,
                'old_price': 360000,
                'category_slug': 'sovgalar',
                'image_url': 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Kichik gullar, Ferrero Rocher shokoladlari va xushbo'y sham to'plami.",
                'description_ru': "Изысканный подарочный набор со свежими бутонами и шоколадом."
            },
            {
                'slug': 'moviy-gortenziya',
                'name_uz': "Moviy gortenziyalar guldastasi",
                'name_ru': "Букет небесно-голубых гортензий",
                'price': 290000,
                'old_price': 330000,
                'category_slug': 'guldastalar',
                'image_url': 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Ajib moviy tusli yam-yashil shoxchalar bilan o'ralgan gortenziyalar.",
                'description_ru': "Пышные свежие гортензии в дизайнерской матовой упаковке."
            }
        ]
    },
    'restaurant': {
        'id': 'restaurant',
        'name_uz': "Restoran, Kafe va Fast-Food",
        'name_ru': "Ресторан, Кафе и Фастфуд",
        'name_en': "Restaurant & Fast-Food",
        'icon': 'utensils',
        'emoji': '🍽️',
        'primary_color': '#EA580C',
        'bg_color': '#FFFBF7',
        'card_style': 'compact',
        'card_radius': '2xl',
        'image_aspect': 'square',
        'button_style': 'solid',
        'banner_images': [
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&w=1600&q=80'
        ],
        'titles': {
            'uz': "«{store_name}» — Issiq va mazali taomlar",
            'ru': "«{store_name}» — Вкусные и горячие блюда",
            'en': "«{store_name}» — Delicious & Fresh Food"
        },
        'subtitles': {
            'uz': "Sevimli taomlaringizni to'g'ridan-to'g'ri eshigingizgacha tezkor yetkazib beramiz!",
            'ru': "Быстрая доставка любимых блюд прямо к вашему столу!",
            'en': "Fast delivery of your favorite meals straight to your door!"
        },
        'badge': {
            'uz': "Tezkor yetkazish",
            'ru': "Горячие новинки",
            'en': "Hot & Fast"
        },
        'categories': [
            {'slug': 'fast-food', 'name_uz': "Fast-Fud & Pitsa", 'name_ru': "Фастфуд и Пицца", 'icon': 'pizza'},
            {'slug': 'issiq-taomlar', 'name_uz': "Issiq taomlar", 'name_ru': "Горячие блюда", 'icon': 'utensils'},
            {'slug': 'salatlar', 'name_uz': "Salatlar", 'name_ru': "Салаты", 'icon': 'salad'},
            {'slug': 'ichimliklar', 'name_uz': "Ichimliklar & Desertlar", 'name_ru': "Напитки и десерты", 'icon': 'coffee'},
        ],
        'products': [
            {
                'slug': 'burger-classic',
                'name_uz': "Katta Burger Classic (Marmar mol go'shti)",
                'name_ru': "Бургер Классический из мраморной говядины",
                'price': 48000,
                'old_price': 55000,
                'category_slug': 'fast-food',
                'image_url': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
                'description_uz': "100% tabiiy mol go'shti kotleti, erigan cheddar pishlog'i va xushbo'y sous.",
                'description_ru': "Сочная котлета из мраморной говядины, сыр чеддер, хрустящий салат и фирменный соус."
            },
            {
                'slug': 'pitsa-margarita',
                'name_uz': "Pitsa Margarita 32sm (Mozzarella)",
                'name_ru': "Пицца Маргарита с моцареллой 32см",
                'price': 65000,
                'old_price': 75000,
                'category_slug': 'fast-food',
                'image_url': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Klassik italyancha xamir, pomidor sousi, mozzarella va xushbo'y rayhon.",
                'description_ru': "Тонкое хрустящее тесто, томатный соус, сыр моцарелла и свежий базилик."
            },
            {
                'slug': 'steyk-ribay',
                'name_uz': "Steyk Ribay Black Angus",
                'name_ru': "Сочный стейк Рибай Black Angus",
                'price': 125000,
                'old_price': 145000,
                'category_slug': 'issiq-taomlar',
                'image_url': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Olovda pishirilgan yumshoq mol go'shti steyki, sabzavotlar bilan.",
                'description_ru': "Стейк премиум обжарки medium с соусом демиглас и овощами гриль."
            },
            {
                'slug': 'sezar-salati',
                'name_uz': "Sezar salati tovuq go'shti bilan",
                'name_ru': "Салат Цезарь с нежной куриной грудкой",
                'price': 38000,
                'old_price': 44000,
                'category_slug': 'salatlar',
                'image_url': 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Aysberg barglari, qovurilgan tovuq filesi, parmezan pishlog'i va krakerlar.",
                'description_ru': "Хрустящие листья романо, обжаренное филе, томаты черри, пармезан и сухарики."
            },
            {
                'slug': 'pasta-karbonara',
                'name_uz': "Pasta Karbonara (Parmesan)",
                'name_ru': "Паста Карбонара с пармезаном",
                'price': 52000,
                'old_price': 60000,
                'category_slug': 'issiq-taomlar',
                'image_url': 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Krem sousli spagetti, xushxo'r bekon bo'laklari va maydalangan pishloq.",
                'description_ru': "Итальянская паста со сливочным соусом, хрустящим беконом и сыром."
            },
            {
                'slug': 'chizkeyk-nyu-york',
                'name_uz': "Klassik Nyu-York Chizkeyk",
                'name_ru': "Классический чизкейк Нью-Йорк",
                'price': 32000,
                'old_price': 38000,
                'category_slug': 'ichimliklar',
                'image_url': 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Krem-pishloqli nozik desert, mevali sous qo'shimchasi bilan.",
                'description_ru': "Нежнейший сливочный чизкейк на песочной основе с ягодным соусом."
            }
        ]
    },
    'tech': {
        'id': 'tech',
        'name_uz': "Elektronika va maishiy texnika",
        'name_ru': "Электроника и гаджеты",
        'name_en': "Electronics & Gadgets",
        'icon': 'smartphone',
        'emoji': '📱',
        'primary_color': '#2563EB',
        'bg_color': '#F8FAFC',
        'card_style': 'bold',
        'card_radius': '2xl',
        'image_aspect': 'portrait',
        'button_style': 'solid',
        'banner_images': [
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1600&q=80'
        ],
        'titles': {
            'uz': "«{store_name}» — Zamonaviy gadjetlar va texnika",
            'ru': "«{store_name}» — Премиальная электроника и девайсы",
            'en': "«{store_name}» — Cutting-Edge Electronics & Gear"
        },
        'subtitles': {
            'uz': "Rasmiy kafolat bilan barcha yetakchi brendlar gadjetlari. Muddatli to'lov mavjud!",
            'ru': "Официальная гарантия на все топовые бренды. Доступна рассрочка!",
            'en': "Official warranty on top world brands. Best prices guaranteed!"
        },
        'badge': {
            'uz': "Kafolat 1 yil",
            'ru': "Официальная гарантия",
            'en': "1 Year Warranty"
        },
        'categories': [
            {'slug': 'smartfonlar', 'name_uz': "Smartfonlar", 'name_ru': "Смартфоны", 'icon': 'smartphone'},
            {'slug': 'noutbuklar', 'name_uz': "Noutbuklar & Planshetlar", 'name_ru': "Ноутбуки и планшеты", 'icon': 'laptop'},
            {'slug': 'audio-aksessuar', 'name_uz': "Audio & Aksessuarlar", 'name_ru': "Аудио и гаджеты", 'icon': 'headphones'},
        ],
        'products': [
            {
                'slug': 'iphone-15-pro-max',
                'name_uz': "iPhone 15 Pro Max 256GB Natural Titanium",
                'name_ru': "Apple iPhone 15 Pro Max 256GB Titanium",
                'price': 14800000,
                'old_price': 15500000,
                'category_slug': 'smartfonlar',
                'image_url': 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Titan korpus, A17 Pro kuchli protsessori va 48MP professional kamera tizimi.",
                'description_ru': "Флагманский смартфон с титановым корпусом, чипом A17 Pro и экраном ProMotion 120Hz."
            },
            {
                'slug': 'macbook-air-15',
                'name_uz': "Apple MacBook Air 15 M3 Space Gray",
                'name_ru': "Apple MacBook Air 15 M3 Space Gray",
                'price': 16900000,
                'old_price': 17800000,
                'category_slug': 'noutbuklar',
                'image_url': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
                'description_uz': "15.3 dyuymli Liquid Retina ekran, M3 chip va 18 soatgacha batareya quvvati.",
                'description_ru': "Невероятно тонкий и производительный ультрабук для работы и творчества."
            },
            {
                'slug': 'airpods-pro-2',
                'name_uz': "AirPods Pro 2 (USB-C) MagSafe",
                'name_ru': "Наушники Apple AirPods Pro 2 USB-C",
                'price': 2750000,
                'old_price': 3100000,
                'category_slug': 'audio-aksessuar',
                'image_url': 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Faol shovqinni pasaytirish, shaffoflik rejimi va fazoviy ovoz.",
                'description_ru': "Беспроводные наушники с активным шумоподавлением и защитой IP54."
            },
            {
                'slug': 'apple-watch-ultra-2',
                'name_uz': "Apple Watch Ultra 2 GPS + Cellular",
                'name_ru': "Смарт-часы Apple Watch Ultra 2",
                'price': 9200000,
                'old_price': 9900000,
                'category_slug': 'audio-aksessuar',
                'image_url': 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80',
                'description_uz': "49mm titan korpus, 3000 nit yorqinlikdagi displey va uzoq batareya.",
                'description_ru': "Ударопрочные часы для экстремальных нагрузок и точного мониторинга здоровья."
            },
            {
                'slug': 'sony-wh1000xm5',
                'name_uz': "Sony WH-1000XM5 Simsiz quloqchin",
                'name_ru': "Наушники Sony WH-1000XM5 Wireless",
                'price': 4400000,
                'old_price': 4900000,
                'category_slug': 'audio-aksessuar',
                'image_url': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Bozordagi eng yaxshi shovqinni to'sish tizimi va Hi-Res kristal ovoz.",
                'description_ru': "Премиальный чистый звук, 30 часов автономной работы и максимальный комфорт."
            }
        ]
    },
    'fashion': {
        'id': 'fashion',
        'name_uz': "Kiyim, poyabzal va moda",
        'name_ru': "Одежда, обувь и стиль",
        'name_en': "Fashion & Apparel",
        'icon': 'shirt',
        'emoji': '👗',
        'primary_color': '#18181B',
        'bg_color': '#FFFFFF',
        'card_style': 'minimal',
        'card_radius': 'none',
        'image_aspect': 'portrait',
        'button_style': 'outline',
        'banner_images': [
            'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=80'
        ],
        'titles': {
            'uz': "«{store_name}» — Zamonaviy moda va uslub",
            'ru': "«{store_name}» — Премиальная мода и тренды сезона",
            'en': "«{store_name}» — Modern Trends & Premium Fashion"
        },
        'subtitles': {
            'uz': "Eng so'nggi trenddagi kiyimlar va aksessuarlar. O'zingizga mos uslubni toping!",
            'ru': "Стильные образы для любого повода. Найди свой уникальный стиль!",
            'en': "Handcrafted styles for every occasion. Discover your unique look!"
        },
        'badge': {
            'uz': "Yangi to'plam 2026",
            'ru': "New Collection 2026",
            'en': "New Arrival"
        },
        'categories': [
            {'slug': 'ustki-kiyim', 'name_uz': "Ustki kiyimlar", 'name_ru': "Верхняя одежда", 'icon': 'shirt'},
            {'slug': 'poyabzal', 'name_uz': "Poyabzal & Krossovkalar", 'name_ru': "Обувь и кроссовки", 'icon': 'footprints'},
            {'slug': 'sumkalar', 'name_uz': "Sumkalar & Aksessuarlar", 'name_ru': "Сумки и аксессуары", 'icon': 'shopping-bag'},
        ],
        'products': [
            {
                'slug': 'charm-kurtka-biker',
                'name_uz': "Klassik qora charm kurtka",
                'name_ru': "Кожаная куртка оверсайз байкерская",
                'price': 750000,
                'old_price': 890000,
                'category_slug': 'ustki-kiyim',
                'image_url': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Yuqori sifatli eko-charm, qulay bichim va zamonaviy furnitura.",
                'description_ru': "Стильная куртка прямого кроя из мягкой плотной кожи с качественной фурнитурой."
            },
            {
                'slug': 'hoodie-oversize-beige',
                'name_uz': "Premium paxta xudi (Oversize)",
                'name_ru': "Худи базовый оверсайз бежевый",
                'price': 340000,
                'old_price': 390000,
                'category_slug': 'ustki-kiyim',
                'image_url': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
                'description_uz': "100% organik paxtadan tikilgan qalin va yumshoq xudi.",
                'description_ru': "Уютное худи плотностью 380г/м из натурального турецкого хлопка."
            },
            {
                'slug': 'oq-krossovka-minimalist',
                'name_uz': "Oq charmli krossovkalar Minimalist",
                'name_ru': "Белые кожаные кеды Minimalist",
                'price': 520000,
                'old_price': 610000,
                'category_slug': 'poyabzal',
                'image_url': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Tabiiy charmdan tayyorlangan yengil va qulay kundalik poyabzal.",
                'description_ru': "Универсальные кеды с амортизирующей подошвой для долгих прогулок."
            },
            {
                'slug': 'charm-sumka-tote',
                'name_uz': "Katta charm sumka Tote Bag",
                'name_ru': "Кожаная вместительная сумка тоут",
                'price': 590000,
                'old_price': 690000,
                'category_slug': 'sumkalar',
                'image_url': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Noutbuk va kundalik buyumlar uchun keng hajmli zamonaviy sumka.",
                'description_ru': "Лаконичный дизайн, магнитная застежка и отделение для ноутбука 14 дюймов."
            }
        ]
    },
    'grocery': {
        'id': 'grocery',
        'name_uz': "Oziq-ovqat va supermarket",
        'name_ru': "Продукты и супермаркет",
        'name_en': "Groceries & Supermarket",
        'icon': 'shopping-basket',
        'emoji': '🛒',
        'primary_color': '#10B981',
        'bg_color': '#F8FAFC',
        'card_style': 'modern',
        'card_radius': '2xl',
        'image_aspect': 'square',
        'button_style': 'solid',
        'banner_images': [
            'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1600&q=80'
        ],
        'titles': {
            'uz': "«{store_name}» — Sarxil va toza oziq-ovqatlar",
            'ru': "«{store_name}» — Свежие продукты каждый день",
            'en': "«{store_name}» — Fresh Farm Groceries Daily"
        },
        'subtitles': {
            'uz': "Kunlik sarxil mevalar, sabzavotlar va barcha ro'zg'or mahsulotlari arzon narxda!",
            'ru': "Отборные фермерские фрукты, овощи и бакалея по лучшим ценам!",
            'en': "Handpicked fresh produce, pantry essentials delivered within hours!"
        },
        'badge': {
            'uz': "100% Tabiiy",
            'ru': "100% Натурально",
            'en': "100% Organic"
        },
        'categories': [
            {'slug': 'mevalar', 'name_uz': "Mevalar & Sabzavotlar", 'name_ru': "Фрукты и овощи", 'icon': 'apple'},
            {'slug': 'sut-non', 'name_uz': "Sut va Non mahsulotlari", 'name_ru': "Молоко и выпечка", 'icon': 'milk'},
            {'slug': 'bakaleya', 'name_uz': "Bakaleya & Yog'lar", 'name_ru': "Бакалея и масла", 'icon': 'package'},
        ],
        'products': [
            {
                'slug': 'bananlar-ekvador',
                'name_uz': "Yangi terilgan bananlar (1 kg)",
                'name_ru': "Бананы свежие Эквадор (1 кг)",
                'price': 22000,
                'old_price': 26000,
                'category_slug': 'mevalar',
                'image_url': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Shirin va xushbo'y pishgan ekvador bananlari.",
                'description_ru': "Спелые отборные бананы с высоким содержанием калия."
            },
            {
                'slug': 'fermer-suti-32',
                'name_uz': "Tabiiy fermer suti 3.2% (1L)",
                'name_ru': "Молоко фермерское пастеризованное 3.2%",
                'price': 14000,
                'old_price': 16000,
                'category_slug': 'sut-non',
                'image_url': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Toza tabiiy sigir suti, konservantlarsiz.",
                'description_ru': "Натуральное свежее молоко с естественным сливочным вкусом."
            },
            {
                'slug': 'fransuz-bageti',
                'name_uz': "Qarsildoq fransuz bageti",
                'name_ru': "Французский багет хрустящий",
                'price': 8000,
                'old_price': 10000,
                'category_slug': 'sut-non',
                'image_url': 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Har kuni ertalab pishiriladigan qarsildoq barra non.",
                'description_ru': "Свежеиспеченный багет с золотистой хрустящей корочкой."
            },
            {
                'slug': 'zaytun-moyi-extra-virgin',
                'name_uz': "Zaytun moyi Extra Virgin 500ml",
                'name_ru': "Оливковое масло Extra Virgin 500мл",
                'price': 78000,
                'old_price': 89000,
                'category_slug': 'bakaleya',
                'image_url': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Birinchi sovuq siquvdagi toza ispan zaytun moyi.",
                'description_ru': "Испанское масло первого холодного отжима высшей категории."
            }
        ]
    },
    'beauty': {
        'id': 'beauty',
        'name_uz': "Go'zallik va kosmetika",
        'name_ru': "Косметика и парфюмерия",
        'name_en': "Beauty & Cosmetics",
        'icon': 'sparkles',
        'emoji': '💄',
        'primary_color': '#D946EF',
        'bg_color': '#FCF8FD',
        'card_style': 'modern',
        'card_radius': '3xl',
        'image_aspect': 'portrait',
        'button_style': 'solid',
        'banner_images': [
            'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80'
        ],
        'titles': {
            'uz': "«{store_name}» — Go'zallik va parvarish sirlari",
            'ru': "«{store_name}» — Премиум уход и парфюмерия",
            'en': "«{store_name}» — Glow & Pure Beauty Essentials"
        },
        'subtitles': {
            'uz': "Original kosmetika va eksklyuziv parfyumeriya. Har bir xaridda yoqimli sovg'a!",
            'ru': "Оригинальная косметика и селективные ароматы. Подарки к каждому заказу!",
            'en': "Authentic skincare, cosmetics and signature fragrances with fast delivery!"
        },
        'badge': {
            'uz': "Original mahsulot",
            'ru': "100% Оригинал",
            'en': "Original Brand"
        },
        'categories': [
            {'slug': 'yuz-parvarishi', 'name_uz': "Yuz parvarishi", 'name_ru': "Уход за кожей", 'icon': 'sparkles'},
            {'slug': 'makiyaj', 'name_uz': "Makiyaj vositalari", 'name_ru': "Декоративная косметика", 'icon': 'palette'},
            {'slug': 'parfyum', 'name_uz': "Eksklyuziv Parfyum", 'name_ru': "Селективная парфюмерия", 'icon': 'flower'},
        ],
        'products': [
            {
                'slug': 'yuz-kremi-vitaminc',
                'name_uz': "Gidratlovchi yuz kremi Vitamin C",
                'name_ru': "Крем для лица сияющий с витамином C",
                'price': 195000,
                'old_price': 230000,
                'category_slug': 'yuz-parvarishi',
                'image_url': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Terini 24 soat namlantiruvchi va taranglashtiruvchi krem.",
                'description_ru': "Глубокое увлажнение, выравнивание тона и защита от свободных радикалов."
            },
            {
                'slug': 'lab-boyogi-velvet',
                'name_uz': "Matoviy lab bo'yog'i Velvet Red",
                'name_ru': "Помада матовая бархатная Velvet Red",
                'price': 120000,
                'old_price': 145000,
                'category_slug': 'makiyaj',
                'image_url': 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Labni quritmaydigan, 12 soatgacha turuvchi boy qizil rang.",
                'description_ru': "Стойкая помада с невесомой текстурой и насыщенным пигментом."
            },
            {
                'slug': 'parfyum-fleur-de-soir',
                'name_uz': "Fransuz parfyumi Fleur de Soir 50ml",
                'name_ru': "Селективный парфюм Fleur de Soir 50ml",
                'price': 650000,
                'old_price': 780000,
                'category_slug': 'parfyum',
                'image_url': 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Vanil, bergamot va nozik yasmin notalari mujassamlashgan ifor.",
                'description_ru': "Шлейфовый вечерний аромат с нотами жасмина, амбры и теплой ванили."
            }
        ]
    },
    'coffee': {
        'id': 'coffee',
        'name_uz': "Qahvaxona va desertlar",
        'name_ru': "Кофейня и кондитерская",
        'name_en': "Coffee & Bakery",
        'icon': 'coffee',
        'emoji': '☕',
        'primary_color': '#78350F',
        'bg_color': '#FDFBF7',
        'card_style': 'compact',
        'card_radius': '2xl',
        'image_aspect': 'square',
        'button_style': 'solid',
        'banner_images': [
            'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=1600&q=80'
        ],
        'titles': {
            'uz': "«{store_name}» — Xushbo'y qahva va shirinliklar",
            'ru': "«{store_name}» — Ароматный кофе и свежая выпечка",
            'en': "«{store_name}» — Artisan Coffee & Fresh Pastries"
        },
        'subtitles': {
            'uz': "Yangi qovurilgan donlardan tayyorlangan qahva va lazzatli noz-ne'matlar!",
            'ru': "Кофе свежей обжарки и десерты ручной работы. Уют в каждой чашке!",
            'en': "Freshly brewed specialty coffee and handcrafted desserts to brighten your day!"
        },
        'badge': {
            'uz': "Yangi pishirilgan",
            'ru': "Свежая обжарка",
            'en': "Freshly Baked"
        },
        'categories': [
            {'slug': 'qahva-ichimlik', 'name_uz': "Qahva & Choylar", 'name_ru': "Кофе и чай", 'icon': 'coffee'},
            {'slug': 'shirinliklar', 'name_uz': "Desertlar & Tortlar", 'name_ru': "Десерты и торты", 'icon': 'cake'},
            {'slug': 'pishiriqlar', 'name_uz': "Pishiriqlar & Kruassan", 'name_ru': "Выпечка и круассаны", 'icon': 'cookie'},
        ],
        'products': [
            {
                'slug': 'kapuchino-classic',
                'name_uz': "Klassik Kapuchino 300ml (Arabika)",
                'name_ru': "Капучино на миндальном молоке 300мл",
                'price': 26000,
                'old_price': 30000,
                'category_slug': 'qahva-ichimlik',
                'image_url': 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80',
                'description_uz': "100% Arabika donlaridan tayyorlangan qalin sut ko'pikli qahva.",
                'description_ru': "Классический сбалансированный кофе со стойкой кремовой пенкой."
            },
            {
                'slug': 'sariyogli-kruassan',
                'name_uz': "Fransuz sariyog'li kruassani",
                'name_ru': "Круассан сливочный классический",
                'price': 22000,
                'old_price': 26000,
                'category_slug': 'pishiriqlar',
                'image_url': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Qat-qat tillarang xamirdan tayyorlangan an'anaviy kruassan.",
                'description_ru': "Воздушный парижский круассан из натурального сливочного масла 82.5%."
            },
            {
                'slug': 'san-sebastian-cake',
                'name_uz': "San-Sebastian pishloqli keki",
                'name_ru': "Испанский чизкейк Сан-Себастьян",
                'price': 42000,
                'old_price': 48000,
                'category_slug': 'shirinliklar',
                'image_url': 'https://images.unsplash.com/photo-1508737027454-e6454ef45afd?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Karamellashgan po'stloq va qaymoqli mayin ichki qatlam.",
                'description_ru': "Обожженный баскский чизкейк с нежнейшим кремовым центром."
            }
        ]
    }
}


def analyze_custom_niche(query_text, store_name="Do'kon"):
    q = (query_text or '').lower()

    if any(k in q for k in ['gul', 'flower', 'цвет', 'buket', 'flora']):
        return generate_ai_theme(store_name, 'flowers')
    if any(k in q for k in ['ovqat', 'taom', 'food', 'restoran', 'kafe', 'burger', 'pitsa', 'pizza', 'eda', 'еда']):
        return generate_ai_theme(store_name, 'restaurant')
    if any(k in q for k in ['texnika', 'tech', 'gadget', 'telefon', 'phone', 'kompyuter', 'электроника']):
        return generate_ai_theme(store_name, 'tech')
    if any(k in q for k in ['kiyim', 'moda', 'fashion', 'clothes', 'odejda', 'обувь', 'style']):
        return generate_ai_theme(store_name, 'fashion')
    if any(k in q for k in ['oziq', 'market', 'grocery', 'supermarket', 'meva', 'продукты']):
        return generate_ai_theme(store_name, 'grocery')
    if any(k in q for k in ['kosmetika', 'parfum', 'beauty', 'krasota', 'makeup', 'крем']):
        return generate_ai_theme(store_name, 'beauty')
    if any(k in q for k in ['qahva', 'kofe', 'coffee', 'desert', 'tort', 'shirinlik', 'выпечка']):
        return generate_ai_theme(store_name, 'coffee')

    primary_color = '#059669'
    bg_color = '#F8FAFC'
    card_style = 'modern'
    aspect = 'portrait'

    if any(k in q for k in ['avto', 'auto', 'mashina', 'zapchast', 'motor']):
        primary_color = '#DC2626'
        card_style = 'bold'
        aspect = 'landscape'
        banner_img = 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1600&q=80'
        categories = [
            {'slug': 'avtomoylar', 'name_uz': "Moylar va suyuqliklar", 'name_ru': "Масла и жидкости", 'icon': 'droplet'},
            {'slug': 'aksessuarlar', 'name_uz': "Avto aksessuarlar", 'name_ru': "Автоаксессуары", 'icon': 'tool'},
        ]
        products = [
            {
                'slug': 'motor-moyi-5w40',
                'name_uz': "Sintetik motor moyi 5W-40 (4L)",
                'name_ru': "Синтетическое моторное масло 5W-40 4L",
                'price': 380000, 'old_price': 420000,
                'category_slug': 'avtomoylar',
                'image_url': 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Dvigatelni toza saqlovchi va yemirilishdan himoyalovchi moy.",
                'description_ru': "Высокоэффективное моторное масло для современных двигателей."
            },
            {
                'slug': 'videoregistrator-4k',
                'name_uz': "Avto videoregistrator 4K Wi-Fi",
                'name_ru': "Видеорегистратор автомобильный 4K Wi-Fi",
                'price': 690000, 'old_price': 790000,
                'category_slug': 'aksessuarlar',
                'image_url': 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Keng burchakli tungi tasvir va GPS moduliga ega registrator.",
                'description_ru': "Компактный видеорегистратор с ночной съемкой и датчиком удара."
            }
        ]
    elif any(k in q for k in ['kitob', 'book', 'книг']):
        primary_color = '#4338CA'
        card_style = 'modern'
        aspect = 'portrait'
        banner_img = 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1600&q=80'
        categories = [
            {'slug': 'bestseller', 'name_uz': "Bestseller kitoblar", 'name_ru': "Бестселлеры", 'icon': 'book'},
            {'slug': 'biznes', 'name_uz': "Biznes va psixologiya", 'name_ru': "Бизнес и развитие", 'icon': 'trending-up'},
        ]
        products = [
            {
                'slug': 'atom-odatlari',
                'name_uz': "Atom odatlari — Jeyms Klir",
                'name_ru': "Атомные привычки — Джеймс Клир",
                'price': 65000, 'old_price': 75000,
                'category_slug': 'bestseller',
                'image_url': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Kichik o'zgarishlar qanday qilib ulkan natijalarga olib kelishi haqida kitob.",
                'description_ru': "Практическое руководство по созданию полезных привычек."
            }
        ]
    else:
        banner_img = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1600&q=80'
        categories = [
            {'slug': 'asosiy', 'name_uz': "Asosiy to'plam", 'name_ru': "Основная коллекция", 'icon': 'grid'},
            {'slug': 'yangi', 'name_uz': "Yangi mahsulotlar", 'name_ru': "Новинки", 'icon': 'star'},
        ]
        products = [
            {
                'slug': 'premium-tovar-1',
                'name_uz': f"{query_text.strip().capitalize() if query_text else 'Premium'} — Tanlangan mahsulot",
                'name_ru': f"{query_text.strip().capitalize() if query_text else 'Премиум'} — Избранный товар",
                'price': 150000, 'old_price': 180000,
                'category_slug': 'asosiy',
                'image_url': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
                'description_uz': "Yuqori sifatli va ishonchli mahsulot.",
                'description_ru': "Товар высокого качества с гарантией надежности."
            }
        ]

    clean_niche = query_text.strip().capitalize() if query_text else "Maxsus katalog"
    return {
        'niche_id': 'custom',
        'niche_name': clean_niche,
        'primary_color': primary_color,
        'bg_color': bg_color,
        'card_style': card_style,
        'card_radius': '2xl',
        'image_aspect': aspect,
        'button_style': 'solid',
        'banner_image': banner_img,
        'banner_images': [banner_img],
        'title': f"«{store_name}» — {clean_niche}",
        'subtitle': "Eng sara mahsulotlar va qulay narxlar kafolati bilan!",
        'badge': "Eksklyuziv taklif",
        'categories': categories,
        'products': products
    }


def generate_ai_theme(store_name, niche_key, custom_prompt=None, lang='uz'):
    if niche_key == 'custom' or (custom_prompt and niche_key not in NICHE_PRESETS):
        return analyze_custom_niche(custom_prompt or niche_key, store_name)

    preset = NICHE_PRESETS.get(niche_key, NICHE_PRESETS['flowers'])
    
    title_template = preset['titles'].get(lang, preset['titles']['uz'])
    subtitle = preset['subtitles'].get(lang, preset['subtitles']['uz'])
    badge = preset['badge'].get(lang, preset['badge']['uz'])

    formatted_title = title_template.format(store_name=store_name or "StoreBox")

    return {
        'niche_id': preset['id'],
        'niche_name': preset.get(f'name_{lang}', preset['name_uz']),
        'primary_color': preset['primary_color'],
        'bg_color': preset['bg_color'],
        'card_style': preset['card_style'],
        'card_radius': preset['card_radius'],
        'image_aspect': preset['image_aspect'],
        'button_style': preset['button_style'],
        'banner_image': preset['banner_images'][0],
        'banner_images': preset['banner_images'],
        'title': formatted_title,
        'subtitle': subtitle,
        'badge': badge,
        'categories': preset.get('categories', []),
        'products': preset.get('products', [])
    }


def apply_niche_catalog_to_store(store, niche_key, custom_prompt=None, lang='uz', replace_existing=True, preserve_custom_banner=False, preserve_design=False):
    """
    Applies the theme, updates or creates the promotional marketing banner,
    and populates store categories & products with high-resolution photos for the chosen niche.
    """
    from apps.catalog.models import Category, Product
    from apps.orders.models import MarketingBanner

    theme = generate_ai_theme(store.name, niche_key, custom_prompt=custom_prompt, lang=lang)

    # 1. Update store design attributes (skip if preserve_design is True)
    if not preserve_design:
        store.primary_color = theme['primary_color']
        store.theme_bg_color = theme['bg_color']
        store.theme_card_style = theme['card_style']
        store.theme_card_radius = theme['card_radius']
        store.theme_image_aspect = theme['image_aspect']
        store.theme_button_style = theme['button_style']
    store.theme_business_niche = theme['niche_id']
    store.save()

    # 2. Update or create primary Marketing Banner
    primary_banner = MarketingBanner.objects.filter(store=store).first()
    if not primary_banner:
        primary_banner = MarketingBanner(store=store)
    
    # If preserve_custom_banner is set and user has a customized banner/uploaded file, keep it
    if not (preserve_custom_banner and (primary_banner.image or primary_banner.image_url)):
        primary_banner.title = theme['title']
        primary_banner.subtitle = theme['subtitle']
        primary_banner.image = None
        primary_banner.image_url = theme['banner_image']
    
    primary_banner.is_active = True
    primary_banner.save()

    # 3. Clean up previous categories and products so the store doesn't mix different niches
    if replace_existing:
        Category.objects.filter(store=store).update(is_active=False)
        Product.objects.filter(store=store).update(is_active=False)

    # 4. Create Categories for the chosen niche
    category_map = {}
    for cat_data in theme.get('categories', []):
        cat_slug = cat_data.get('slug') or slugify(cat_data['name_uz'])
        cat, _ = Category.objects.update_or_create(
            store=store,
            slug=cat_slug,
            defaults={
                'name_uz': cat_data['name_uz'],
                'name_ru': cat_data.get('name_ru', cat_data['name_uz']),
                'name_en': cat_data.get('name_en', cat_data['name_uz']),
                'icon': cat_data.get('icon', 'tag'),
                'is_active': True
            }
        )
        category_map[cat_slug] = cat

    # 5. Populate Products with High-Resolution Photos
    created_count = 0
    updated_count = 0

    for p_data in theme.get('products', []):
        cat_slug = p_data.get('category_slug')
        category_obj = category_map.get(cat_slug) or (list(category_map.values())[0] if category_map else None)

        prod_slug = p_data.get('slug') or slugify(p_data['name_uz'])
        # Make sure slug is unique per store
        base_slug = prod_slug
        counter = 1
        while Product.objects.filter(store=store, slug=prod_slug).exclude(slug=base_slug if counter == 1 else None).exists():
            prod_slug = f"{base_slug}-{counter}"
            counter += 1

        prod, created = Product.objects.update_or_create(
            store=store,
            slug=prod_slug,
            defaults={
                'name_uz': p_data['name_uz'],
                'name_ru': p_data.get('name_ru', p_data['name_uz']),
                'name_en': p_data.get('name_en', p_data['name_uz']),
                'price': p_data['price'],
                'old_price': p_data.get('old_price'),
                'description_uz': p_data.get('description_uz', ''),
                'description_ru': p_data.get('description_ru', ''),
                'image_url': p_data.get('image_url', ''),
                'category': category_obj,
                'stock': 50,
                'is_active': True,
                'is_featured': True
            }
        )
        if created:
            created_count += 1
        else:
            updated_count += 1

    return {
        'status': 'ok',
        'theme': theme,
        'banner': {
            'title': primary_banner.title,
            'subtitle': primary_banner.subtitle,
            'image_url': primary_banner.image_url
        },
        'categories_count': len(category_map),
        'products_created': created_count,
        'products_updated': updated_count
    }


def get_random_banner_image(niche_key='restaurant', current_url=None):
    """
    Returns a unique, high-resolution promotional banner photo for the given niche,
    ensuring the returned image is distinct from the current one.
    """
    import random
    preset = NICHE_PRESETS.get(niche_key)
    fallback_pool = [
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1600&q=80'
    ]

    images = preset.get('banner_images', fallback_pool) if preset else fallback_pool
    candidates = [img for img in images if img != current_url]
    if candidates:
        return random.choice(candidates)
    return random.choice(images) if images else fallback_pool[0]
