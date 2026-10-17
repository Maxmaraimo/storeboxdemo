from django.test import Client, TestCase

from apps.accounts.models import User
from apps.orders.models import Order
from apps.stores.models import Store


class OrdersFilterTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="orders-filter-owner", password="SafePassword123!", role=User.Roles.MERCHANT
        )
        self.store = Store.objects.create(
            owner=self.owner, name="Orders Filter Shop", subdomain="orders-filter-shop"
        )
        other_owner = User.objects.create_user(
            username="orders-filter-other", password="SafePassword123!", role=User.Roles.MERCHANT
        )
        self.other_store = Store.objects.create(
            owner=other_owner, name="Other Shop", subdomain="orders-filter-other"
        )
        self.client = Client()
        self.client.force_login(self.owner)

    def make_order(self, number, *, store=None, **fields):
        return Order.objects.create(
            store=store or self.store,
            order_number=number,
            customer_name="Customer",
            customer_phone="+998901234567",
            total_amount=100000,
            **fields,
        )

    def test_channel_and_payment_filters_apply_before_status_counts(self):
        self.make_order(
            "FILTER-WEB-PAID", source=Order.Sources.WEB,
            payment_status=Order.PaymentStatuses.PAID, status=Order.OrderStatuses.NEW,
        )
        self.make_order(
            "FILTER-TMA-PENDING", source=Order.Sources.TELEGRAM_MINI_APP,
            payment_status=Order.PaymentStatuses.PENDING, status=Order.OrderStatuses.NEW,
        )
        self.make_order(
            "FILTER-WEB-PENDING", source=Order.Sources.WEB,
            payment_status=Order.PaymentStatuses.PENDING, status=Order.OrderStatuses.COMPLETED,
        )
        self.make_order(
            "FILTER-PRIVATE", store=self.other_store, source=Order.Sources.WEB,
            payment_status=Order.PaymentStatuses.PAID,
        )

        response = self.client.get(
            "/api/v1/orders/",
            {"store_id": self.store.pk, "source": "WEB", "payment_status": "PAID"},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["counts"]["all"], 1)
        self.assertEqual(payload["counts"]["new"], 1)
        self.assertEqual(payload["total"], 1)
        self.assertEqual([order["order_number"] for order in payload["orders"]], ["FILTER-WEB-PAID"])

        response = self.client.get(
            "/api/v1/orders/",
            {"store_id": self.store.pk, "source": "WEB", "payment_status": "PENDING", "status": "HISTORY"},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["counts"]["all"], 1)
        self.assertEqual(payload["counts"]["history"], 1)
        self.assertEqual([order["order_number"] for order in payload["orders"]], ["FILTER-WEB-PENDING"])

    def test_unknown_filter_values_do_not_change_results(self):
        self.make_order("FILTER-VALID")
        response = self.client.get(
            "/api/v1/orders/",
            {"store_id": self.store.pk, "source": "UNKNOWN", "payment_status": "UNKNOWN"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["total"], 1)
