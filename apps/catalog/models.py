from decimal import Decimal
from django.db import models
from apps.stores.models import Store


class Category(models.Model):
    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        related_name='categories',
        verbose_name='Магазин'
    )
    name_uz = models.CharField(max_length=100, verbose_name="Kategoriya nomi (O'zbek)")
    name_ru = models.CharField(max_length=100, blank=True, verbose_name='Название (RU)')
    name_en = models.CharField(max_length=100, blank=True, verbose_name='Name (EN)')
    name_tr = models.CharField(max_length=100, blank=True, verbose_name='Name (TR)')
    slug = models.SlugField(max_length=120, verbose_name='Слаг')
    icon = models.CharField(max_length=50, blank=True, default='utensils')
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    image_url = models.URLField(max_length=500, blank=True, default='', verbose_name='Rasm havolasi (URL)')
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    @property
    def primary_image_url(self):
        if self.image:
            return self.image.url
        if self.image_url:
            return self.image_url
        first_p = self.products.filter(is_active=True).first() or self.products.first()
        if first_p and first_p.primary_image_url:
            return first_p.primary_image_url
        return None

    @property
    def active_products_count(self):
        return self.products.filter(is_active=True).count()

    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        ordering = ['sort_order', 'id']
        unique_together = ('store', 'slug')

    def __str__(self):
        return f"{self.name_uz or self.name_ru} ({self.store.name})"

    def save(self, *args, **kwargs):
        from apps.catalog.translations import auto_populate_category_translations
        auto_populate_category_translations(self, save=False)
        super().save(*args, **kwargs)

    def get_name(self, lang='uz'):
        import re
        from apps.catalog.translations import auto_translate_text, detect_text_language
        lang = (lang or 'uz').lower()
        attr = f'name_{lang}'
        val = (getattr(self, attr, None) or '').strip()

        candidates = [self.name_ru, self.name_uz, self.name_en, getattr(self, 'name_tr', None)]
        source_text = ''
        for c in candidates:
            if c and c.strip():
                source_text = c.strip()
                break

        if not source_text:
            return ''

        src_l = detect_text_language(source_text)

        if val:
            if lang == src_l:
                return val
            is_untranslated_cyrillic = bool(re.search(r'[\u0400-\u04FF]', val)) and lang in ['en', 'tr']
            is_identical_to_src = val.lower() == source_text.lower()
            if not is_untranslated_cyrillic and not is_identical_to_src:
                return val

        auto_val = auto_translate_text(source_text, target_lang=lang, src_lang=src_l)
        if auto_val:
            setattr(self, attr, auto_val)
            return auto_val

        return val or source_text


