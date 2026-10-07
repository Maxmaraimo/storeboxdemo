import os
import sys
import django

sys.path.insert(0, '/Users/ozodbekmahmarayimov/Desktop/cd/storeboxdemo')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storebox.settings')
django.setup()

from apps.stores.models import Store
from apps.catalog.models import Category, Product, ProductImage, ProductVariation

store = Store.objects.filter(subdomain='222-fma').first()
if not store:
    print("Store 222-fma not found!")
    sys.exit(1)

print(f"Updating products for store: {store.name} ({store.subdomain})")

# Categories
cat_tops, _ = Category.objects.get_or_create(
    store=store, slug='tops',
    defaults={'name_uz': 'Top', 'name_ru': 'Топы', 'name_en': 'Tops', 'icon': 'shirt', 'sort_order': 1, 'is_active': True}
)
cat_tops.name_uz = 'Top'
cat_tops.name_ru = 'Топы'
cat_tops.save()

cat_outer, _ = Category.objects.get_or_create(
    store=store, slug='outerwear',
    defaults={'name_uz': 'Ustki', 'name_ru': 'Верх', 'name_en': 'Outerwear', 'icon': 'shield', 'sort_order': 2, 'is_active': True}
)
cat_outer.name_uz = 'Ustki'
cat_outer.name_ru = 'Верх'
cat_outer.save()

cat_bottoms, _ = Category.objects.get_or_create(
    store=store, slug='bottoms',
    defaults={'name_uz': 'Shim', 'name_ru': 'Брюки', 'name_en': 'Bottoms', 'icon': 'scissors', 'sort_order': 3, 'is_active': True}
)
cat_bottoms.name_uz = 'Shim'
cat_bottoms.name_ru = 'Брюки'
cat_bottoms.save()

cat_shoes, _ = Category.objects.get_or_create(
    store=store, slug='shoes',
    defaults={'name_uz': 'Poyabzal', 'name_ru': 'Обувь', 'name_en': 'Footwear', 'icon': 'footprints', 'sort_order': 4, 'is_active': True}
)
cat_shoes.name_uz = 'Poyabzal'
cat_shoes.name_ru = 'Обувь'
cat_shoes.save()

