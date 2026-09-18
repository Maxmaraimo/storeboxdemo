import os
import sys
import json
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "storebox.settings")
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from apps.super_admin.models import Partner
from apps.stores.models import Store
from apps.orders.models import Order, OrderItem
from apps.catalog.models import Product, Category

User = get_user_model()

def test_full_flow():
    print("=== STARTING FULL PARTNER & ORDERS VERIFICATION ===")
    client = Client()

    # 1. Superuser setup
    admin_user, _ = User.objects.get_or_create(username="test_admin_verifier", defaults={"is_staff": True, "is_superuser": True})
    admin_user.set_password("pass123")
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.save()

    client.force_login(admin_user)

    # Clean up any leftover test data
    Partner.objects.filter(code__in=["ORIG001", "UPD999"]).delete()
    Order.objects.filter(order_number="ORD-TEST-888").delete()
    Store.objects.filter(subdomain__in=["orders-test-store", "orders-test-store-updated", "test-partner-store"]).delete()

    # 2. Test Partner Creation & Update
    partner = Partner.objects.create(
        name="Original Partner",
        code="ORIG001",
        commission_rate=12.50,
        contact_person="Alisher",
        phone="+998901234567",
        email="alisher@example.com",
        notes="Old notes",
        is_active=True
    )
    print(f"Created Partner #{partner.id}: {partner.name}")

    # Test Partner List HTML View contains Actions and Modals
    resp = client.get("/super-admin/partners/")
    assert resp.status_code == 200, f"Expected 200 on /super-admin/partners/, got {resp.status_code}"
    html = resp.content.decode("utf-8")
    assert "Действия" in html, "Table header 'Действия' missing"
    assert "editPartnerModal" in html, "editPartnerModal missing"
    assert "deletePartnerModal" in html, "deletePartnerModal missing"
    assert "toggleStatus" in html, "toggleStatus missing"
    print("✓ Partner list HTML verified with Actions column and Modals")

    # Test Update API
    update_data = {
        "name": "Updated Partner Pro",
        "code": "UPD999",
        "commission_rate": "15.00",
        "contact_person": "Bekzod",
        "phone": "+998909876543",
        "email": "bekzod@example.com",
        "notes": "Updated notes info",
        "is_active": "true"
    }
    # Test Update API with AJAX header
    resp = client.post(
        f"/super-admin/partners/{partner.id}/update/",
        data=update_data,
        HTTP_X_REQUESTED_WITH="XMLHttpRequest"
    )
    assert resp.status_code == 200, f"Expected 200 on update, got {resp.status_code}"
    res_json = resp.json()
    assert res_json["status"] == "ok"
    partner.refresh_from_db()
    assert partner.name == "Updated Partner Pro"
    assert partner.code == "UPD999"
    assert float(partner.commission_rate) == 15.00
    assert partner.contact_person == "Bekzod"
    print("✓ Partner update API verified successfully")

    # Test Toggle Status API
    resp = client.post(f"/super-admin/partners/{partner.id}/toggle-status/", HTTP_X_REQUESTED_WITH="XMLHttpRequest")
    assert resp.status_code == 200
    partner.refresh_from_db()
    assert partner.is_active is False
    print("✓ Partner status toggle API (Active -> Inactive) verified")

    resp = client.post(f"/super-admin/partners/{partner.id}/toggle-status/", HTTP_X_REQUESTED_WITH="XMLHttpRequest")
    assert resp.status_code == 200
    partner.refresh_from_db()
    assert partner.is_active is True
    print("✓ Partner status toggle API (Inactive -> Active) verified")

    # Test Delete API
    store, _ = Store.objects.get_or_create(
        subdomain="test-partner-store",
        defaults={"name": "Test Partner Store", "owner": admin_user}
    )
    store.partner = partner
    store.save()
    assert store.partner == partner

    # Test Partner Detail API
    resp = client.get(f"/super-admin/partners/{partner.id}/detail/")
    assert resp.status_code == 200, f"Expected 200 on partner detail API, got {resp.status_code}"
    detail_json = resp.json()
    assert detail_json["status"] == "ok"
    assert detail_json["partner"]["name"] == "Updated Partner Pro"
    assert detail_json["partner"]["code"] == "UPD999"
    assert len(detail_json["partner"]["stores"]) == 1
    assert detail_json["partner"]["stores"][0]["subdomain"] == "test-partner-store"
    print("✓ Partner detail API (/super-admin/partners/<id>/detail/) verified with attached stores")

    resp = client.post(f"/super-admin/partners/{partner.id}/delete/", HTTP_X_REQUESTED_WITH="XMLHttpRequest")
    assert resp.status_code == 200
    assert not Partner.objects.filter(id=partner.id).exists()
    store.refresh_from_db()
    assert store.partner is None
    print("✓ Partner delete API verified (with store safe unlinking)")

    # 3. Test Store & Order Detail View
    test_store, _ = Store.objects.get_or_create(
        subdomain="orders-test-store",
        defaults={"name": "Orders Test Store", "owner": admin_user}
    )
    admin_user.store = test_store
    admin_user.save()

    cat, _ = Category.objects.get_or_create(store=test_store, name_uz="Test Cat")
    prod, _ = Product.objects.get_or_create(
        store=test_store,
        name_uz="Smartfon X",
        defaults={"price": 3500000, "stock": 20, "category": cat, "slug": "smartfon-x"}
    )

    order = Order.objects.create(
        store=test_store,
        order_number="ORD-TEST-888",
        customer_name="Jasur Rahimov",
        customer_phone="+998901112233",
        delivery_address="Toshkent sh., Chilonzor 9-mavze, 15-uy",
        delivery_lat=41.2858,
        delivery_lng=69.2035,
        delivery_fee=25000,
        total_amount=3525000,
        status="NEW",
        source="TMA",
        payment_method="CASH",
        payment_status="PENDING"
    )

    OrderItem.objects.create(
        order=order,
        product=prod,
        product_name="Smartfon X",
        quantity=1,
        unit_price=3500000,
        total_price=3500000
    )
    print(f"Created Test Order #{order.order_number} (ID: {order.id}) with Lat/Lng: {order.delivery_lat}, {order.delivery_lng}")

    # Test React SPA Order Detail Shell (/dashboard/orders/<id>/)
    client.force_login(admin_user)
    session = client.session
    session["store_id"] = test_store.id
    session.save()

    resp = client.get(f"/dashboard/orders/{order.id}/", HTTP_HOST="orders-test-store.storebox.uz")
    if resp.status_code == 302:
        resp = client.get(f"/dashboard/orders/{order.id}/")
    assert resp.status_code == 200, f"Expected 200 on /dashboard/orders/{order.id}/, got {resp.status_code}"
    html = resp.content.decode("utf-8")
    assert "root" in html, "React root element missing from SPA container"
    assert "assets/index-" in html, "Vite script tag missing from SPA container"
    print("✓ React SPA Order Detail view returns 200 and renders StoreBox Studio 2.0 app shell")

    # Test Order Detail JSON API (/api/v1/orders/<id>/)
    resp = client.get(f"/api/v1/orders/{order.id}/", HTTP_HOST="orders-test-store.storebox.uz")
    assert resp.status_code == 200, f"Expected 200 on /api/v1/orders/{order.id}/, got {resp.status_code}"
    order_data = resp.json().get("order", resp.json())
    assert order_data["order_number"] == "ORD-TEST-888"
    assert order_data["customer_name"] == "Jasur Rahimov"
    assert "Chilonzor" in order_data["delivery_address"]
    assert float(order_data["delivery_lat"]) == 41.2858
    assert float(order_data["delivery_lng"]) == 69.2035
    assert len(order_data["items"]) == 1
    assert order_data["items"][0]["product_name"] == "Smartfon X"
    print("✓ Order Detail JSON API verified with full customer, items, and coordinate data")

    # Test Store Management APIs: Edit, Toggle, Delete
    # A. Edit Store API
    store_update_payload = {
        "name": "Updated Shop Pro",
        "subdomain": "orders-test-store-updated",
        "company_name": "Pro LLC",
        "contact_phone": "+998909998877",
        "license_plan": "PRO",
        "license_expires_at": "2026-12-31",
        "admin_comment": "Super VIP store",
        "is_active": "true"
    }
    resp = client.post(
        f"/super-admin/servers/{test_store.id}/update/",
        data=store_update_payload,
        HTTP_X_REQUESTED_WITH="XMLHttpRequest"
    )
    assert resp.status_code == 200, f"Expected 200 on server update, got {resp.status_code}"
    test_store.refresh_from_db()
    assert test_store.name == "Updated Shop Pro"
    assert test_store.subdomain == "orders-test-store-updated"
    assert test_store.company_name == "Pro LLC"
    assert test_store.license_plan == "PRO"
    assert test_store.is_active is True
    print("✓ SuperAdmin Store Edit API (/super-admin/servers/<id>/update/) verified")

    # B. Toggle Store API
    resp = client.post(
        f"/super-admin/servers/{test_store.id}/toggle-status/",
        HTTP_X_REQUESTED_WITH="XMLHttpRequest"
    )
    assert resp.status_code == 200
    test_store.refresh_from_db()
    assert test_store.is_active is False
    print("✓ SuperAdmin Store Toggle API (Active -> Inactive) verified")

    # C. Servers List HTML contains Edit, Toggle, Delete actions
    resp = client.get("/super-admin/servers/")
    assert resp.status_code == 200
    servers_html = resp.content.decode("utf-8")
    assert 'data-action="edit-server"' in servers_html, "data-action='edit-server' missing in servers list"
    assert 'data-action="delete-server"' in servers_html, "data-action='delete-server' missing in servers list"
    assert 'data-action="toggle-server"' in servers_html, "data-action='toggle-server' missing in servers list"
    assert 'editServerModal' in servers_html, "editServerModal missing"
    assert 'deleteServerModal' in servers_html, "deleteServerModal missing"
    print("✓ SuperAdmin Servers List HTML verified with Edit, Delete, Toggle actions & modals")

    # Test Orders API status update
    resp = client.patch(
        f"/api/v1/orders/{order.id}/status/",
        data=json.dumps({"status": "PROCESSING"}),
        content_type="application/json",
        HTTP_HOST="orders-test-store.storebox.uz"
    )
    assert resp.status_code == 200, f"Expected 200 on status patch, got {resp.status_code}"
    order.refresh_from_db()
    assert order.status == "PROCESSING"
    print("✓ Order status update to PROCESSING verified")

    # Test Cancel status update
    resp = client.patch(
        f"/api/v1/orders/{order.id}/status/",
        data=json.dumps({"status": "CANCELLED"}),
        content_type="application/json",
        HTTP_HOST="orders-test-store.storebox.uz"
    )
    assert resp.status_code == 200
    order.refresh_from_db()
    assert order.status == "CANCELLED"
    print("✓ Order status update to CANCELLED verified")

    # 4. Check SPA dist index and spa_index.html
    spa_index_path = os.path.join("templates", "dashboard", "spa_index.html")
    assert os.path.exists(spa_index_path), "spa_index.html does not exist"
    with open(spa_index_path, "r", encoding="utf-8") as f:
        spa_content = f.read()
    assert "assets/index-" in spa_content, "Vite bundle reference missing in spa_index.html"
    print("✓ SPA index correctly references the compiled frontend bundle")

    print("\nALL 100% OF VERIFICATIONS PASSED!")

if __name__ == "__main__":
    test_full_flow()
