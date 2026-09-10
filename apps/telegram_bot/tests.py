import json
from decimal import Decimal
from unittest.mock import patch, MagicMock
from django.test import TestCase, Client
from apps.accounts.models import User
from apps.stores.models import Store
from apps.orders.models import Order, OrderItem, Customer, ChatMessage
from apps.telegram_bot.services import (
    get_bot_info,
    send_telegram_notification,
    format_order_telegram_message,
    process_telegram_update
)


class TelegramBotServicesTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='998901112233',
            phone='+998 90 111 22 33',
            password='password123',
            role=User.Roles.MERCHANT
        )
        self.store = Store.objects.create(
            owner=self.user,
            name='Test Shop',
            subdomain='testshop',
            telegram_bot_token='123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
            telegram_chat_id='987654321',
            phone='+998 90 999 88 77',
            address='Tashkent, Amir Temur 1'
        )
        self.order = Order.objects.create(
            store=self.store,
            order_number='TG-ORD-101',
            customer_name='Farrukh',
            customer_phone='+998901234567',
            subtotal=Decimal('40000'),
            delivery_fee=Decimal('10000'),
            total_amount=Decimal('50000'),
            payment_method=Order.PaymentMethods.CASH,
            payment_status=Order.PaymentStatuses.PENDING,
            delivery_address='Chilanzar 12'
        )
        OrderItem.objects.create(
            order=self.order,
            product_name='Cheeseburger',
            unit_price=Decimal('40000'),
            quantity=1,
            total_price=Decimal('40000')
        )

    def test_get_bot_info_empty(self):
        success, msg = get_bot_info('')
        self.assertFalse(success)

    @patch('requests.get')
    def test_get_bot_info_success(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            'ok': True,
            'result': {'id': 123456, 'is_bot': True, 'first_name': 'TestShopBot', 'username': 'testshop_bot'}
        }
        mock_get.return_value = mock_resp

        success, data = get_bot_info('123456:ABC')
        self.assertTrue(success)
        self.assertEqual(data['username'], 'testshop_bot')

    def test_send_telegram_notification_missing_credentials(self):
        empty_store = Store.objects.create(owner=self.user, name='Empty', subdomain='empty')
        success, msg = send_telegram_notification(empty_store, 'Hello')
        self.assertFalse(success)

    @patch('requests.post')
    def test_send_telegram_notification_success(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {'ok': True, 'result': {'message_id': 55}}
        mock_post.return_value = mock_resp

        success, msg = send_telegram_notification(self.store, 'Test Alert')
        self.assertTrue(success)
        self.assertTrue(mock_post.called)
        call_kwargs = mock_post.call_args[1]
        self.assertEqual(call_kwargs['json']['chat_id'], '987654321')
        self.assertIn('Test Alert', call_kwargs['json']['text'])

    def test_format_order_telegram_message(self):
        msg = format_order_telegram_message(self.order)
        self.assertIn('TG-ORD-101', msg)
        self.assertIn('Farrukh', msg)
        self.assertIn('+998901234567', msg)
        self.assertIn('Cheeseburger', msg)
        self.assertIn('50,000 UZS', msg)
        self.assertIn('Chilanzar 12', msg)

    @patch('apps.telegram_bot.services.send_telegram_notification')
    def test_process_telegram_start_command(self, mock_send):
        update = {
            'update_id': 1001,
            'message': {
                'message_id': 1,
                'chat': {'id': 987654321},
                'from': {'id': 987654321, 'first_name': 'Vali'},
                'text': '/start'
            }
        }
        res = process_telegram_update(self.store, update)
        self.assertTrue(res)
        self.assertTrue(mock_send.called)
        call_args = mock_send.call_args
        self.assertIn('Vali', call_args[0][1])

    @patch('apps.telegram_bot.services.send_telegram_notification')
    def test_process_telegram_about_command(self, mock_send):
        update = {
            'update_id': 1002,
            'message': {
                'message_id': 2,
                'chat': {'id': 987654321},
                'text': '/about'
            }
        }
        res = process_telegram_update(self.store, update)
        self.assertTrue(res)
        self.assertTrue(mock_send.called)
        sent_text = mock_send.call_args[0][1]
        self.assertIn('Tashkent, Amir Temur 1', sent_text)

    @patch('apps.telegram_bot.services.send_telegram_notification')
    def test_process_telegram_contact_share(self, mock_send):
        update = {
            'update_id': 1003,
            'message': {
                'message_id': 3,
                'chat': {'id': 555666777},
                'from': {'id': 555666777, 'first_name': 'Bobur'},
                'contact': {
                    'phone_number': '998931112233',
                    'first_name': 'Bobur'
                }
            }
        }
        res = process_telegram_update(self.store, update)
        self.assertTrue(res)
        cust = Customer.objects.filter(store=self.store, telegram_chat_id='555666777').first()
        self.assertIsNotNone(cust)
        self.assertIn('998931112233', cust.phone)

    @patch('apps.telegram_bot.services.send_telegram_notification')
    def test_process_telegram_text_chat(self, mock_send):
        update = {
            'update_id': 1004,
            'message': {
                'message_id': 4,
                'chat': {'id': 333222111},
                'from': {'id': 333222111, 'first_name': 'Jasur'},
                'text': 'Buyurtmam qachon yetkaziladi?'
            }
        }
        res = process_telegram_update(self.store, update)
        self.assertTrue(res)
        chat_msg = ChatMessage.objects.filter(store=self.store, telegram_chat_id='333222111').first()
        self.assertIsNotNone(chat_msg)
        self.assertEqual(chat_msg.message, 'Buyurtmam qachon yetkaziladi?')
        self.assertEqual(chat_msg.sender, ChatMessage.Senders.CUSTOMER)

    @patch('requests.post')
    @patch('apps.telegram_bot.services.send_telegram_notification')
    def test_process_telegram_callback_query(self, mock_send, mock_post):
        update = {
            'update_id': 1005,
            'callback_query': {
                'id': 'cq_123',
                'from': {'id': 987654321},
                'message': {'chat': {'id': 987654321}},
                'data': 'my_orders'
            }
        }
        res = process_telegram_update(self.store, update)
        self.assertTrue(res)
        self.assertTrue(mock_send.called)
        sent_text = mock_send.call_args[0][1]
        self.assertIn('TG-ORD-101', sent_text)

    def test_telegram_webhook_http_endpoint(self):
        # GET request returns 200 active
        res_get = self.client.get(f'/telegram/webhook/{self.store.subdomain}/')
        self.assertEqual(res_get.status_code, 200)
        self.assertIn('Telegram Webhook Endpoint Active', res_get.content.decode())

        # POST with valid update returns status ok
        with patch('apps.telegram_bot.services.process_telegram_update') as mock_process:
            mock_process.return_value = True
            update_payload = {'update_id': 2001, 'message': {'chat': {'id': 123}, 'text': '/start'}}
            res_post = self.client.post(
                f'/telegram/webhook/{self.store.subdomain}/',
                data=json.dumps(update_payload),
                content_type='application/json'
            )
            self.assertEqual(res_post.status_code, 200)
            self.assertEqual(res_post.json()['status'], 'ok')
            self.assertTrue(mock_process.called)

        # Unknown subdomain returns 404
        res_404 = self.client.get('/telegram/webhook/nonexistent-store/')
        self.assertEqual(res_404.status_code, 404)