class Product(models.Model):
    class Units(models.TextChoices):
        DONA = 'Dona', 'Dona'
        METR = 'Metr', 'Metr'
        KILOGRAM = 'Kilogram', 'Kilogram'
        GRAMM = 'Gramm', 'Gramm'
        SANTIMETR = 'Santimetr', 'Santimetr'
        LITR = 'Litr', 'Litr'
        KVADRAT_METR = 'Kvadrat metr', 'Kvadrat metr'
        PORTSIYA = 'Portsiya', 'Portsiya'
        TONNA = 'Tonna', 'Tonna'
        KUB_METR = 'Kub metr', 'Kub metr'
        UPAKOVKA = 'Upakovka', 'Upakovka'
        KOROBKA = 'Korobka', 'Korobka'
        PACHKA = 'Pachka', 'Pachka'
        BLOK = 'Blok', 'Blok'
        MILLIGRAM = 'Milligram', 'Milligram'
        MILLILITR = 'Millilitr', 'Millilitr'

    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, related_name='products', null=True, blank=True)
    
    name_uz = models.CharField(max_length=200, verbose_name="Mahsulot nomi (O'zbek)")
    name_ru = models.CharField(max_length=200, blank=True, verbose_name='Название (RU)')
    name_en = models.CharField(max_length=200, blank=True, verbose_name='Name (EN)')
    name_tr = models.CharField(max_length=200, blank=True, verbose_name='Name (TR)')
    slug = models.SlugField(max_length=220)

    description_uz = models.TextField(blank=True, verbose_name="Ta'rif (O'zbek)")
    description_ru = models.TextField(blank=True, verbose_name='Описание (RU)')
    description_en = models.TextField(blank=True, verbose_name='Description (EN)')
    description_tr = models.TextField(blank=True, verbose_name='Description (TR)')

    # Pricing & Warehouse Fields from Video 08:59
    price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Sotuv narxi (UZS)')
    old_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='Eski narx (UZS)')
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='Kirish narxi (UZS)')
    margin = models.DecimalField(max_digits=6, decimal_places=2, default=100.0, verbose_name='Marja (%)')

    # Tax & Catalog codes
    ikpu_code = models.CharField(max_length=50, blank=True, verbose_name='IKPU')
    package_code = models.CharField(max_length=50, blank=True, verbose_name='Qadoqlash kodi')
    barcode = models.CharField(max_length=100, blank=True, verbose_name='Shtrix-kod')

    unit = models.CharField(max_length=30, choices=Units.choices, default=Units.DONA, verbose_name="O'lchov birligi")
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=5.0)
    reviews_count = models.PositiveIntegerField(default=0)
    image_url = models.URLField(max_length=500, blank=True, default='', verbose_name='Rasm havolasi (URL)')
    
    stock = models.IntegerField(default=10, verbose_name='Qolgan (dona)')
    track_stock = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Товар'
        verbose_name_plural = 'Товары'
        ordering = ['-is_featured', '-created_at']
        unique_together = ('store', 'slug')

    def __str__(self):
        return f"{self.name_uz or self.name_ru} ({self.store.name})"

    def save(self, *args, **kwargs):
        from apps.catalog.translations import auto_populate_product_translations
        auto_populate_product_translations(self, save=False)
        super().save(*args, **kwargs)

    def get_name(self, lang='uz'):
        import re
        from apps.catalog.translations import auto_translate_text, detect_text_language
        lang = (lang or 'uz').lower()
        attr = f'name_{lang}'
        val = (getattr(self, attr, None) or '').strip()

        candidates = [self.name_ru, self.name_uz, self.name_en, getattr(self, 'name_tr', None)]
        source_text = ''
        for c in candidates:
            if c and c.strip():
                source_text = c.strip()
                break

        if not source_text:
            return ''

        src_l = detect_text_language(source_text)

        if val:
            if lang == src_l:
                return val
            is_untranslated_cyrillic = bool(re.search(r'[\u0400-\u04FF]', val)) and lang in ['en', 'tr']
            is_identical_to_src = val.lower() == source_text.lower()
            if not is_untranslated_cyrillic and not is_identical_to_src:
                return val

        auto_val = auto_translate_text(source_text, target_lang=lang, src_lang=src_l)
        if auto_val:
            setattr(self, attr, auto_val)
            return auto_val

        return val or source_text

    def get_description(self, lang='uz'):
        import re
        from apps.catalog.translations import auto_translate_text, detect_text_language
        lang = (lang or 'uz').lower()
        attr = f'description_{lang}'
        val = (getattr(self, attr, None) or '').strip()

        candidates = [self.description_ru, self.description_uz, self.description_en, getattr(self, 'description_tr', None)]
        source_text = ''
        for c in candidates:
            if c and c.strip():
                source_text = c.strip()
                break

        if not source_text:
            return ''

        src_dl = detect_text_language(source_text)

        if val:
            if lang == src_dl:
                return val
            is_untranslated_cyrillic = bool(re.search(r'[\u0400-\u04FF]', val)) and lang in ['en', 'tr']
            is_identical_to_src = val.lower() == source_text.lower()
            if not is_untranslated_cyrillic and not is_identical_to_src:
                return val

        auto_val = auto_translate_text(source_text, target_lang=lang, src_lang=src_dl)
        if auto_val:
            setattr(self, attr, auto_val)
            return auto_val

        return val or source_text

    def get_unit_name(self, lang='uz'):
        u = (self.unit or '').strip()
        unit_map = {
            'Dona': {'ru': 'шт.', 'en': 'pcs', 'tr': 'adet', 'uz': 'dona'},
            'Kg': {'ru': 'кг', 'en': 'kg', 'tr': 'kg', 'uz': 'kg'},
            'Gramm': {'ru': 'г', 'en': 'g', 'tr': 'g', 'uz': 'gramm'},
            'Litr': {'ru': 'л', 'en': 'l', 'tr': 'lt', 'uz': 'litr'},
            'Metr': {'ru': 'м', 'en': 'm', 'tr': 'm', 'uz': 'metr'},
            'Santimetr': {'ru': 'см', 'en': 'cm', 'tr': 'cm', 'uz': 'santimetr'},
            'Porsiya': {'ru': 'порц.', 'en': 'portion', 'tr': 'porsiyon', 'uz': 'porsiya'},
            'Komplekt': {'ru': 'компл.', 'en': 'set', 'tr': 'set', 'uz': 'komplekt'},
            'Juft': {'ru': 'пара', 'en': 'pair', 'tr': 'çift', 'uz': 'juft'},
            'Upakovka': {'ru': 'уп.', 'en': 'pack', 'tr': 'paket', 'uz': 'upakovka'},
            'Korobka': {'ru': 'кор.', 'en': 'box', 'tr': 'kutu', 'uz': 'korobka'},
            'Pachka': {'ru': 'пач.', 'en': 'pack', 'tr': 'paket', 'uz': 'pachka'},
            'Blok': {'ru': 'блок', 'en': 'block', 'tr': 'blok', 'uz': 'blok'},
            'Milligram': {'ru': 'мг', 'en': 'mg', 'tr': 'mg', 'uz': 'milligram'},
            'Millilitr': {'ru': 'мл', 'en': 'ml', 'tr': 'ml', 'uz': 'millilitr'},
        }
        lang = (lang or 'uz').lower()
        if u in unit_map and lang in unit_map[u]:
            return unit_map[u][lang]
        return self.get_unit_display() or u

    @property
    def discount_percent(self):
        if self.old_price and self.old_price > self.price and self.old_price > 0:
            discount = ((self.old_price - self.price) / self.old_price) * 100
            return int(round(discount))
        return None

    @property
    def primary_image(self):
        primary = self.images.filter(is_primary=True).first()
        if not primary:
            primary = self.images.first()
        if primary and primary.image:
            return primary.image
        return None

    @property
    def primary_image_url(self):
        primary = self.images.filter(is_primary=True).first()
        if not primary:
            primary = self.images.first()
        if primary and primary.image:
            return primary.image.url
        if self.image_url:
            return self.image_url
        return None

    @property
    def is_in_stock(self):
        if not self.track_stock:
            return True
        return self.stock > 0


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-is_primary', 'sort_order', 'id']


