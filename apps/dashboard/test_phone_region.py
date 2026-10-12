from types import SimpleNamespace
from unittest.mock import patch

from django.test import RequestFactory, SimpleTestCase

from apps.dashboard.phone_region import DEFAULT_PHONE_REGION, phone_region_for_request


class PhoneRegionTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    @patch("apps.dashboard.phone_region.geoip2.database.Reader")
    def test_uses_real_ip_country_for_prefix(self, reader_class):
        reader_class.return_value.__enter__.return_value.country.return_value = SimpleNamespace(
            country=SimpleNamespace(iso_code="RU")
        )
        request = self.factory.get(
            "/dashboard/login/", HTTP_X_REAL_IP="77.88.8.8", REMOTE_ADDR="127.0.0.1"
        )

        self.assertEqual(phone_region_for_request(request), ("RU", "7", True))
        reader_class.return_value.__enter__.return_value.country.assert_called_once_with("77.88.8.8")

    @patch("apps.dashboard.phone_region.geoip2.database.Reader")
    def test_preserves_country_for_shared_prefix(self, reader_class):
        reader_class.return_value.__enter__.return_value.country.return_value = SimpleNamespace(
            country=SimpleNamespace(iso_code="KZ")
        )
        request = self.factory.get("/dashboard/login/", HTTP_X_REAL_IP="8.8.8.8")

        self.assertEqual(phone_region_for_request(request), ("KZ", "7", True))

    @patch("apps.dashboard.phone_region.geoip2.database.Reader")
    def test_ignores_untrusted_forwarded_for(self, reader_class):
        request = self.factory.get(
            "/dashboard/login/", HTTP_X_FORWARDED_FOR="8.8.8.8", REMOTE_ADDR="127.0.0.1"
        )

        self.assertEqual(phone_region_for_request(request), DEFAULT_PHONE_REGION)
        reader_class.assert_not_called()

    @patch("apps.dashboard.phone_region.geoip2.database.Reader", side_effect=OSError)
    def test_missing_database_keeps_uzbek_default(self, reader_class):
        request = self.factory.get("/dashboard/login/", HTTP_X_REAL_IP="8.8.8.8")

        self.assertEqual(phone_region_for_request(request), DEFAULT_PHONE_REGION)
        reader_class.assert_called_once()
