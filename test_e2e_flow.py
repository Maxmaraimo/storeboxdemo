import os
import django
import json
from decimal import Decimal

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "storebox.settings")
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from apps.stores.models import Store, Branch
from apps.catalog.models import Category, Product
from apps.orders.models import Order, OrderItem, Customer, PromoCode, ChatMessage, StoreStaff
from apps.payments.models import StorePaymentSetting

User = get_user_model()

def run_e2e_verification():
    print("=== STARTING COMPREHENSIVE E2E VERIFICATION ===")
    client = Client()

    # Step 1: User & Store Setup
    user, _ = User.objects.get_or_create(
        phone="+998909998877",
        defaults={"first_name": "Test", "last_name": "Merchant", "role": "MERCHANT"}
    )
    user.set_password("pass1234")
    user.save()

    store, _ = Store.objects.get_or_create(
        subdomain="testburger",
        defaults={
            "owner": user,
            "name": "Test Burger Bar",
            "business_category": "FOOD",
            "currency": "UZS",
            "delivery_price": Decimal("15000"),
            "free_delivery_threshold": Decimal("120000"),
            "courier_enabled": True,
            "pickup_enabled": True,
            "address": "Tashkent, Chilonzor 5",
        }
    )

    # Login client
    client.force_login(user)
    session = client.session
    session["current_store_id"] = store.id
    session.save()

    print("Step 1: Merchant Auth & Store Context -> OK")

    # Step 2: Categories CRUD via API
    # Create category
    res = client.post(
        "/api/v1/categories/",
        data=json.dumps({"name_uz": "Burgerlar", "name_ru": "Бургеры"}),
        content_type="application/json"
    )
    assert res.status_code == 201, f"Category create failed: {res.status_code} {res.content}"
    cat_id = res.json()["id"]
    print(f"Step 2.1: Create Category id={cat_id} -> OK")

    # Update category
    res = client.patch(
        f"/api/v1/categories/{cat_id}/",
        data=json.dumps({"name_uz": "Premium Burgerlar"}),
        content_type="application/json"
    )
    assert res.status_code == 200, f"Category update failed: {res.status_code}"
    assert res.json()["name_uz"] == "Premium Burgerlar"
    print("Step 2.2: Update Category -> OK")

    # Toggle category active
    res = client.post(f"/api/v1/categories/{cat_id}/toggle-active/")
    assert res.status_code == 200
    # Toggle back to active
    client.post(f"/api/v1/categories/{cat_id}/toggle-active/")
    print("Step 2.3: Toggle Category Active -> OK")

    # Step 3: Products CRUD via API
    # Create product with full fields
    product_payload = {
        "name_uz": "Cheeseburger Double",
        "name_ru": "Двойной Чизбургер",
        "category": cat_id,
        "price": 45000,
        "old_price": 50000,
        "cost_price": 28000,
        "stock": 30,
        "unit": "dona",
        "barcode": "4781234567890",
        "ikpu_code": "10101001001000000",
        "description_uz": "Ikki qavatli go'sht va maxsus sous",
        "primary_image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
        "is_active": True
    }
    res = client.post("/api/v1/products/", data=json.dumps(product_payload), content_type="application/json")
    assert res.status_code == 201, f"Product create failed: {res.status_code} {res.content}"
    prod_id = res.json()["id"]
    print(f"Step 3.1: Create Product id={prod_id} -> OK")

    # Update product
    res = client.patch(
        f"/api/v1/products/{prod_id}/",
        data=json.dumps({"price": 48000, "stock": 25}),
        content_type="application/json"
    )
    assert res.status_code == 200
    assert float(res.json()["price"]) == 48000.0
    print("Step 3.2: Update Product -> OK")

    # Step 4: Warehouse Stock Adjustment via API
    res = client.post(
        "/api/v1/warehouse/adjust-stock/",
        data=json.dumps({"product_id": prod_id, "delta": 15}),
        content_type="application/json"
    )
    assert res.status_code == 200
    assert res.json()["product"]["stock"] == 40
    print("Step 4: Stock Adjustment (+15 -> 40) -> OK")

    # Step 5: Promocode CRUD via API
    promo_code_str = f"BURGER{cat_id}"
    res = client.post(
        "/api/v1/promocodes/",
        data=json.dumps({
            "code": promo_code_str,
            "discount_type": "PERCENT",
            "discount_value": 10,
            "min_order_amount": 50000,
            "max_uses": 50
        }),
        content_type="application/json"
    )
    assert res.status_code == 201, f"Promo create failed: {res.status_code} {res.content}"
    promo_id = res.json()["id"]
    print(f"Step 5: Promocode Create id={promo_id} -> OK")

    # Step 6: Storefront Browsing & Cart
    anon_client = Client()
    storefront_res = anon_client.get(f"/store/{store.subdomain}/")
    assert storefront_res.status_code == 200, f"Storefront error: {storefront_res.status_code}"
    print(f"Step 6.1: Storefront /store/{store.subdomain}/ loads (Status 200) -> OK")

    # Add to cart
    cart_add_res = anon_client.post(f"/store/{store.subdomain}/cart/add/", {
        "product_id": prod_id,
        "quantity": 2
    })
    assert cart_add_res.status_code == 200, f"Cart add error: {cart_add_res.status_code}"
    cart_data = cart_add_res.json()
    assert cart_data["cart_count"] == 2
    print("Step 6.2: Add to Cart (2 items) -> OK")

    # Checkout page
    checkout_res = anon_client.get(f"/store/{store.subdomain}/checkout/")
    assert checkout_res.status_code == 200
    print("Step 6.3: Checkout Page loads (Status 200) -> OK")

    # Step 7: Place Real Order with Inventory Decrement
    initial_stock = Product.objects.get(id=prod_id).stock
    order_res = anon_client.post(f"/store/{store.subdomain}/checkout/", {
        "customer_name": "Alisher Navoiy",
        "customer_phone": "+998931234567",
        "delivery_method": "COURIER",
        "delivery_address": "Chilonzor 5-mavze, 12-uy",
        "payment_method": "CASH",
        "notes": "Iltimos tezroq yetkazing"
    }, follow=True)
    assert order_res.status_code == 200, f"Order placement failed: {order_res.status_code}"

    # Verify order in DB
    order = Order.objects.filter(store=store, customer_phone="+998931234567").order_by("-id").first()
    assert order is not None, "Order was not created in DB!"
    assert order.items.count() == 1
    assert order.items.first().product_id == prod_id
    assert order.items.first().quantity == 2
    print(f"Step 7.1: Order #{order.order_number} placed in DB (total: {order.total_amount}) -> OK")

    # Verify stock decremented
    updated_stock = Product.objects.get(id=prod_id).stock
    assert updated_stock == initial_stock - 2, f"Stock decrement failed: expected {initial_stock - 2}, got {updated_stock}"
    print(f"Step 7.2: Inventory decremented ({initial_stock} -> {updated_stock}) -> OK")

    # Step 8: Merchant Dashboard Orders View
    orders_list_res = client.get("/api/v1/orders/")
    assert orders_list_res.status_code == 200
    orders_data = orders_list_res.json()
    assert any(o["id"] == order.id for o in orders_data["orders"])
    print(f"Step 8: Order #{order.order_number} visible in Merchant Dashboard -> OK")

    # Step 9: Merchant updates Order Status
    status_update_res = client.post(
        f"/api/v1/orders/{order.id}/status/",
        data=json.dumps({"status": "PROCESSING"}),
        content_type="application/json"
    )
    assert status_update_res.status_code == 200
    order.refresh_from_db()
    assert order.status == "PROCESSING"
    print("Step 9.1: Status updated to PROCESSING -> OK")

    status_update_res = client.post(
        f"/api/v1/orders/{order.id}/status/",
        data=json.dumps({"status": "IN_DELIVERY"}),
        content_type="application/json"
    )
    assert status_update_res.status_code == 200
    order.refresh_from_db()
    assert order.status == "IN_DELIVERY"
    print("Step 9.2: Status updated to IN_DELIVERY -> OK")

    # Step 9.3: Order cancellation restores stock
    current_stock = Product.objects.get(id=prod_id).stock
    status_cancel_res = client.post(
        f"/api/v1/orders/{order.id}/status/",
        data=json.dumps({"status": "CANCELLED"}),
        content_type="application/json"
    )
    assert status_cancel_res.status_code == 200
    order.refresh_from_db()
    assert order.status == "CANCELLED"
    restored_stock = Product.objects.get(id=prod_id).stock
    assert restored_stock == current_stock + 2, f"Stock restore failed: {restored_stock} vs {current_stock + 2}"
    print(f"Step 9.3: Order CANCELLED -> Stock restored ({current_stock} -> {restored_stock}) -> OK")

    # Step 10: Dashboard Analytics Summary
    summary_res = client.get("/api/v1/dashboard/summary/")
    assert summary_res.status_code == 200
    summary_data = summary_res.json()
    assert "metrics" in summary_data
    assert "orders_count" in summary_data["metrics"]
    print(f"Step 10: Dashboard Summary loaded with live analytics -> OK")

    # Step 11: Customer Chat API
    chat_send_res = client.post(
        f"/api/v1/chats/+998931234567/send/",
        data=json.dumps({"message": "Buyurtmangiz yo'lga chiqdi!"}),
        content_type="application/json"
    )
    assert chat_send_res.status_code == 201
    chats_list_res = client.get("/api/v1/chats/")
    assert chats_list_res.status_code == 200
    assert any(c["phone"] == "+998931234567" for c in chats_list_res.json()["conversations"])
    print("Step 11: Merchant-Customer Chat API -> OK")

    # Step 12: Delivery Settings API
    deliv_res = client.post(
        "/api/v1/settings/delivery/",
        data=json.dumps({
            "delivery_price": 22000,
            "free_delivery_threshold": 160000,
            "delivery_time_estimate": "25-35 daqiqa"
        }),
        content_type="application/json"
    )
    assert deliv_res.status_code == 200
    store.refresh_from_db()
    assert float(store.delivery_price) == 22000.0
    print("Step 12: Delivery Settings update -> OK")

    # Step 13: Payments Settings API
    pay_res = client.post(
        "/api/v1/settings/payments/",
        data=json.dumps({
            "payme_enabled": True,
            "payme_merchant_id": "test_payme_12345",
            "click_enabled": True
        }),
        content_type="application/json"
    )
    assert pay_res.status_code == 200
    pay_setting = StorePaymentSetting.objects.get(store=store)
    assert pay_setting.payme_enabled is True
    assert pay_setting.payme_merchant_id == "test_payme_12345"
    print("Step 13: Payment Settings update -> OK")

    # Step 14: Branches CRUD API
    branch_res = client.post(
        "/api/v1/branches/",
        data=json.dumps({
            "name": "Chilonzor filiali",
            "address": "Chilonzor 9-mavze, 2-uy",
            "phone": "+998712001122",
            "is_main": True
        }),
        content_type="application/json"
    )
    assert branch_res.status_code == 201
    branch_id = branch_res.json()["id"]
    branches_list = client.get("/api/v1/branches/")
    assert branches_list.status_code == 200
    assert any(b["id"] == branch_id for b in branches_list.json()["branches"])
    print("Step 14: Branches CRUD -> OK")

    # Step 15: Staff CRUD API
    staff_res = client.post(
        "/api/v1/staff/",
        data=json.dumps({
            "name": "Jasur Rahimov",
            "phone": "+998901112233",
            "role": "MANAGER"
        }),
        content_type="application/json"
    )
    assert staff_res.status_code == 201
    staff_id = staff_res.json()["id"]
    staff_list = client.get("/api/v1/staff/")
    assert staff_list.status_code == 200
    assert any(s["id"] == staff_id for s in staff_list.json()["staff"])
    print("Step 15: Staff CRUD -> OK")

    print("\n=======================================================")
    print("ALL 15 END-TO-END VERIFICATION CHECKS PASSED WITH 100% SUCCESS!")
    print("=======================================================")

if __name__ == "__main__":
    run_e2e_verification()
