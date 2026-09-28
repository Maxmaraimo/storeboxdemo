import json
from django.test import TestCase, Client
from apps.accounts.models import User, PhoneVerification
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

    def test_sms_send_and_verify_flow(self):
        """Verify Eskiz SMS code generation, cooldown, and verification endpoints."""
        c = Client()
        phone = "+998905554433"

        # 1. Send SMS code
        send_res = c.post(
            '/api/v1/auth/sms/send-code/',
            json.dumps({'phone': phone, 'purpose': 'MERCHANT_LOGIN'}),
            content_type='application/json'
        )
        self.assertEqual(send_res.status_code, 200)
        send_data = send_res.json()
        self.assertTrue(send_data.get('success'))
        self.assertIn('cooldown', send_data)
        record = PhoneVerification.objects.filter(phone=phone, purpose='MERCHANT_LOGIN').latest('created_at')
        code = record.code
        self.assertTrue(code and len(code) == 4)

        # 2. Test cooldown anti-spam blocks immediate duplicate send
        dup_res = c.post(
            '/api/v1/auth/sms/send-code/',
            json.dumps({'phone': phone, 'purpose': 'MERCHANT_LOGIN'}),
            content_type='application/json'
        )
        self.assertIn(dup_res.status_code, [400, 429])
        self.assertFalse(dup_res.json().get('success'))

        # 3. Test wrong code fails
        wrong_res = c.post(
            '/api/v1/auth/sms/verify-code/',
            json.dumps({'phone': phone, 'code': '0000', 'purpose': 'MERCHANT_LOGIN'}),
            content_type='application/json'
        )
        self.assertEqual(wrong_res.status_code, 400)

        # 4. Test valid code succeeds and creates/logs in user
        verify_res = c.post(
            '/api/v1/auth/sms/verify-code/',
            json.dumps({'phone': phone, 'code': code, 'purpose': 'MERCHANT_LOGIN'}),
            content_type='application/json'
        )
        self.assertEqual(verify_res.status_code, 200)
        self.assertTrue(verify_res.json().get('success'))
        self.assertTrue(User.objects.filter(phone=phone).exists())
