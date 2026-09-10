from decimal import Decimal
from django.test import TestCase, Client
from django.urls import reverse
from apps.accounts.models import User
from apps.stores.models import Store, Branch
from apps.catalog.models import Category, Product, ProductVariation
from apps.orders.models import Order, OrderItem, PromoCode, Customer, ChatMessage
from apps.payments.models import StorePaymentSetting, PaymentTransaction


class MultiTenantAndCatalogTests(TestCase):
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
            name='Test Lavash',
            subdomain='testlavash',
            delivery_price=Decimal('20000'),
            free_delivery_threshold=Decimal('100000')
        )
        self.payment_setting = StorePaymentSetting.objects.create(
            store=self.store,
            click_enabled=True,
            payme_enabled=True,
            payme_test_mode=True
        )
        self.cat = Category.objects.create(
            store=self.store,
            name_ru='Лаваши',
            name_uz='Lavashlar',
            slug='lavash'
        )
        self.product = Product.objects.create(
            store=self.store,
            category=self.cat,
            name_ru='Лаваш Мясной',
            name_uz='Goshtli Lavash',
            slug='lavash-meat',
            price=Decimal('40000'),
            stock=10,
            track_stock=True
        )
        self.variation = ProductVariation.objects.create(
            product=self.product,
            name_ru='Большой (Big)',
            name_uz='Katta',
            price=Decimal('48000'),
            stock=5
        )
        self.promo = PromoCode.objects.create(
            store=self.store,
            code='TEST10',
            discount_type=PromoCode.DiscountTypes.PERCENT,
            discount_value=Decimal('10'),
            min_order_amount=Decimal('50000'),
            max_uses=100
        )

    def test_subdomain_routing(self):
        # 1. Platform root
        res = self.client.get('/', HTTP_HOST='platform.uz')
        self.assertEqual(res.status_code, 200)

        # 2. Store subdomain
        res = self.client.get('/', HTTP_HOST='testlavash.platform.uz')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'Test Lavash')

        # 3. Path fallback /store/<subdomain>/
        res = self.client.get('/store/testlavash/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'Test Lavash')

        # 4. Unknown subdomain -> 404
        res = self.client.get('/', HTTP_HOST='unknownstore.platform.uz')
        self.assertEqual(res.status_code, 404)

    def test_promo_code_calculation(self):
        # Below min order
        valid, msg = self.promo.is_valid(40000)
        self.assertFalse(valid)

        # Valid order
        valid, msg = self.promo.is_valid(100000)
        self.assertTrue(valid)
        discount = self.promo.calculate_discount(100000)
        self.assertEqual(discount, Decimal('10000'))

    def test_cart_and_checkout_stock_decrement(self):
        # 1. Add variation to cart
        self.client.get('/store/testlavash/')
        res = self.client.post('/cart/add/', data={
            'product_id': self.product.id,
            'variation_id': self.variation.id,
            'quantity': 2
        }, content_type='application/json', HTTP_HOST='testlavash.platform.uz')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['cart_count'], 2)

        # 2. Checkout
        initial_stock = self.variation.stock
        res = self.client.post('/checkout/', data={
            'customer_name': 'Тестовый Клиент',
            'customer_phone': '+998 90 999 88 77',
            'delivery_method': 'COURIER',
            'delivery_city': 'Ташкент',
            'delivery_address': 'ул. Амира Темура, 5',
            'payment_method': 'PAYME',
        }, HTTP_HOST='testlavash.platform.uz')
        self.assertEqual(res.status_code, 302)

        # 3. Verify order created
        order = Order.objects.filter(customer_phone='+998 90 999 88 77').first()
        self.assertIsNotNone(order)
        self.assertEqual(order.items.count(), 1)
        self.assertEqual(order.payment_status, Order.PaymentStatuses.PENDING)

        # 4. Verify inventory decremented
        self.variation.refresh_from_db()
        self.assertEqual(self.variation.stock, initial_stock - 2)

    def test_payment_simulation(self):
        order = Order.objects.create(
            store=self.store,
            order_number='SB-TEST-999',
            customer_name='Тест Оплаты',
            customer_phone='+998 90 000 00 00',
            subtotal=Decimal('48000'),
            total_amount=Decimal('48000'),
            payment_method=Order.PaymentMethods.PAYME,
            payment_status=Order.PaymentStatuses.PENDING
        )

        res = self.client.get(f'/payments/simulate/{order.order_number}/?gateway=PAYME')
        self.assertEqual(res.status_code, 302)

        order.refresh_from_db()
        self.assertEqual(order.payment_status, Order.PaymentStatuses.PAID)
        self.assertTrue(PaymentTransaction.objects.filter(order=order, state=PaymentTransaction.States.COMPLETED).exists())

    def test_check_subdomain_api(self):
        res = self.client.get('/dashboard/api/check-subdomain/?subdomain=testlavash')
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.json()['available'])

        res = self.client.get('/dashboard/api/check-subdomain/?subdomain=brandnewstore')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()['available'])

    def test_customer_bonus_accrual(self):
        self.client.post('/cart/add/', data={
            'product_id': self.product.id,
            'quantity': 1
        }, content_type='application/json', HTTP_HOST='testlavash.platform.uz')

        self.client.post('/checkout/', data={
            'customer_name': 'Бонусный Клиент',
            'customer_phone': '+998 90 777 77 77',
            'delivery_method': 'PICKUP',
            'payment_method': 'CASH',
        }, HTTP_HOST='testlavash.platform.uz')

        cust = Customer.objects.filter(phone='+998 90 777 77 77').first()
        self.assertIsNotNone(cust)
        self.assertEqual(cust.orders_count, 1)
        self.assertGreater(cust.bonus_balance, 0)

    def test_authenticated_dashboard_and_ajax_apis(self):
        # Login merchant
        self.client.force_login(self.user)

        # 1. Dashboard Home
        res = self.client.get('/dashboard/')
        self.assertEqual(res.status_code, 200)

        # 2. Toggle payment API
        res = self.client.post('/dashboard/api/toggle-payment/', {'gateway': 'click', 'enabled': 'false'})
        self.assertEqual(res.status_code, 200)
        self.payment_setting.refresh_from_db()
        self.assertFalse(self.payment_setting.click_enabled)

        # 3. Create branch API
        res = self.client.post('/dashboard/api/branch-action/', {
            'action': 'create',
            'name': 'Chilonzor Filiali',
            'address': 'Toshkent, Chilonzor',
            'lat': 41.2858,
            'lng': 69.2035
        })
        self.assertEqual(res.status_code, 200)
        self.assertTrue(Branch.objects.filter(store=self.store, name='Chilonzor Filiali').exists())

        # 4. Send chat message API
        res = self.client.post('/dashboard/api/send-chat/', {
            'phone': '+998901234567',
            'message': 'Assalomu alaykum!'
        })
        self.assertEqual(res.status_code, 200)
        self.assertTrue(ChatMessage.objects.filter(store=self.store, message='Assalomu alaykum!').exists())

        # 5. Orders CSV export
        res = self.client.get('/dashboard/orders/export/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'text/csv; charset=utf-8')

    def test_landing_page_multilingual_and_robosell_sections(self):
        # 1. Uzbek landing page
        res_uz = self.client.get('/?lang=uz')
        self.assertEqual(res_uz.status_code, 200)
        self.assertContains(res_uz, "15 daqiqada")
        self.assertContains(res_uz, "onlayn biznesingizni boshlang")
        self.assertContains(res_uz, "heroMockupWindow")
        self.assertContains(res_uz, "StoreBox Afzalliklari")
        self.assertContains(res_uz, "Moslashuvchan dizayn")
        self.assertContains(res_uz, "StoreBox Restoran")
        self.assertContains(res_uz, "StoreBox Do'kon")
        self.assertContains(res_uz, "StoreBox qanday ishlaydi?")
        self.assertContains(res_uz, "Yo'riqnoma")
        self.assertContains(res_uz, "STOREBOX BILAN SIZ ENG MINIMAL YO'QOTISHLARNI KO'RIB CHIQAYLIK")
        self.assertContains(res_uz, "+998(78) 113 82 12")

        # 2. Russian landing page (Verify full Russian translation)
        res_ru = self.client.get('/?lang=ru')
        self.assertEqual(res_ru.status_code, 200)
        self.assertContains(res_ru, "За 15 минут")
        self.assertContains(res_ru, "запустите онлайн-бизнес")
        self.assertContains(res_ru, "Преимущества StoreBox")
        self.assertContains(res_ru, "Адаптивный дизайн")
        self.assertContains(res_ru, "StoreBox Ресторан")
        self.assertContains(res_ru, "StoreBox Магазин")
        self.assertContains(res_ru, "Как работает StoreBox?")
        self.assertContains(res_ru, "Инструкция")
        self.assertContains(res_ru, "ДАВАЙТЕ ОЦЕНИМ МИНИМАЛЬНУЮ ЭКОНОМИЮ СО STOREBOX")
        self.assertContains(res_ru, "Остались вопросы?")

        # 3. English landing page (Verify full English translation)
        res_en = self.client.get('/?lang=en')
        self.assertEqual(res_en.status_code, 200)
        self.assertContains(res_en, "In 15 minutes")
        self.assertContains(res_en, "launch your online business")
        self.assertContains(res_en, "StoreBox Advantages")
        self.assertContains(res_en, "Adaptive Design")
        self.assertContains(res_en, "StoreBox Restaurant")
        self.assertContains(res_en, "StoreBox Retail")
        self.assertContains(res_en, "How StoreBox Works")
        self.assertContains(res_en, "Guide")
        self.assertContains(res_en, "MINIMAL EXPENDITURE SAVINGS WITH STOREBOX")
        self.assertContains(res_en, "Still have questions?")

    def test_lead_inquiry_api(self):
        from apps.core.models import LeadInquiry

        # 1. Invalid request - empty name
        res = self.client.post('/api/lead/', data={
            'name': '',
            'phone': '+998901234567'
        }, content_type='application/json')
        self.assertEqual(res.status_code, 400)
        self.assertFalse(res.json()['success'])

        # 2. Invalid request - invalid phone
        res = self.client.post('/api/lead/', data={
            'name': 'Otabek',
            'phone': '123'
        }, content_type='application/json')
        self.assertEqual(res.status_code, 400)
        self.assertFalse(res.json()['success'])

        # 3. Valid request (JSON)
        res = self.client.post('/api/lead/', data={
            'name': 'Shavkat Rahimov',
            'company': 'Silk Road Tech',
            'phone': '+998 90 777 88 99',
            'message': 'Bizga do\'kon va Telegram bot kerak'
        }, content_type='application/json')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertIn('lead_id', data)

        lead = LeadInquiry.objects.get(id=data['lead_id'])
        self.assertEqual(lead.name, 'Shavkat Rahimov')
        self.assertEqual(lead.phone, '+998907778899')
        self.assertEqual(lead.company, 'Silk Road Tech')
        self.assertEqual(lead.status, LeadInquiry.Statuses.NEW)

        # 4. Valid request (Form data)
        res = self.client.post('/platform/api/lead/', data={
            'name': 'Dilnoza Karimova',
            'company': 'Beauty Bar',
            'phone': '998931112233',
            'message': 'Narxlar haqida savol'
        })
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()['success'])
        self.assertTrue(LeadInquiry.objects.filter(name='Dilnoza Karimova').exists())

