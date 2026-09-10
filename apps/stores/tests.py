from decimal import Decimal
import json
from django.test import TestCase, Client
from apps.accounts.models import User
from apps.stores.models import Store
from apps.orders.models import MarketingBanner


class ThemeTemplateAndDesignApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='998901234567',
            phone='+998 90 123 45 67',
            password='testpassword123',
            role=User.Roles.MERCHANT
        )
        self.store = Store.objects.create(
            owner=self.user,
            name='Dizayn Test Do\'koni',
            subdomain='dizayntest',
            theme_template=Store.ThemeTemplates.UNIVERSAL
        )
        self.client.force_login(self.user)

    def test_store_theme_template_choices(self):
        """Verify theme_template choices on Store model."""
        self.assertEqual(self.store.theme_template, 'universal')

        self.store.theme_template = Store.ThemeTemplates.RESTAURANT
        self.store.save()
        self.store.refresh_from_db()
        self.assertEqual(self.store.theme_template, 'restaurant')

        self.store.theme_template = Store.ThemeTemplates.BOUTIQUE
        self.store.save()
        self.store.refresh_from_db()
        self.assertEqual(self.store.theme_template, 'boutique')

    def test_design_theme_get_api(self):
        """GET /api/v1/design/theme/ returns template and banners."""
        res = self.client.get('/api/v1/design/theme/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['theme_template'], 'universal')
        self.assertIn('templates', data)
        self.assertEqual(len(data['templates']), 3)
        self.assertIn('banners', data)

    def test_design_theme_save_api(self):
        """POST /api/v1/design/theme/ updates theme_template."""
        res = self.client.post(
            '/api/v1/design/theme/',
            data=json.dumps({'theme_template': 'restaurant'}),
            content_type='application/json'
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['theme_template'], 'restaurant')

        self.store.refresh_from_db()
        self.assertEqual(self.store.theme_template, 'restaurant')

    def test_design_banners_crud_api(self):
        """Test full banner CRUD: list, create, update, reorder, delete."""
        # 1. Create banner
        res = self.client.post(
            '/api/v1/design/banners/',
            data=json.dumps({
                'title': 'Bahor aksiya 20%',
                'subtitle': 'Barcha taomlarga chegirma',
                'link': '/category/fast-food/',
                'is_active': True,
                'sort_order': 1
            }),
            content_type='application/json'
        )
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertTrue(data['success'])
        banner_id = data['banner']['id']
        self.assertEqual(data['banner']['title'], 'Bahor aksiya 20%')

        # 2. List banners
        res = self.client.get('/api/v1/design/banners/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertEqual(len(data['banners']), 1)

        # 3. Create second banner
        res2 = self.client.post(
            '/api/v1/design/banners/',
            data=json.dumps({
                'title': 'Yangi burgerlar',
                'subtitle': 'Haftaning yangi retsepti',
                'link': '/category/burgers/',
                'is_active': True,
                'sort_order': 2
            }),
            content_type='application/json'
        )
        self.assertEqual(res2.status_code, 201)
        banner2_id = res2.json()['banner']['id']

        # 4. Update banner (PUT / PATCH)
        res_update = self.client.patch(
            f'/api/v1/design/banners/{banner_id}/',
            data=json.dumps({'title': 'Bahor aksiya 30% yangilandi', 'is_active': False}),
            content_type='application/json'
        )
        self.assertEqual(res_update.status_code, 200)
        self.assertEqual(res_update.json()['banner']['title'], 'Bahor aksiya 30% yangilandi')
        self.assertFalse(res_update.json()['banner']['is_active'])

        # 5. Reorder banners
        res_reorder = self.client.post(
            '/api/v1/design/banners/reorder/',
            data=json.dumps({'banner_ids': [banner2_id, banner_id]}),
            content_type='application/json'
        )
        self.assertEqual(res_reorder.status_code, 200)
        b2 = MarketingBanner.objects.get(id=banner2_id)
        b1 = MarketingBanner.objects.get(id=banner_id)
        self.assertEqual(b2.sort_order, 0)
        self.assertEqual(b1.sort_order, 1)

        # 6. Delete banner
        res_del = self.client.delete(f'/api/v1/design/banners/{banner_id}/')
        self.assertEqual(res_del.status_code, 200)
        self.assertFalse(MarketingBanner.objects.filter(id=banner_id).exists())
