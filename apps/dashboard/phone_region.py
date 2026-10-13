"""Select the login form's initial phone prefix from the visitor's IP.

nginx overwrites X-Real-IP with the connecting address. Do not trust the
client-supplied X-Forwarded-For header for this cosmetic preference.
"""

import ipaddress
import os

import geoip2.database
import geoip2.errors
import maxminddb.errors
import phonenumbers


DEFAULT_PHONE_REGION = ("UZ", "998", False)
DEFAULT_COUNTRY_DATABASE = "/home/ubuntu/storebox-geoip/country.mmdb"


def phone_region_for_request(request):
    """Return (ISO country, calling code, detected from IP)."""
    raw_ip = request.META.get("HTTP_X_REAL_IP") or request.META.get("REMOTE_ADDR")
    try:
        address = ipaddress.ip_address(raw_ip)
    except (TypeError, ValueError):
        return DEFAULT_PHONE_REGION

    if not address.is_global:
        return DEFAULT_PHONE_REGION

    database_path = os.environ.get("STOREBOX_COUNTRY_DB", DEFAULT_COUNTRY_DATABASE)
    try:
        with geoip2.database.Reader(database_path) as reader:
            country = reader.country(str(address)).country.iso_code
    except (OSError, ValueError, geoip2.errors.GeoIP2Error, maxminddb.errors.InvalidDatabaseError):
        return DEFAULT_PHONE_REGION

    if not country or len(country) != 2 or not country.isalpha():
        return DEFAULT_PHONE_REGION

    country = country.upper()
    calling_code = phonenumbers.country_code_for_region(country)
    if not calling_code:
        return DEFAULT_PHONE_REGION

    return country, str(calling_code), True
