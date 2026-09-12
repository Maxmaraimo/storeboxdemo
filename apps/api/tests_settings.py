import json

from django.test import Client, TestCase, override_settings

from apps.accounts.models import User
from apps.stores.models import Store


@override_settings(
    PLATFORM_DOMAIN="storebox.uz",
    STOREFRONT_SUBDOMAIN_URLS=True,
)
class StoreDomainSettingsTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="settings-owner",
            password="SafePassword123!",
        )
        self.store = Store.objects.create(
            owner=self.owner,
            name="Old shop",
            subdomain="old-shop",
        )
        other_owner = User.objects.create_user(
            username="other-owner",
            password="SafePassword123!",
        )
        self.other_store = Store.objects.create(
            owner=other_owner,
            name="Occupied shop",
            subdomain="occupied-shop",
        )
        self.client = Client()
        self.client.force_login(self.owner)

    def test_availability_reports_free_occupied_and_reserved_domains(self):
        available = self.client.get(
            "/api/v1/settings/store/domain/?subdomain=new-shop.storebox.uz"
        )
        occupied = self.client.get(
            "/api/v1/settings/store/domain/?subdomain=occupied-shop"
        )
        reserved = self.client.get(
            "/api/v1/settings/store/domain/?subdomain=app"
        )

        self.assertEqual(available.status_code, 200)
        self.assertTrue(available.json()["available"])
        self.assertEqual(available.json()["subdomain"], "new-shop")
        self.assertEqual(
            available.json()["storefront_url"],
            "https://new-shop.storebox.uz",
        )
        self.assertFalse(occupied.json()["available"])
        self.assertFalse(reserved.json()["available"])

    def test_patch_changes_domain_and_storefront_uses_it_immediately(self):
        self.store.custom_domain = "old.example.com"
        self.store.save(update_fields=["custom_domain"])

        response = self.client.patch(
            "/api/v1/settings/store/",
            data=json.dumps({
                "name": "New shop name",
                "subdomain": "New Shop.storebox.uz",
                "currency": "USD",
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.store.refresh_from_db()
        self.assertEqual(self.store.name, "New shop name")
        self.assertEqual(self.store.subdomain, "new-shop")
        self.assertEqual(self.store.currency, "USD")
        self.assertEqual(self.store.custom_domain, "")
        self.assertEqual(
            response.json()["storefront_url"],
            "https://new-shop.storebox.uz",
        )

        storefront = self.client.get(
            "/",
            HTTP_HOST="new-shop.storebox.uz",
            secure=True,
        )
        self.assertEqual(storefront.status_code, 200)
        self.assertContains(storefront, "New shop name")

    def test_patch_rejects_another_stores_domain(self):
        response = self.client.patch(
            "/api/v1/settings/store/",
            data=json.dumps({"subdomain": "OCCUPIED-SHOP"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.store.refresh_from_db()
        self.assertEqual(self.store.subdomain, "old-shop")

    def test_delete_restores_generated_domain_and_clears_custom_domain(self):
        self.store.custom_domain = "shop.example.com"
        self.store.save(update_fields=["custom_domain"])

        response = self.client.delete("/api/v1/settings/store/domain/")

        self.assertEqual(response.status_code, 200)
        self.store.refresh_from_db()
        self.assertEqual(self.store.subdomain, f"shop-{self.store.pk}")
        self.assertEqual(self.store.custom_domain, "")
        self.assertEqual(
            response.json()["storefront_url"],
            f"https://shop-{self.store.pk}.storebox.uz",
        )
