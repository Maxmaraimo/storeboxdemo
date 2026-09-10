import json
from django.test import TestCase, Client
from apps.accounts.models import User
from apps.stores.models import Store


class AuthAndRegistrationTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='998901234567',
            phone='+998901234567',
            email='merchant@example.com',
            password='Password123!',
            role=User.Roles.MERCHANT
        )
        self.store = Store.objects.create(
            owner=self.user,
            name="Test Store",
            subdomain="test-store",
            is_active=True
        )

    def test_auth_urls_reachability(self):
        """Verify both root and dashboard prefixed login/register URLs return 200."""
        for path in ['/login/', '/register/', '/dashboard/login/', '/dashboard/register/']:
            response = self.client.get(path)
            self.assertEqual(response.status_code, 200, f"Failed for {path}")

    def test_login_various_formats(self):
        """Verify login works with +998, 998, national 9 digits, and with spaces."""
        login_formats = [
            '+998901234567',
            '998901234567',
            '+998 90 123 45 67',
            '901234567',
            'merchant@example.com',
        ]
        for val in login_formats:
            c = Client()
            response = c.post('/login/', {'login': val, 'password': 'Password123!'})
            self.assertEqual(response.status_code, 302, f"Failed login for format: {val}")
            self.assertEqual(response.headers['Location'], '/dashboard/')

    def test_registration_flow(self):
        """Verify new user registration creates user and redirects to onboarding."""
        c = Client()
        response = c.post('/register/', {
            'phone': '+998939998877',
            'country_code': 'uz',
            'email': 'new@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'plan': 'pro'
        })
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.headers['Location'], '/dashboard/onboarding/')
        self.assertTrue(User.objects.filter(username='998939998877').exists())

    def test_registration_with_8_prefix(self):
        """Verify Uzbek phone starting with 8 is normalized properly."""
        c = Client()
        response = c.post('/register/', {
            'phone': '8937776655',
            'country_code': 'uz',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
        })
        self.assertEqual(response.status_code, 302)
        self.assertTrue(User.objects.filter(username='998937776655').exists())

    def test_api_auth_endpoints(self):
        """Verify JSON API login and register endpoints."""
        c = Client()
        # API Login
        login_res = c.post(
            '/api/v1/auth/login/',
            json.dumps({'login': '901234567', 'password': 'Password123!'}),
            content_type='application/json'
        )
        self.assertEqual(login_res.status_code, 200)
        self.assertIn('user', login_res.json())

        # API Register
        reg_res = c.post(
            '/api/v1/auth/register/',
            json.dumps({
                'phone': '+998971112233',
                'password': 'StrongPass123!',
                'password_confirm': 'StrongPass123!'
            }),
            content_type='application/json'
        )
        self.assertEqual(reg_res.status_code, 201)
        self.assertTrue(User.objects.filter(username='998971112233').exists())
