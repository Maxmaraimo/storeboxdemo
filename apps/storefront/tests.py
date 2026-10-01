from decimal import Decimal
from django.test import TestCase, Client
from apps.accounts.models import User
from apps.stores.models import Store
from apps.catalog.models import Category, Product
from apps.orders.models import MarketingBanner


class StorefrontTemplateAndCarouselTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='998909876543',
            phone='+998 90 987 65 43',
            password='testpass12345',
            role=User.Roles.MERCHANT
        )
        self.store = Store.objects.create(
            owner=self.user,
            name='Gourmet Burger Resto',
            subdomain='gourmet-burger',
            theme_template=Store.ThemeTemplates.RESTAURANT,
            delivery_price=Decimal('15000'),
            free_delivery_threshold=Decimal('150000')
        )
        self.category = Category.objects.create(
            store=self.store,
            name_uz='Burgerlar',
            name_ru='Бургеры',
            slug='burgers'
        )
        self.product = Product.objects.create(
            store=self.store,
            category=self.category,
            name_uz='Cheeseburger Double',
            name_ru='Чизбургер Двойной',
            slug='cheeseburger-double',
            price=Decimal('55000'),
            is_active=True
        )

    def test_storefront_renders_restaurant_template(self):
        """Store with theme_template='restaurant' renders restaurant-specific elements."""
        res = self.client.get(f'/store/{self.store.subdomain}/')
        self.assertEqual(res.status_code, 200)
        # Check restaurant template markers
        self.assertContains(res, 'storebox-tpl-restaurant')
        self.assertContains(res, 'Cheeseburger Double')

    def test_storefront_renders_universal_template(self):
        """Overriding template with ?template=universal renders universal grid."""
        res = self.client.get(f'/store/{self.store.subdomain}/?template=universal')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'storebox-tpl-universal')

    def test_storefront_renders_boutique_template(self):
        """Overriding template with ?template=boutique renders boutique layout."""
        res = self.client.get(f'/store/{self.store.subdomain}/?template=boutique')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'storebox-tpl-boutique')

    def test_multi_banner_carousel_rendering(self):
        """Test multi-banner slider: multiple banners render carousel slides and dots."""
        # 1. No banners
        res = self.client.get(f'/store/{self.store.subdomain}/')
        self.assertEqual(res.status_code, 200)

        # 2. Add 2 banners
        b1 = MarketingBanner.objects.create(
            store=self.store,
            title='20% chegirma',
            subtitle='Faqat bugun',
            is_active=True,
            sort_order=1
        )
        b2 = MarketingBanner.objects.create(
            store=self.store,
            title='Bepul yetkazish',
            subtitle='150 000 so\'mdan yuqori',
            is_active=True,
            sort_order=2
        )

        res = self.client.get(f'/store/{self.store.subdomain}/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'bannerTrack')
        self.assertContains(res, '20% chegirma')
        self.assertContains(res, 'Bepul yetkazish')
        self.assertContains(res, 'bannerIndicators')

    def test_constructor_page_creates_burger_preset_when_store_has_none(self):
        self.assertFalse(self.store.products.filter(has_constructor=True).exists())

        res = self.client.get(f'/store/{self.store.subdomain}/constructor/', follow=True)
        self.assertEqual(res.status_code, 200)
        product = self.store.products.get(has_constructor=True)
        self.assertTrue(product.slug)
        self.assertTrue(product.image_url)
        self.assertTrue(product.constructor_groups.exists())
        self.assertFalse(product.constructor_groups.exclude(store=self.store).exists())

    def test_constructor_toggle_and_storefront_visibility(self):
        prod = self.store.products.first()
        prod.has_constructor = True
        prod.save()

        # 1. When constructor is enabled and product exists, constructor tab and icon appear
        self.store.is_constructor_enabled = True
        self.store.save()
        res_enabled = self.client.get(f'/store/{self.store.subdomain}/')
        self.assertEqual(res_enabled.status_code, 200)
        content_enabled = res_enabled.content.decode('utf-8')
        self.assertIn("O'zing ter", content_enabled)
        self.assertIn('data-lucide="wand-2"', content_enabled)

        # 2. When constructor is disabled via is_constructor_enabled = False, it disappears
        self.store.is_constructor_enabled = False
        self.store.save()
        res_disabled = self.client.get(f'/store/{self.store.subdomain}/')
        self.assertEqual(res_disabled.status_code, 200)
        content_disabled = res_disabled.content.decode('utf-8')
        self.assertNotIn("O'zing ter", content_disabled)
        self.assertNotIn('data-lucide="wand-2"', content_disabled)

        # 3. Direct access to constructor redirects when disabled
        res_redirect = self.client.get(f'/store/{self.store.subdomain}/constructor/')
        self.assertEqual(res_redirect.status_code, 302)

        # 4. API toggle endpoint works
        self.client.force_login(self.store.owner)
        res_api = self.client.post('/api/constructor/toggle-status/', content_type='application/json')
        self.assertEqual(res_api.status_code, 200)
        self.store.refresh_from_db()
        self.assertTrue(self.store.is_constructor_enabled)

