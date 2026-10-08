from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.stores.models import Store, StoreIntegration
from apps.payments.models import StorePaymentSetting

User = get_user_model()


class IntegrationsApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            phone="+998901234567",
            username="+998901234567",
            password="testpassword123",
            first_name="Test",
            last_name="Merchant"
        )
        self.store = Store.objects.create(
            owner=self.user,
            name="Test Store",
            subdomain="test-store-integrations"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_integrations_list(self):
        response = self.client.get("/api/v1/integrations/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("integrations", data)
        self.assertIn("counts", data)
        self.assertGreaterEqual(data["counts"]["total"], 25)
        self.assertGreaterEqual(data["counts"]["pos"], 5)
        self.assertGreaterEqual(data["counts"]["warehouse"], 5)
        self.assertGreaterEqual(data["counts"]["delivery"], 5)
        self.assertGreaterEqual(data["counts"]["payment"], 5)
        self.assertGreaterEqual(data["counts"]["telephony_social"], 5)

    def test_integrations_list_unauthenticated_and_no_store(self):
        # 1. Unauthenticated client
        anon_client = APIClient()
        r1 = anon_client.get("/api/v1/integrations/")
        self.assertEqual(r1.status_code, 200)
        self.assertGreaterEqual(len(r1.json()["integrations"]), 30)

        # 2. User with no store
        user_no_store = User.objects.create_user(
            phone="+998909999999",
            username="+998909999999",
            password="password",
        )
        no_store_client = APIClient()
        no_store_client.force_authenticate(user=user_no_store)
        r2 = no_store_client.get("/api/v1/integrations/")
        self.assertEqual(r2.status_code, 200)
        self.assertGreaterEqual(len(r2.json()["integrations"]), 30)

    def test_save_and_encrypt_integration(self):
        # Save payme credentials
        payload = {
            "merchant_id": "test_merchant_6489",
            "secret_key": "super_secret_payme_password_999",
            "test_mode": True,
            "is_active": True
        }
        res = self.client.post("/api/v1/integrations/payme/save/", payload, format="json")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertTrue(data["integration"]["is_connected"])
        self.assertTrue(data["integration"]["is_active"])

        # Check in DB
        integ = StoreIntegration.objects.get(store=self.store, service_slug="payme")
        self.assertTrue(integ.is_connected)
        self.assertTrue(integ.is_active)
        # Secret should NOT be stored in plaintext
        self.assertNotIn("super_secret_payme_password_999", integ.encrypted_credentials)
        # Decrypted credentials should restore it
        decrypted = integ.get_credentials()
        self.assertEqual(decrypted["secret_key"], "super_secret_payme_password_999")

        # Masked preview should be safe
        self.assertIn("••••", integ.credentials_preview["secret_key"])
        self.assertNotEqual(integ.credentials_preview["secret_key"], "super_secret_payme_password_999")

        # Verify sync with StorePaymentSetting
        pay_setting = StorePaymentSetting.objects.get(store=self.store)
        self.assertTrue(pay_setting.payme_enabled)
        self.assertEqual(pay_setting.payme_merchant_id, "test_merchant_6489")
        self.assertEqual(pay_setting.payme_secret_key, "super_secret_payme_password_999")

    def test_toggle_and_disconnect(self):
        # Connect first
        self.client.post("/api/v1/integrations/click/save/", {
            "service_id": "9999",
            "merchant_id": "8888",
            "secret_key": "click_secret_key",
            "is_active": True
        }, format="json")

        # Toggle off
        res_toggle = self.client.post("/api/v1/integrations/click/toggle/")
        self.assertEqual(res_toggle.status_code, 200)
        self.assertFalse(res_toggle.json()["is_active"])

        # Disconnect
        res_disc = self.client.post("/api/v1/integrations/click/disconnect/")
        self.assertEqual(res_disc.status_code, 200)
        integ = StoreIntegration.objects.get(store=self.store, service_slug="click")
        self.assertFalse(integ.is_connected)
        self.assertFalse(integ.is_active)

    def test_integration_test_ping(self):
        # Valid test
        res = self.client.post("/api/v1/integrations/iiko/test/", {
            "api_url": "https://api-ru.iiko.services",
            "api_login": "admin",
            "api_key": "secret_key_123",
            "organization_id": "org_1"
        }, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["success"])
        self.assertEqual(res.json()["status_code"], 200)

    def test_billz_connect_sync_and_logs(self):
        # 1. Test ping
        res_test = self.client.post("/api/v1/integrations/billz/test/", {
            "api_key": "test_billz_token_xyz",
            "company_id": "cmp_84920",
            "shop_id": "shop_1"
        }, format="json")
        self.assertEqual(res_test.status_code, 200)
        self.assertTrue(res_test.json()["success"])

        # 2. Save Billz
        res_save = self.client.post("/api/v1/integrations/billz/save/", {
            "api_key": "test_billz_token_xyz",
            "company_id": "cmp_84920",
            "shop_id": "shop_1",
            "is_active": True
        }, format="json")
        self.assertEqual(res_save.status_code, 200)
        self.assertTrue(res_save.json()["success"])

        # 3. Verify Products and Warehouse sync occurred
        from apps.catalog.models import Product
        synced_products = Product.objects.filter(store=self.store, name_uz__startswith="Billz:")
        self.assertGreaterEqual(synced_products.count(), 6)
        first_product = synced_products.first()
        self.assertGreater(first_product.stock, 0)
        self.assertGreater(first_product.price, 0)
        self.assertTrue(first_product.barcode)
        self.assertTrue(first_product.image_url)

        # 4. Trigger manual sync
        res_sync = self.client.post("/api/v1/integrations/billz/sync/")
        self.assertEqual(res_sync.status_code, 200)
        self.assertTrue(res_sync.json()["success"])
        self.assertGreaterEqual(res_sync.json()["synced_count"], 6)

        # 5. Fetch audit logs
        res_logs = self.client.get("/api/v1/integrations/billz/logs/")
        self.assertEqual(res_logs.status_code, 200)
        logs = res_logs.json()["logs"]
        self.assertGreaterEqual(len(logs), 2)
        event_types = [l["event_type"] for l in logs]
        self.assertIn("SYNC_CATALOG", event_types)

    def test_delivery_integration_sync(self):
        # Save Yandex Delivery
        res_save = self.client.post("/api/v1/integrations/yandex_delivery/save/", {
            "oauth_token": "yandex_oauth_secret_tok",
            "client_id": "client_999",
            "is_active": True
        }, format="json")
        self.assertEqual(res_save.status_code, 200)
        self.store.refresh_from_db()
        self.assertTrue(self.store.courier_enabled)
