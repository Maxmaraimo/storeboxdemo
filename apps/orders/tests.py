from decimal import Decimal
from unittest.mock import patch
from django.test import TestCase, Client
from django.utils import timezone
from apps.accounts.models import User
from apps.stores.models import Store
from apps.catalog.models import Category, Product
from apps.orders.models import Order, OrderItem, Customer, PromoCode
from apps.payments.models import StorePaymentSetting, PaymentTransaction


class OrderWorkflowEndToEndTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.merchant = User.objects.create_user(
            username='998905556677',
            phone='+998 90 555 66 77',
            password='password123',
            role=User.Roles.MERCHANT
        )
        self.store = Store.objects.create(
            owner=self.merchant,
            name='Burger Lab',
            subdomain='burgerlab',
            phone='+998 90 123 45 67',
            address='Tashkent, Chilanzar 1',
            delivery_price=Decimal('15000'),
            free_delivery_threshold=Decimal('150000')
        )
        self.category = Category.objects.create(
            store=self.store,
            name_uz='Burgerlar',
            name_ru='Бургеры',
            slug='burgers',
            is_active=True
        )
        self.product = Product.objects.create(
            store=self.store,
            category=self.category,
            name_uz='Double Cheeseburger',
            name_ru='Двойной Чизбургер',
            slug='double-cheeseburger',
            price=Decimal('45000'),
            is_active=True,
            track_stock=True,
            stock=10
        )
        StorePaymentSetting.objects.create(
            store=self.store,
            click_enabled=True,
            payme_enabled=True,
            uzum_enabled=True
        )

    def test_storefront_catalog_rendering(self):
        res = self.client.get(f'/store/{self.store.subdomain}/')
        self.assertEqual(res.status_code, 200)
        self.assertIn('Double Cheeseburger', res.content.decode())

    @patch('apps.storefront.views.send_telegram_notification')
    def test_storefront_checkout_success(self, mock_tg):
        mock_tg.return_value = (True, 'ok')
        # Setup session cart
        session = self.client.session
        session['cart'] = {
            f'{self.product.id}_': {
                'product_id': self.product.id,
                'variation_id': None,
                'name': self.product.name_uz,
                'variation_name': '',
                'unit_price': float(self.product.price),
                'quantity': 2,
                'total_price': float(self.product.price * 2)
            }
        }
        session.save()

        post_data = {
            'customer_name': 'Jasur Bek',
            'customer_phone': '+998 90 777 88 99',
            'delivery_method': Order.DeliveryMethods.COURIER,
            'delivery_city': 'Tashkent',
            'delivery_street': 'Amir Temur 45',
            'delivery_entrance': '2',
            'delivery_floor': '4',
            'delivery_apartment': '18',
            'payment_method': Order.PaymentMethods.CLICK,
            'notes': 'Iltimos, tezroq yetkazing'
        }

        res = self.client.post(f'/store/{self.store.subdomain}/checkout/', data=post_data)
        self.assertEqual(res.status_code, 302)

        # Verify order created in DB
        order = Order.objects.filter(store=self.store, customer_phone='+998 90 777 88 99').first()
        self.assertIsNotNone(order)
        self.assertEqual(order.subtotal, Decimal('90000'))
        self.assertEqual(order.delivery_fee, Decimal('15000'))
        self.assertEqual(order.total_amount, Decimal('105000'))
        self.assertEqual(order.payment_method, Order.PaymentMethods.CLICK)
        self.assertEqual(order.status, Order.OrderStatuses.NEW)
        self.assertEqual(order.payment_status, Order.PaymentStatuses.PENDING)

        # Verify stock decremented
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 8)

        # Verify Customer record
        customer = Customer.objects.filter(store=self.store, phone='+998 90 777 88 99').first()
        self.assertIsNotNone(customer)
        self.assertEqual(customer.orders_count, 1)
        self.assertEqual(customer.total_spent, Decimal('105000'))

    def test_checkout_with_promocode(self):
        promo = PromoCode.objects.create(
            store=self.store,
            code='DISCOUNT10',
            discount_type=PromoCode.DiscountTypes.PERCENT,
            discount_value=Decimal('10'),
            min_order_amount=Decimal('30000'),
            is_active=True
        )

        session = self.client.session
        session['cart'] = {
            f'{self.product.id}_': {
                'product_id': self.product.id,
                'name': self.product.name_uz,
                'unit_price': 50000.0,
                'quantity': 1,
                'total_price': 50000.0
            }
        }
        session.save()

        with patch('apps.storefront.views.send_telegram_notification'):
            post_data = {
                'customer_name': 'Aziz',
                'customer_phone': '+998 91 123 45 67',
                'delivery_method': Order.DeliveryMethods.PICKUP,
                'payment_method': Order.PaymentMethods.CASH,
                'promo_code': 'DISCOUNT10'
            }
            res = self.client.post(f'/store/{self.store.subdomain}/checkout/', data=post_data)
            self.assertEqual(res.status_code, 302)

        order = Order.objects.filter(store=self.store, customer_phone='+998 91 123 45 67').first()
        self.assertIsNotNone(order)
        self.assertEqual(order.discount_amount, Decimal('5000'))  # 10% of 50000
        self.assertEqual(order.total_amount, Decimal('45000'))

    def test_order_status_lifecycle_and_simulation(self):
        order = Order.objects.create(
            store=self.store,
            order_number='SB-CYCLE-001',
            customer_name='Sanjar',
            customer_phone='+998 93 111 22 33',
            subtotal=Decimal('45000'),
            delivery_fee=Decimal('15000'),
            total_amount=Decimal('60000'),
            payment_method=Order.PaymentMethods.CLICK,
            payment_status=Order.PaymentStatuses.PENDING,
            status=Order.OrderStatuses.NEW
        )

        # Order lifecycle transition
        order.status = Order.OrderStatuses.PROCESSING
        order.save()
        self.assertEqual(Order.objects.get(id=order.id).status, Order.OrderStatuses.PROCESSING)

        order.status = Order.OrderStatuses.READY
        order.save()
        self.assertEqual(Order.objects.get(id=order.id).status, Order.OrderStatuses.READY)

        order.status = Order.OrderStatuses.IN_DELIVERY
        order.save()
        self.assertEqual(Order.objects.get(id=order.id).status, Order.OrderStatuses.IN_DELIVERY)

        order.status = Order.OrderStatuses.COMPLETED
        order.save()
        self.assertEqual(Order.objects.get(id=order.id).status, Order.OrderStatuses.COMPLETED)

        # Payment simulation
        sim_res = self.client.get(f'/payments/simulate/{order.order_number}/?gateway=CLICK')
        self.assertEqual(sim_res.status_code, 302)

        order.refresh_from_db()
        self.assertEqual(order.payment_status, Order.PaymentStatuses.PAID)
        tx = PaymentTransaction.objects.filter(order=order).first()
        self.assertIsNotNone(tx)
        self.assertEqual(tx.state, PaymentTransaction.States.COMPLETED)

    def test_dashboard_notifications_and_badges_real_counts(self):
        from apps.orders.models import ChatMessage
        self.client.force_login(self.merchant)

        # 1. Initially 0 new orders and 0 unread chats
        res = self.client.get('/api/v1/dashboard/notifications/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['new_orders_count'], 0)
        self.assertEqual(data['unread_chats_count'], 0)
        self.assertEqual(data['total_unread'], 0)
        self.assertEqual(len(data['notifications']), 0)

        # 2. Create 1 new order and 1 customer chat message
        order = Order.objects.create(
            store=self.store,
            order_number='NOTIF-ORD-01',
            customer_name='Dilshod',
            customer_phone='+998901112233',
            subtotal=Decimal('50000'),
            total_amount=Decimal('50000'),
            status=Order.OrderStatuses.NEW
        )
        msg = ChatMessage.objects.create(
            store=self.store,
            customer_phone='+998901112233',
            customer_name='Dilshod',
            sender=ChatMessage.Senders.CUSTOMER,
            message='Salom, yetkazib berish qancha vaqt oladi?',
            is_read=False
        )

        res2 = self.client.get('/api/v1/dashboard/notifications/')
        self.assertEqual(res2.status_code, 200)
        data2 = res2.json()
        self.assertEqual(data2['new_orders_count'], 1)
        self.assertEqual(data2['unread_chats_count'], 1)
        self.assertEqual(data2['total_unread'], 2)
        self.assertEqual(len(data2['notifications']), 2)

        # 3. Mark all notifications/chats as read
        mark_res = self.client.post('/api/v1/dashboard/notifications/mark-read/')
        self.assertEqual(mark_res.status_code, 200)

        res3 = self.client.get('/api/v1/dashboard/notifications/')
        data3 = res3.json()
        self.assertEqual(data3['unread_chats_count'], 0)
        self.assertEqual(data3['new_orders_count'], 1)

        # 4. Process the order
        order.status = Order.OrderStatuses.PROCESSING
        order.save()

        res4 = self.client.get('/api/v1/dashboard/notifications/')
        data4 = res4.json()
        self.assertEqual(data4['new_orders_count'], 0)
        self.assertEqual(data4['total_unread'], 0)