class ProductVariation(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variations')
    name_uz = models.CharField(max_length=100, verbose_name='Variant (UZ)')
    name_ru = models.CharField(max_length=100, blank=True, verbose_name='Вариант (RU)')
    name_en = models.CharField(max_length=100, blank=True, verbose_name='Option (EN)')
    name_tr = models.CharField(max_length=100, blank=True, verbose_name='Option (TR)')
    price = models.DecimalField(max_digits=12, decimal_places=2)
    stock = models.IntegerField(default=10)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'id']

    def __str__(self):
        return f"{self.product.name_uz or self.product.name_ru} - {self.name_uz}"

    def get_name(self, lang='uz'):
        lang = (lang or 'uz').lower()
        if lang == 'ru' and self.name_ru:
            return self.name_ru
        elif lang == 'en' and self.name_en:
            return self.name_en
        elif lang == 'tr' and getattr(self, 'name_tr', None):
            return self.name_tr
        from apps.catalog.translations import auto_translate_text
        return auto_translate_text(self.name_uz or self.name_ru or '', target_lang=lang) or self.name_uz or ''


class YesPosConnection(models.Model):
    store = models.OneToOneField('stores.Store', on_delete=models.CASCADE, related_name='yespos_connection')
    api_key = models.CharField(max_length=255)
    branch_id = models.CharField(max_length=100)
    branch_name = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    last_sync_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"YES POS - {self.store.name} ({self.branch_name})"


class YesPosCategoryLink(models.Model):
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='yespos_category_links')
    remote_category_id = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='yespos_links')
    last_synced_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('store', 'remote_category_id')


class YesPosProductLink(models.Model):
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='yespos_product_links')
    remote_product_id = models.CharField(max_length=100)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='yespos_links')
    remote_barcode = models.CharField(max_length=100, blank=True)
    remote_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    remote_stock = models.IntegerField(default=0)
    last_synced_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('store', 'remote_product_id')


class ProductReview(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='Mahsulot'
    )
    author_name = models.CharField(max_length=120, verbose_name='Mijoz ismi')
    author_phone = models.CharField(max_length=30, blank=True, verbose_name='Telefon')
    rating = models.PositiveSmallIntegerField(default=5, verbose_name='Baho (1-5)')
    comment = models.TextField(verbose_name='Sharh matni')
    is_verified_buyer = models.BooleanField(default=True, verbose_name='Xarid tasdiqlangan')
    is_approved = models.BooleanField(default=True, verbose_name='Tasdiqlangan')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Sharh'
        verbose_name_plural = 'Sharhlar'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author_name} ({self.rating}★) - {self.product.name_uz}"
