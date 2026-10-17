from django.test import Client, TestCase
from django.utils import timezone

from apps.accounts.models import User
from apps.catalog.models import Category, Product
from apps.orders.models import Order
from apps.stores.models import Branch, Store


class TablePaginationTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="pagination-owner", role=User.Roles.MERCHANT)
        self.store = Store.objects.create(owner=self.owner, name="Pagination", subdomain="pagination-test")
        other_owner = User.objects.create_user(username="pagination-other", role=User.Roles.MERCHANT)
        self.other_store = Store.objects.create(owner=other_owner, name="Other", subdomain="pagination-other")
        self.client = Client()
        self.client.force_login(self.owner)

    def get_list(self, kind, **params):
        response = self.client.get(f"/api/v1/{kind}/", {"store_id": self.store.pk, **params})
        self.assertEqual(response.status_code, 200)
        return response.json()

    def make_orders(self, count, **fields):
        store = fields.pop("store", self.store)
        offset = Order.objects.filter(store=store).count()
        orders = Order.objects.bulk_create([
            Order(store=store, order_number=f"PAGE-{store.pk}-{offset + index:03}", customer_name="Customer",
                  customer_phone="+998901234567", total_amount=10000, **fields)
            for index in range(count)
        ])
        # Equal timestamps make the deterministic id tiebreaker observable.
        Order.objects.filter(id__in=[order.id for order in orders]).update(created_at=timezone.now())
        return orders

    def make_products(self, count, **fields):
        store = fields.pop("store", self.store)
        return Product.objects.bulk_create([
            Product(store=store, slug=f"page-{index}", name_uz=f"Product {index}",
                    name_ru=f"Product {index}", name_en=f"Product {index}", price=10000, **fields)
            for index in range(count)
        ])

    def test_orders_reach_past_legacy_limit_without_duplicates(self):
        orders = self.make_orders(55)
        self.make_orders(2, store=self.other_store)
        expected = [order.id for order in reversed(orders)]
        first = self.get_list("orders", page=1, page_size=10)
        last = self.get_list("orders", page=6, page_size=10)
        self.assertEqual(first["total"], 55)
        self.assertEqual(first["counts"]["all"], 55)
        self.assertEqual(first["total_pages"], 6)
        self.assertEqual([row["id"] for row in first["orders"]], expected[:10])
        self.assertEqual([row["id"] for row in last["orders"]], expected[50:])
        self.assertEqual(last["page"], 6)
        legacy = self.get_list("orders")
        self.assertEqual(len(legacy["orders"]), 50)
        self.assertNotIn("page", legacy)

    def test_filters_and_branch_scope_apply_before_order_pagination(self):
        branch = Branch.objects.create(store=self.store, name="Selected branch", address="Test address")
        self.make_orders(12, branch=branch, status=Order.OrderStatuses.PROCESSING,
                         source=Order.Sources.WEB, payment_status=Order.PaymentStatuses.PAID)
        self.make_orders(3, status=Order.OrderStatuses.NEW, source=Order.Sources.TELEGRAM_MINI_APP)
        result = self.get_list("orders", page=2, page_size=10, branch=branch.id,
                               status="PROCESSING", source="WEB", payment_status="PAID", q="PAGE-")
        self.assertEqual(result["total"], 12)
        self.assertEqual(result["counts"]["processing"], 12)
        self.assertEqual(len(result["orders"]), 2)
        self.assertTrue(all(row["branch_id"] == branch.id for row in result["orders"]))

    def test_order_deep_link_locates_the_target_page(self):
        orders = self.make_orders(28)
        target = orders[3]
        for focus in (target.id, target.order_number):
            result = self.get_list("orders", page=1, page_size=10, focus_order=focus)
            self.assertEqual(result["page"], 3)
            self.assertIn(target.id, [row["id"] for row in result["orders"]])
        foreign_order = self.make_orders(1, store=self.other_store)[0]
        result = self.get_list("orders", page=1, page_size=10, focus_order=foreign_order.id)
        self.assertEqual(result["page"], 1)
        self.assertNotIn(foreign_order.id, [row["id"] for row in result["orders"]])

    def test_invalid_and_out_of_range_pages_are_safe(self):
        self.make_orders(23)
        invalid = self.get_list("orders", page="bad", page_size="bad")
        self.assertEqual((invalid["page"], invalid["page_size"]), (1, 10))
        first = self.get_list("orders", page=-3, page_size=10)
        self.assertEqual(first["page"], 1)
        last = self.get_list("orders", page=999, page_size=10)
        self.assertEqual((last["page"], len(last["orders"])), (3, 3))
        capped = self.get_list("orders", page=1, page_size=10000)
        self.assertEqual(capped["page_size"], 100)
        self.assertEqual(self.get_list("orders", limit="bad")["total"], 23)

    def test_empty_filtered_results_use_zero_total_and_first_page(self):
        for kind in ("orders", "products"):
            result = self.get_list(kind, page=99, page_size=10)
            self.assertEqual((result["total"], result["page"], result["total_pages"]), (0, 1, 1))
            self.assertEqual(result[kind], [])

    def test_product_pages_reach_past_150_and_keep_legacy_response(self):
        products = self.make_products(155)
        self.make_products(2, store=self.other_store)
        result = self.get_list("products", page=16, page_size=10)
        self.assertEqual((result["total"], result["counts"]["all"]), (155, 155))
        self.assertEqual([row["id"] for row in result["products"]], [p.id for p in reversed(products[:5])])
        self.assertEqual(len(self.get_list("products")["products"]), 150)

    def test_product_status_search_and_category_filter_before_pagination(self):
        category = Category.objects.create(store=self.store, name_uz="Selected", slug="selected")
        products = self.make_products(14, category=category)
        Product.objects.filter(id__in=[product.id for product in products[:2]]).update(is_active=False)
        result = self.get_list("products", page=2, page_size=10, status="active", category=category.id, q="Product")
        self.assertEqual((result["total"], result["counts"]["all"]), (12, 14))
        self.assertEqual(len(result["products"]), 2)
        self.assertTrue(all(row["is_active"] for row in result["products"]))
        draft = self.get_list("products", page=1, page_size=10, status="draft")
        self.assertEqual(draft["total"], 2)

    def test_deleting_the_last_product_page_clamps_to_remaining_page(self):
        products = self.make_products(11)
        Product.objects.filter(id=products[0].id).delete()
        result = self.get_list("products", page=2, page_size=10)
        self.assertEqual((result["page"], result["total_pages"], result["total"]), (1, 1, 10))
