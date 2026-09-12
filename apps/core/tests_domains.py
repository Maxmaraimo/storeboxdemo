from django.test import Client, TestCase, override_settings

from apps.accounts.models import User
from apps.stores.models import Store


class PlatformDomainRoutingTests(TestCase):
    def setUp(self):
        owner = User.objects.create_user(
            username='storefront-owner',
            password='SafePassword123!',
        )
        self.store = Store.objects.create(
            owner=owner,
            name='Shop 655',
            subdomain='shop-655',
        )

    def test_public_site_keeps_landing_and_links_to_app_auth(self):
        response = self.client.get('/', HTTP_HOST='storebox.uz', secure=True)

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'https://app.storebox.uz/dashboard/login/')
        self.assertContains(response, 'https://app.storebox.uz/dashboard/register/')

    def test_public_dashboard_paths_move_to_app_domain(self):
        response = self.client.get(
            '/dashboard/login/?next=/dashboard/',
            HTTP_HOST='storebox.uz',
            secure=True,
        )

        self.assertRedirects(
            response,
            'https://app.storebox.uz/dashboard/login/?next=/dashboard/',
            fetch_redirect_response=False,
        )

    def test_app_root_and_legacy_login_use_canonical_app_paths(self):
        root_response = self.client.get('/', HTTP_HOST='app.storebox.uz', secure=True)
        login_response = self.client.get('/login/', HTTP_HOST='app.storebox.uz', secure=True)
        canonical_response = self.client.get(
            '/dashboard/login/',
            HTTP_HOST='app.storebox.uz',
            secure=True,
        )

        self.assertRedirects(
            root_response,
            'https://app.storebox.uz/dashboard/',
            fetch_redirect_response=False,
        )
        self.assertRedirects(
            login_response,
            'https://app.storebox.uz/dashboard/login/',
            fetch_redirect_response=False,
        )
        self.assertEqual(canonical_response.status_code, 200)

    def test_billing_domain_uses_root_paths_and_app_login(self):
        anonymous_response = self.client.get('/', HTTP_HOST='billing.storebox.uz', secure=True)
        legacy_response = self.client.get(
            '/super-admin/servers/',
            HTTP_HOST='billing.storebox.uz',
            secure=True,
        )

        self.assertRedirects(
            anonymous_response,
            'https://app.storebox.uz/dashboard/login/?next=https%3A%2F%2Fbilling.storebox.uz%2F',
            fetch_redirect_response=False,
        )
        self.assertRedirects(
            legacy_response,
            'https://billing.storebox.uz/servers/',
            fetch_redirect_response=False,
        )

    def test_superadmin_can_open_billing_root(self):
        user = User.objects.create_superuser(
            username='billing-admin',
            email='billing-admin@example.com',
            password='SafePassword123!',
        )
        client = Client()
        client.force_login(user)

        root_response = client.get('/', HTTP_HOST='billing.storebox.uz', secure=True)
        servers_response = client.get('/servers/', HTTP_HOST='billing.storebox.uz', secure=True)

        self.assertRedirects(root_response, '/servers/', fetch_redirect_response=False)
        self.assertEqual(servers_response.status_code, 200)

    def test_app_login_accepts_safe_billing_return_url(self):
        User.objects.create_user(
            username='billing-login',
            password='SafePassword123!',
            is_staff=True,
        )

        response = self.client.post(
            '/dashboard/login/?next=https%3A%2F%2Fbilling.storebox.uz%2F',
            {'login': 'billing-login', 'password': 'SafePassword123!'},
            HTTP_HOST='app.storebox.uz',
            secure=True,
        )

        self.assertRedirects(
            response,
            'https://billing.storebox.uz/',
            fetch_redirect_response=False,
        )

    def test_legacy_store_url_moves_to_canonical_subdomain(self):
        response = self.client.get(
            '/store/shop-655/?cat=new',
            HTTP_HOST='app.storebox.uz',
            secure=True,
        )

        self.assertRedirects(
            response,
            'https://shop-655.storebox.uz/?cat=new',
            fetch_redirect_response=False,
        )

    def test_legacy_store_post_preserves_method_on_redirect(self):
        response = self.client.post(
            '/store/shop-655/cart/add/',
            {'product_id': 123, 'quantity': 1},
            HTTP_HOST='app.storebox.uz',
            secure=True,
        )

        self.assertEqual(response.status_code, 307)
        self.assertEqual(
            response['Location'],
            'https://shop-655.storebox.uz/cart/add/',
        )

    def test_store_subdomain_serves_storefront_and_allows_app_preview(self):
        response = self.client.get(
            '/?preview=1',
            HTTP_HOST='shop-655.storebox.uz',
            secure=True,
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Shop 655')
        self.assertNotIn('X-Frame-Options', response)
        self.assertEqual(
            response['Content-Security-Policy'],
            'frame-ancestors https://app.storebox.uz',
        )

    @override_settings(STOREFRONT_SUBDOMAIN_URLS=False)
    def test_legacy_store_url_remains_available_during_dns_rollout(self):
        response = self.client.get(
            '/store/shop-655/',
            HTTP_HOST='app.storebox.uz',
            secure=True,
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Shop 655')
        self.assertEqual(
            self.store.get_storefront_url(),
            'https://storebox.uz/store/shop-655',
        )
