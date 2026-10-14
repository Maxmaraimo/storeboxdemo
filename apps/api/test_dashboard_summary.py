from datetime import timedelta

from django.test import Client, TestCase
from django.utils import timezone

from apps.accounts.models import User
from apps.orders.models import Order
from apps.stores.models import Branch, Store


class DashboardSummaryBlocksTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="dashboard-owner", password="SafePassword123!", role=User.Roles.MERCHANT
        )
        self.store = Store.objects.create(
            owner=self.owner, name="Dashboard Shop", subdomain="dashboard-shop"
        )
        self.branch = Branch.objects.create(
            store=self.store, name="Main", address="Tashkent", latitude=41.31, longitude=69.28
        )
        other_owner = User.objects.create_user(
            username="dashboard-other", password="SafePassword123!", role=User.Roles.MERCHANT
        )
        self.other_store = Store.objects.create(
            owner=other_owner, name="Other Shop", subdomain="dashboard-other"
        )
        Branch.objects.create(
            store=self.other_store, name="Private branch", address="Elsewhere"
        )
        self.client = Client()
        self.client.force_login(self.owner)

    def make_order(self, number, *, store=None, **fields):
        return Order.objects.create(
            store=store or self.store,
            branch=fields.pop("branch", self.branch if store is None else None),
            order_number=number,
            customer_name=fields.pop("customer_name", "Jasur"),
            customer_phone=fields.pop("customer_phone", "+998901234567"),
            total_amount=fields.pop("total_amount", 100000),
            **fields,
        )

    def test_new_dashboard_blocks_use_current_store_and_selected_period(self):
        now = timezone.localtime()
        self.make_order(
            "DASH-NEW", source=Order.Sources.WEB,
            status=Order.OrderStatuses.NEW, delivery_lat=41.32, delivery_lng=69.29,
        )
        self.make_order(
            "DASH-DONE", source=Order.Sources.TELEGRAM_MINI_APP,
            status=Order.OrderStatuses.COMPLETED,
        )
        self.make_order(
            "DASH-CANCELLED", source=Order.Sources.INSTAGRAM,
            status=Order.OrderStatuses.CANCELLED, customer_name="Other buyer",
            customer_phone="+998901111111",
        )
        old_order = self.make_order("DASH-OLD", source=Order.Sources.WEB)
        Order.objects.filter(pk=old_order.pk).update(created_at=now - timedelta(days=2))
        self.make_order("DASH-PRIVATE", store=self.other_store, source=Order.Sources.WEB)

        response = self.client.get(
            "/api/v1/dashboard/summary/", {"period": "today", "store_id": self.store.pk}
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        metrics = payload["metrics"]
        self.assertEqual((metrics["web_cnt"], metrics["tma_cnt"], metrics["instagram_cnt"]), (1, 1, 1))

        hour = timezone.localtime().hour
        hourly = payload["charts"]["hourly_orders"]
        self.assertEqual(len(hourly["labels"]), 24)
        self.assertEqual((hourly["new"][hour], hourly["completed"][hour], hourly["cancelled"][hour]), (1, 1, 1))
        self.assertEqual(sum(hourly["new"]), 1)

        self.assertEqual(len(payload["top_customers"]), 1)
        self.assertEqual(payload["top_customers"][0]["customer_phone"], "+998901234567")
        self.assertEqual(payload["top_customers"][0]["orders_count"], 2)
        self.assertEqual([order["num"] for order in payload["map_orders"]], ["DASH-NEW"])
        self.assertEqual([branch["name"] for branch in payload["map_branches"]], ["Main"])

    def test_branch_filter_limits_map_and_order_statistics(self):
        second_branch = Branch.objects.create(
            store=self.store, name="Second", address="Samarkand", latitude=39.65, longitude=66.97
        )
        self.make_order("DASH-MAIN", source=Order.Sources.WEB, status=Order.OrderStatuses.NEW)
        self.make_order(
            "DASH-SECOND", branch=second_branch,
            source=Order.Sources.TELEGRAM_MINI_APP, status=Order.OrderStatuses.COMPLETED,
        )

        response = self.client.get(
            "/api/v1/dashboard/summary/",
            {"period": "today", "store_id": self.store.pk, "branch": second_branch.pk},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["metrics"]["web_cnt"], 0)
        self.assertEqual(payload["metrics"]["tma_cnt"], 1)
        self.assertEqual([branch["name"] for branch in payload["map_branches"]], ["Second"])
        self.assertEqual(payload["top_customers"][0]["orders_count"], 1)

    def test_empty_period_does_not_show_historical_orders(self):
        old_order = self.make_order("DASH-HISTORICAL", source=Order.Sources.WEB)
        Order.objects.filter(pk=old_order.pk).update(
            created_at=timezone.localtime() - timedelta(days=2)
        )

        response = self.client.get(
            "/api/v1/dashboard/summary/", {"period": "today", "store_id": self.store.pk}
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["metrics"]["orders_count"], 0)
        self.assertEqual(payload["metrics"]["web_cnt"], 0)
        self.assertEqual(payload["top_customers"], [])
        self.assertEqual(payload["map_orders"], [])