# Product items matching 222-fma.uz exactly
products_spec = [
    {
        'slug': 'shim-shimo-76160',
        'name_uz': 'Shim SHIMO-76160',
        'name_ru': 'Брюки SHIMO-76160',
        'label_uz': 'Stone / Tailored fit',
        'label_ru': 'Stone / Классический крой',
        'category': cat_bottoms,
        'slot': 'bottom',
        'price': 500000,
        'color': '#d2d0c8',
        'sizes': ['S', 'M', 'L', 'XL'],
        'photo': '/static/images/222fma/uploads/products/eff4694c-3ef1-4d8a-9ea1-a590b8827363.webp',
        'cutout': '/static/images/222fma/uploads/garments/79fd2a38-5ceb-443f-bc47-d8797a927491.png',
        'fitted': '/static/images/222fma/uploads/models/mannequin-fit-3-e11676191ff0.webp',
        'desc_uz': "460 GSM og'ir vaznli tabiiy paxta matosidan tayyorlangan klassik erkin bichimdagi shim.",
        'desc_ru': "Брюки классического прямого кроя из плотного хлопка плотностью 460 г/м².",
    },
    {
        'slug': 'kardigan-kabu72-08',
        'name_uz': 'Kardigan KABU72-08',
        'name_ru': 'Кардиган KABU72-08',
        'label_uz': 'Cream / Fine knit',
        'label_ru': 'Cream / Тонкая вязка',
        'category': cat_tops,
        'slot': 'top',
        'price': 400000,
        'color': '#dedbd2',
        'sizes': ['S', 'M', 'L', 'XL'],
        'photo': '/static/images/222fma/uploads/products/d2d44e51-90bf-425c-8bed-f16dca465019.webp',
        'cutout': '/static/images/222fma/uploads/garments/690499df-7392-4bb9-92a1-8fca3aede3a4.png',
        'fitted': '/static/images/222fma/uploads/models/mannequin-fit-6-2b837adf18d7.webp',
        'desc_uz': "Yupqa to'qilgan krem rangli kardigan. Yapon furniturasi, qulay va yengil tushum.",
        'desc_ru': "Кардиган кремового оттенка мелкой вязки с премиальными пуговицами.",
    },
    {
        'slug': 'zip-hudi-kakao',
        'name_uz': 'Zip-hudi · Kakao',
        'name_ru': 'Зип-худи · Какао',
        'label_uz': 'Cocoa / Zip hoodie',
        'label_ru': 'Какао / Зип-худи',
        'category': cat_outer,
        'slot': 'top',
        'price': 650000,
        'color': '#63483f',
        'sizes': ['S', 'M', 'L', 'XL'],
        'photo': '/static/images/222fma/uploads/products/c419feff-c5dd-49c5-8272-cd7cb44656b8.webp',
        'cutout': '/static/images/222fma/uploads/garments/e0dda2e1-9094-4180-9810-236accfc7098.png',
        'fitted': '/static/images/222fma/uploads/models/mannequin-fit-7-c880eb50df5a.webp',
        'desc_uz': "Og'ir vaznli 460 GSM paxtadan qalin zip-xudi. Kakao tusidagi chuqur rang, YKK zamok.",
        'desc_ru': "Тяжелое зип-худи плотностью 460 г/м² в глубоком оттенке какао с надежной металлической молнией.",
    },
    {
        'slug': 'jogger-shim-kakao',
        'name_uz': 'Jogger shim · Kakao',
        'name_ru': 'Джоггеры · Какао',
        'label_uz': 'Cocoa / Joggers',
        'label_ru': 'Какао / Джоггеры',
        'category': cat_bottoms,
        'slot': 'bottom',
        'price': 450000,
        'color': '#63483f',
        'sizes': ['S', 'M', 'L', 'XL'],
        'photo': '/static/images/222fma/uploads/products/b74ad4db-39b4-462c-bb1b-eec8efc53f76.webp',
        'cutout': '/static/images/222fma/uploads/garments/662c6b50-4422-44fe-a14a-6e843dc56c49.png',
        'fitted': '/static/images/222fma/uploads/models/mannequin-fit-4-6e8ff4158faa.webp',
        'desc_uz': "Kakao rangli qulay paxta jogger shimi. Zip-xudi bilan birgalikda to'liq kostyum hosil qiladi.",
        'desc_ru': "Хлопковые брюки-джоггеры в оттенке какао. Идеальный монохромный костюм в паре с зип-худи.",
    },
    {
        'slug': 'krossovka-espresso',
        'name_uz': 'Krossovka · Espresso',
        'name_ru': 'Кроссовки · Эспрессо',
        'label_uz': 'Espresso / Sneakers',
        'label_ru': 'Эспрессо / Кроссовки',
        'category': cat_shoes,
        'slot': 'shoes',
        'price': 750000,
        'color': '#3a2822',
        'sizes': ['40', '41', '42', '43', '44'],
        'photo': '/static/images/222fma/uploads/products/09edaa15-7407-46dc-be3a-c09975e1110e.webp',
        'cutout': '/static/images/222fma/uploads/garments/be5c2580-3ace-46bd-abf6-eea10a734429.png',
        'fitted': '/static/images/222fma/uploads/models/mannequin-fit-1-b05dd5d8acda.webp',
        'desc_uz': "Tabiiy zamsh va charm aralashmasidan tayyorlangan espresso rangli shahar krossovkasi.",
        'desc_ru': "Городские массивные кроссовки из натуральной замши и кожи глубокого оттенка эспрессо.",
    },
    {
        'slug': 'polzamok-trikotaj-grafit',
        'name_uz': 'Polzamok trikotaj · Grafit',
        'name_ru': 'Полузамок трикотаж · Графит',
        'label_uz': 'Graphite / Cable knit',
        'label_ru': 'Графит / Полузамок',
        'category': cat_outer,
        'slot': 'top',
        'price': 750000,
        'color': '#3e4144',
        'sizes': ['S', 'M', 'L', 'XL'],
        'photo': '/static/images/222fma/uploads/products/de8f4440-6708-4eb6-bdce-cd9adeecb943.webp',
        'cutout': '/static/images/222fma/uploads/garments/9c21bc3e-43b5-49f5-b2aa-6e07914c9704.png',
        'fitted': '/static/images/222fma/uploads/models/mannequin-fit-8-2ab5f6cefeaf.webp',
        'desc_uz': "Grafit tusidagi bo'rtma to'qilgan polzamok sviter. Elita darajadagi issiq jun va paxta qorishmasi.",
        'desc_ru': "Фактурный свитер с полузамком в цвете графит из мягкой смесовой шерсти.",
    },
    {
        'slug': 'shim-grafit',
        'name_uz': 'Shim · Grafit',
        'name_ru': 'Брюки · Графит',
        'label_uz': 'Graphite / Wool blend',
        'label_ru': 'Графит / Полушерсть',
        'category': cat_bottoms,
        'slot': 'bottom',
        'price': 550000,
        'color': '#373a3d',
        'sizes': ['S', 'M', 'L', 'XL'],
        'photo': '/static/images/222fma/uploads/products/4ce43804-ba03-436f-a55a-ae909e791df3.webp',
        'cutout': '/static/images/222fma/uploads/garments/fb727322-222c-4444-85fa-a590c8427ddc.png',
        'fitted': '/static/images/222fma/uploads/models/mannequin-fit-5-a5984d772803.webp',
        'desc_uz': "Grafit tusli to'g'ri bichimli shim. Yengil jun aralashmasi, zamonaviy uslub.",
        'desc_ru': "Брюки прямого силуэта из полушерстяной костюмной ткани благородного графитового цвета.",
    },
    {
        'slug': 'krossovka-kulrang',
        'name_uz': 'Krossovka · Kulrang',
        'name_ru': 'Кроссовки · Серый',
        'label_uz': 'Grey / Slip-on sneakers',
        'label_ru': 'Серый / Слипоны',
        'category': cat_shoes,
        'slot': 'shoes',
        'price': 700000,
        'color': '#707175',
        'sizes': ['40', '41', '42', '43', '44'],
        'photo': '/static/images/222fma/uploads/products/57e79bb8-8159-4bf8-ad5b-3af28d7d4d3d.webp',
        'cutout': '/static/images/222fma/uploads/garments/daedf988-46a9-4e7d-a1b4-a8bf08c10f11.png',
        'fitted': '/static/images/222fma/uploads/models/mannequin-fit-2-efdd57d6553b.webp',
        'desc_uz': "Kulrang zamonaviy shahar krossovkalari. Minimalist dizayn va qulay ergonomik taglik.",
        'desc_ru': "Минималистичные серые сникеры с амортизирующей подошвой для долгих прогулок.",
    },
]

