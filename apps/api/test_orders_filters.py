from django.test import Client, TestCase

from apps.accounts.models import User
from apps.orders.models import Order, StoreStaff
from apps.stores.models import Branch, Store


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

    def test_multiple_methods_and_courier_apply_before_counts_and_pagination(self):
        branch = Branch.objects.create(store=self.store, name="Main", address="Test")
        courier = StoreStaff.objects.create(store=self.store, name="Courier", is_courier=True)
        for index in range(12):
            self.make_order(
                f"METHOD-{index}", branch=branch, courier=courier,
                payment_method="CASH" if index % 2 else "CLICK", delivery_method="COURIER",
            )
        self.make_order("OTHER-METHOD", branch=branch, courier=courier, payment_method="PAYME")
        self.make_order("OTHER-DELIVERY", branch=branch, courier=courier, payment_method="CASH", delivery_method="PICKUP")
        self.make_order("OTHER-COURIER", branch=branch, payment_method="CASH")
        self.make_order("OTHER-STORE", store=self.other_store, payment_method="CASH")

        response = self.client.get("/api/v1/orders/", {
            "store_id": self.store.pk, "branch": branch.pk, "courier_id": courier.pk,
            "payment_method": "cash,CLICK,unknown", "delivery_method": "COURIER",
            "page": 2, "page_size": 10,
        })
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["total"], 12)
        self.assertEqual(payload["counts"]["all"], 12)
        self.assertEqual(payload["counts"]["new"], 12)
        self.assertEqual(payload["total_pages"], 2)
        self.assertEqual(len(payload["orders"]), 2)
        self.assertTrue(all(row["order_number"].startswith("METHOD-") for row in payload["orders"]))

    def test_repeated_delivery_choices_match_either_method(self):
        self.make_order("COURIER-CASH", payment_method="CASH", delivery_method="COURIER")
        self.make_order("PICKUP-CASH", payment_method="CASH", delivery_method="PICKUP")
        self.make_order("PICKUP-CLICK", payment_method="CLICK", delivery_method="PICKUP")
        response = self.client.get("/api/v1/orders/", {
            "store_id": self.store.pk, "payment_method": "CASH", "delivery_method": ["COURIER", "PICKUP"],
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["total"], 2)

    def test_unassigned_and_foreign_courier_remain_store_scoped(self):
        courier = StoreStaff.objects.create(store=self.other_store, name="Private courier", is_courier=True)
        self.make_order("UNASSIGNED")
        self.make_order("FOREIGN-ASSIGNED", store=self.other_store, courier=courier)
        result = self.client.get("/api/v1/orders/", {"store_id": self.store.pk, "courier_id": "unassigned"})
        self.assertEqual(result.status_code, 200)
        self.assertEqual([row["order_number"] for row in result.json()["orders"]], ["UNASSIGNED"])
        result = self.client.get("/api/v1/orders/", {"store_id": self.store.pk, "courier_id": courier.pk})
        self.assertEqual(result.json()["total"], 0)

    def test_new_filters_cannot_override_staff_branch_restriction(self):
        branch = Branch.objects.create(store=self.store, name="Allowed", address="Test")
        other_branch = Branch.objects.create(store=self.store, name="Other", address="Test")
        staff_user = User.objects.create_user(username="branch-filter-staff", role=User.Roles.MERCHANT)
        StoreStaff.objects.create(store=self.store, user=staff_user, name="Staff", branch=branch)
        self.make_order("ALLOWED", branch=branch, payment_method="CASH")
        self.make_order("HIDDEN", branch=other_branch, payment_method="CASH")
        self.client.force_login(staff_user)
        response = self.client.get("/api/v1/orders/", {
            "store_id": self.store.pk, "branch": other_branch.pk,
            "payment_method": "CASH", "delivery_method": "COURIER", "courier_id": "unassigned",
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual([row["order_number"] for row in response.json()["orders"]], ["ALLOWED"])
        self.assertTrue(response.json()["is_branch_restricted"])

    def test_invalid_new_filters_are_ignored(self):
        self.make_order("VALID")
        response = self.client.get("/api/v1/orders/", {
            "store_id": self.store.pk, "payment_method": "UNKNOWN", "delivery_method": "UNKNOWN", "courier_id": "bad",
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["total"], 1)
