from django.test import Client, TestCase

from apps.accounts.models import User


class PlatformDomainRoutingTests(TestCase):
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