# Wipe old products for 222-fma so that we have clean 8 items
Product.objects.filter(store=store).delete()

for idx, p in enumerate(products_spec):
    prod = Product.objects.create(
        store=store,
        slug=p['slug'],
        category=p['category'],
        name_uz=p['name_uz'],
        name_ru=p['name_ru'],
        name_en=p['name_uz'],
        description_uz=p['desc_uz'],
        description_ru=p['desc_ru'],
        description_en=p['desc_uz'],
        price=p['price'],
        cost_price=p['price'] * 0.45,
        image_url=p['photo'],
        barcode=f"222-FMA-00{idx+1}",
        stock=50,
        is_active=True,
        is_featured=True,
        rating=5.0,
        reviews_count=24
    )

    # ProductImage
    ProductImage.objects.create(
        product=prod,
        image=p['photo'].replace('/static/', ''),
        is_primary=True,
        sort_order=0
    )

    # Size variations
    for s_idx, s in enumerate(p['sizes']):
        ProductVariation.objects.create(
            product=prod,
            name_uz=s,
            name_ru=s,
            name_en=s,
            price=prod.price,
            stock=15,
            is_active=True,
            sort_order=s_idx
        )
    print(f"[{idx+1}/8] Created product: {prod.name_uz} ({prod.price:,} UZS) with {len(p['sizes'])} sizes.")

print("\nSuccessfully synchronized all 8 authentic products for 222 FMA!")
