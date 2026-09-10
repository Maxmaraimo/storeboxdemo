import json
from decimal import Decimal
from django.test import TestCase, Client
from apps.accounts.models import User
from apps.stores.models import Store
from apps.orders.models import Order, OrderItem
from apps.payments.models import StorePaymentSetting, PaymentTransaction


class PaymentGatewaysTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='998902223344',
            phone='+998 90 222 33 44',
            password='password123',
            role=User.Roles.MERCHANT
        )
        self.store = Store.objects.create(
            owner=self.user,
            name='Burger Store',
            subdomain='burgerstore',
            delivery_price=Decimal('15000')
        )
        self.pay_settings = StorePaymentSetting.objects.create(
            store=self.store,
            click_enabled=True,
            click_service_id='TEST_SERVICE',
            click_merchant_id='TEST_MERCHANT',
            click_secret_key='TEST_SECRET_KEY',
            payme_enabled=True,
            payme_test_mode=True,
            payme_merchant_id='TEST_PAYME',
            payme_secret_key='TEST_SECRET_KEY'
        )
        self.order = Order.objects.create(
            store=self.store,
            order_number='SB-PAY-100',
            customer_name='Алишер',
            customer_phone='+998 90 333 44 55',
            subtotal=Decimal('50000'),
            delivery_fee=Decimal('15000'),
            total_amount=Decimal('65000'),
            payment_method=Order.PaymentMethods.CLICK,
            payment_status=Order.PaymentStatuses.PENDING
        )

    def test_click_prepare_and_complete(self):
        # 1. Click Prepare
        prepare_payload = {
            'click_trans_id': '123456',
            'service_id': 'TEST_SERVICE',
            'merchant_trans_id': self.order.order_number,
            'amount': '65000.00',
            'action': '0',
            'sign_time': '2026-09-03 12:00:00',
            'sign_string': 'dummy_sign'
        }
        res = self.client.post('/payments/click/prepare/', data=prepare_payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['error'], 0)
        self.assertEqual(data['merchant_prepare_id'], self.order.id)

        # 2. Click Complete
        complete_payload = {
            'click_trans_id': '123456',
            'service_id': 'TEST_SERVICE',
            'merchant_trans_id': self.order.order_number,
            'merchant_prepare_id': self.order.id,
            'amount': '65000.00',
            'action': '1',
            'sign_time': '2026-09-03 12:01:00',
            'sign_string': 'dummy_sign',
            'error': '0'
        }
        res = self.client.post('/payments/click/complete/', data=complete_payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['error'], 0)

        # 3. Order is PAID
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, Order.PaymentStatuses.PAID)

    def test_payme_jsonrpc_workflow(self):
        # 1. CheckPerformTransaction (Amount in tiyin: 65000 * 100 = 6500000)
        check_req = {
            'method': 'CheckPerformTransaction',
            'params': {
                'amount': 6500000,
                'account': {'order_number': self.order.order_number}
            },
            'id': 101
        }
        res = self.client.post('/payments/payme/', data=json.dumps(check_req), content_type='application/json')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['result']['allow'])

        # 2. CreateTransaction
        create_req = {
            'method': 'CreateTransaction',
            'params': {
                'id': 'payme_tx_777',
                'time': 1700000000000,
                'amount': 6500000,
                'account': {'order_number': self.order.order_number}
            },
            'id': 102
        }
        res = self.client.post('/payments/payme/', data=json.dumps(create_req), content_type='application/json')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['result']['state'], 1)

        # 3. PerformTransaction
        perform_req = {
            'method': 'PerformTransaction',
            'params': {'id': 'payme_tx_777'},
            'id': 103
        }
        res = self.client.post('/payments/payme/', data=json.dumps(perform_req), content_type='application/json')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['result']['state'], 2)

        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, Order.PaymentStatuses.PAID)
        self.assertEqual(self.order.payment_method, Order.PaymentMethods.PAYME)

    def test_uzum_webhook_workflow(self):
        payload = {
            'order_number': self.order.order_number,
            'status': 'SUCCESS',
            'transactionId': 'uzum_9999'
        }
        res = self.client.post('/payments/uzum/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['status'], 'ok')

        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, Order.PaymentStatuses.PAID)
        self.assertEqual(self.order.payment_method, Order.PaymentMethods.UZUM)

    def test_simulate_payment(self):
        res = self.client.get(f'/payments/simulate/{self.order.order_number}/?gateway=CLICK')
        self.assertEqual(res.status_code, 302)
        self.assertIn('/order/SB-PAY-100/success/', res.url)

        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, Order.PaymentStatuses.PAID)
        self.assertEqual(self.order.payment_method, Order.PaymentMethods.CLICK)

    def test_duplicate_click_prepare_idempotency(self):
        # First prepare succeeds
        prepare_payload = {
            'click_trans_id': '789012',
            'service_id': 'TEST_SERVICE',
            'merchant_trans_id': self.order.order_number,
            'amount': '65000.00',
            'action': '0',
            'sign_time': '2026-09-03 12:00:00',
            'sign_string': 'dummy'
        }
        res1 = self.client.post('/payments/click/prepare/', data=prepare_payload)
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res1.json()['error'], 0)

        # Mark paid
        self.order.payment_status = Order.PaymentStatuses.PAID
        self.order.save()

        # Duplicate prepare returns error -4 (already paid)
        res2 = self.client.post('/payments/click/prepare/', data=prepare_payload)
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.json()['error'], -4)

    def test_payment_service_layer(self):
        from apps.payments.services import PaymentService, ClickProvider, PaymeProvider, UzumPayProvider

        click_p = PaymentService.get_provider(self.store, 'CLICK')
        self.assertIsInstance(click_p, ClickProvider)

        click_url = PaymentService.get_payment_url(self.order, 'CLICK')
        self.assertIn('my.click.uz', click_url)
        self.assertIn(self.order.order_number, click_url)

        payme_url = PaymentService.get_payment_url(self.order, 'PAYME')
        self.assertIn('checkout.paycom.uz', payme_url)
