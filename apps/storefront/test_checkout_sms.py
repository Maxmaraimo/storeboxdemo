import json
from decimal import Decimal
from datetime import timedelta
from unittest.mock import patch, MagicMock

from django.test import TestCase, Client
from django.utils import timezone

from apps.accounts.models import User, SMSVerification
from apps.stores.models import Store, Branch
from apps.catalog.models import Category, Product
from apps.orders.models import Order, Customer
from apps.core.sms_service import (
    send_checkout_sms_code,
    verify_checkout_sms_code,
    normalize_phone_number,
    get_or_create_customer_user,
    send_sms_via_eskiz,
)


class CheckoutSMSIntegrationTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.merchant = User.objects.create_user(
            username='seller_test',
            email='seller@storebox.uz',
            phone='+998901112233',
            role=User.Roles.MERCHANT
        )
        self.store = Store.objects.create(
            owner=self.merchant,
            name='Test Tech Store',
            subdomain='testtech',
            delivery_price=Decimal('15000'),
            free_delivery_threshold=Decimal('200000'),
            is_active=True
        )
        self.branch = Branch.objects.create(
            store=self.store,
            name='Main Branch',
            address='Tashkent, Chilonzor',
            latitude=Decimal('41.2858'),
            longitude=Decimal('69.2035'),
            is_main=True,
            is_active=True
        )
        self.category = Category.objects.create(
            store=self.store,
            name_uz='Smartfonlar',
            name_ru='Смартфоны',
            slug='smartfonlar'
        )
        self.product = Product.objects.create(
            store=self.store,
            category=self.category,
            name_uz='Redmi Note 13',
            name_ru='Redmi Note 13',
            price=Decimal('150000'),
            stock=10,
            track_stock=True,
            is_active=True
        )

    def test_send_sms_via_eskiz_uses_template_92326(self):
        with patch('apps.core.sms_service.sms_service.send_sms') as mock_send:
            mock_send.return_value = {'success': True, 'status': 'sent'}
            res = send_sms_via_eskiz('+998901234567', '4567')
            self.assertTrue(res['success'])
            mock_send.assert_called_once_with(
                phone='+998901234567',
                message='StoreBox internet-magazinlar platformasiga kirish uchun tasdiqlash kodi: 4567',
                template_id=92326
            )

    @patch('apps.core.sms_service.send_sms_via_eskiz')
    def test_send_checkout_sms_code_flow_and_cooldown(self, mock_sms):
        mock_sms.return_value = {'success': True, 'status': 'sent'}
        phone = '+998 90 123 45 67'
        norm_phone = normalize_phone_number(phone)

        # 1. First send -> succeeds
        res1 = send_checkout_sms_code(phone)
        self.assertTrue(res1['success'])
        self.assertEqual(res1['cooldown'], 60)
        self.assertEqual(res1['phone'], norm_phone)

        # Record exists in SMSVerification
        rec = SMSVerification.objects.filter(phone_number=norm_phone).first()
        self.assertIsNotNone(rec)
        self.assertFalse(rec.is_verified)
        self.assertEqual(len(rec.code), 4)

        # 2. Resend within 60s -> rate limited
        res2 = send_checkout_sms_code(phone)
        self.assertFalse(res2['success'])
        self.assertIn('kuting', res2['error'])
        self.assertGreater(res2['cooldown'], 0)

    def test_verify_checkout_sms_code_valid_and_invalid(self):
        phone = '+998905556677'
        now = timezone.now()
        SMSVerification.objects.create(
            phone_number=phone,
            code='8844',
            is_verified=False,
            created_at=now,
            expires_at=now + timedelta(minutes=5),
            attempts=0
        )

        # Wrong code
        ok, msg = verify_checkout_sms_code(phone, '1111')
        self.assertFalse(ok)
        self.assertIn('noto\'g\'ri', msg)

        # Correct code
        ok, msg = verify_checkout_sms_code(phone, '8844')
        self.assertTrue(ok)
        self.assertIn('muvaffaqiyatli', msg)

        # Verify DB updated
        rec = SMSVerification.objects.get(phone_number=phone)
        self.assertTrue(rec.is_verified)

    def test_verify_checkout_sms_code_expired(self):
        phone = '+998909990011'
        SMSVerification.objects.create(
            phone_number=phone,
            code='1234',
            is_verified=False,
            created_at=timezone.now() - timedelta(minutes=10),
            expires_at=timezone.now() - timedelta(minutes=1),
            attempts=0
        )
        ok, msg = verify_checkout_sms_code(phone, '1234')
        self.assertFalse(ok)
        self.assertIn('muddati', msg)

    def test_get_or_create_customer_user_creates_account(self):
        phone = '+998909876543'
        user = get_or_create_customer_user(phone, name='Shohruh')
        self.assertIsNotNone(user)
        self.assertEqual(user.phone, phone)
        self.assertEqual(user.role, User.Roles.CUSTOMER)
        self.assertEqual(user.first_name, 'Shohruh')
        self.assertFalse(user.has_usable_password())

        # Second call returns same user
        user2 = get_or_create_customer_user(phone, name='Shohruh')
        self.assertEqual(user.id, user2.id)

    @patch('apps.core.sms_service.send_sms_via_eskiz')
    def test_checkout_api_endpoints_send_and_verify(self, mock_sms):
        mock_sms.return_value = {'success': True, 'status': 'sent'}
        phone = '+998934445566'

        # 1. POST /store/<subdomain>/api/checkout/send-code/
        res = self.client.post(
            f'/store/{self.store.subdomain}/api/checkout/send-code/',
            data=json.dumps({'phone': phone}),
            content_type='application/json'
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])

        # Grab generated code from DB
        verif = SMSVerification.objects.filter(phone_number=phone).first()
        self.assertIsNotNone(verif)

        # 2. POST /store/<subdomain>/api/checkout/verify-code/
        res_v = self.client.post(
            f'/store/{self.store.subdomain}/api/checkout/verify-code/',
            data=json.dumps({'phone': phone, 'code': verif.code}),
            content_type='application/json'
        )
        self.assertEqual(res_v.status_code, 200)
        self.assertTrue(res_v.json()['verified'])

    @patch('apps.storefront.views.send_telegram_notification')
    def test_checkout_rejects_unverified_phone(self, mock_tg):
        session = self.client.session
        session['cart'] = {
            f'{self.product.id}_': {
                'product_id': self.product.id,
                'name': self.product.name_uz,
                'unit_price': 150000.0,
                'quantity': 1,
                'total_price': 150000.0
            }
        }
        session.save()

        post_data = {
            'customer_name': 'Jasur',
            'customer_phone': '+998941112233',
            'delivery_method': Order.DeliveryMethods.COURIER,
            'delivery_street': 'Navoiy ko\'chasi 10',
            'payment_method': Order.PaymentMethods.CASH,
        }

        # Submitting without verification returns 200 with error
        res = self.client.post(f'/store/{self.store.subdomain}/checkout/', data=post_data)
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'SMS')
        self.assertEqual(Order.objects.filter(customer_phone='+998941112233').count(), 0)

    @patch('apps.storefront.views.send_telegram_notification')
    def test_checkout_seamless_registration_and_order_success(self, mock_tg):
        phone = '+998951234567'
        # Customer verifies phone via SMS
        SMSVerification.objects.create(
            phone_number=phone,
            code='7788',
            is_verified=True,
            expires_at=timezone.now() + timedelta(minutes=5)
        )

        session = self.client.session
        session['cart'] = {
            f'{self.product.id}_': {
                'product_id': self.product.id,
                'name': self.product.name_uz,
                'unit_price': 150000.0,
                'quantity': 2,
                'total_price': 300000.0
            }
        }
        session.save()

        post_data = {
            'customer_name': 'Botir Aliyev',
            'customer_phone': phone,
            'delivery_method': Order.DeliveryMethods.COURIER,
            'delivery_street': 'Mustaqillik shoh ko\'chasi 1',
            'payment_method': Order.PaymentMethods.CASH,
            'notes': 'Iltimos, qo\'ng\'iroq qiling'
        }

        res = self.client.post(f'/store/{self.store.subdomain}/checkout/', data=post_data)
        # Should redirect to order success page
        self.assertEqual(res.status_code, 302)
        self.assertIn('/success/', res.url)

        # 1. Order created
        order = Order.objects.filter(customer_phone=phone).first()
        self.assertIsNotNone(order)
        self.assertEqual(order.customer_name, 'Botir Aliyev')
        self.assertEqual(order.total_amount, Decimal('300000')) # Subtotal >= 200k so delivery free

        # 2. Customer user account created seamlessly
        user = User.objects.filter(phone=phone).first()
        self.assertIsNotNone(user)
        self.assertEqual(user.role, User.Roles.CUSTOMER)
        self.assertEqual(user.first_name, 'Botir Aliyev')

        # 3. Session authenticated
        self.assertEqual(int(self.client.session['_auth_user_id']), user.id)

        # 4. Customer CRM created
        crm_cust = Customer.objects.filter(store=self.store, phone=phone).first()
        self.assertIsNotNone(crm_cust)
        self.assertEqual(crm_cust.orders_count, 1)
        self.assertEqual(crm_cust.total_spent, Decimal('300000'))
        self.assertEqual(order.customer, crm_cust)

        # 5. Inventory decremented
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 8)

        # 6. Cart cleared
        self.assertEqual(self.client.session.get('cart'), {})
