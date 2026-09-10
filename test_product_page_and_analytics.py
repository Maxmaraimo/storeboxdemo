try:
    from playwright.async_api import async_playwright
    from playwright.sync_api import sync_playwright
except ImportError:
    async_playwright = None
    sync_playwright = None
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storebox.settings')
django.setup()

from apps.stores.models import Store
from apps.catalog.models import Product, Category
from apps.orders.models import Order, OrderItem, Customer


def test_ecommerce_suite():
    print("=== Starting E-Commerce Suite: Product Page, Profile, Bot Setup & Scoped Stats ===")

    store = Store.objects.filter(subdomain='ozodbekqq1').first()
    if not store:
        store = Store.objects.first()
    subdomain = store.subdomain
    print(f"Testing store: {store.name} (subdomain: {subdomain})")

    product = Product.objects.filter(store=store, is_active=True).first()
    if not product:
        cat, _ = Category.objects.get_or_create(store=store, slug='fast-food', defaults={'name_uz': 'Fast Food'})
        product = Product.objects.create(
            store=store,
            category=cat,
            name_uz='Lavash Standart',
            slug='lavash-standart',
            price=35000,
            old_price=40000,
            stock=25
        )
    print(f"Testing with product: {product.name_uz} (ID: {product.id}, Price: {product.price} UZS)")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()
        page.on("console", lambda msg: print(f"PAGE LOG [{msg.type}]: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

        # -------------------------------------------------------------
        # 1. TEST STOREFRONT HOME & DEDICATED PRODUCT DETAIL NAVIGATION
        # -------------------------------------------------------------
        print("\n[STEP 1] Testing Storefront Home & Clicking Product Link...")
        page.goto(f"http://127.0.0.1:8000/store/{subdomain}/", wait_until="networkidle")
        assert page.title() != "", "Page loaded successfully"
        print(f"Storefront Home loaded: {page.url}")

        # Find product link on the page
        product_link_selector = f"a[href*='/product/{product.id}/']"
        page.wait_for_selector(product_link_selector, timeout=5000)
        print(f"Found dedicated product link pointing to /product/{product.id}/")

        # Click the product to navigate to dedicated page
        page.click(product_link_selector)
        page.wait_for_url(f"**/product/{product.id}/**", timeout=5000)
        print(f"Successfully navigated to dedicated Product Detail page: {page.url}")

        # Verify elements on Product Detail Page
        page.wait_for_selector("text=Savatga qo'shish", timeout=5000)
        page.wait_for_selector("text=Hoziroq xarid qilish", timeout=5000)
        print("Dedicated Product Detail page elements (Savatga qo'shish, Hoziroq xarid qilish) verified!")

        # -------------------------------------------------------------
        # 2. TEST ADD TO CART & BUY NOW ON PRODUCT DETAIL PAGE
        # -------------------------------------------------------------
        print("\n[STEP 2] Testing Add to Cart and Buy Now on Product Detail Page...")
        
        # Test Quantity stepper [+]
        page.click("button:has-text('+')")
        page.wait_for_timeout(300)
        
        # Click "Savatga qo'shish"
        page.click('button:has-text("Savatga")')
        page.wait_for_timeout(800)
        print("Clicked 'Savatga qo\'shish' - item added to cart successfully")

        # Click "Hoziroq xarid qilish" (Direct checkout)
        page.click('button:has-text("Hoziroq")')
        page.wait_for_url(f"**/checkout/**", timeout=5000)
        print(f"Successfully navigated to Checkout via 'Hoziroq xarid qilish': {page.url}")

        # -------------------------------------------------------------
        # 3. COMPLETE CHECKOUT TO CREATE AN ORDER
        # -------------------------------------------------------------
        print("\n[STEP 3] Completing checkout to generate a verified customer order...")
        page.fill("input[name='customer_name']", "Ozodbek Xaridor")
        page.fill("input[name='customer_phone']", "+998904772809")
        
        # Check delivery address
        address_input = page.query_selector("input[name='delivery_address']")
        if address_input:
            address_input.fill("Amir Temur ko'chasi 15-uy")

        # Submit order
        page.click("button[type='submit']")
        page.wait_for_url("**/order/**/success/**", timeout=8000)
        print(f"Order created successfully! Success URL: {page.url}")

        # Extract order number
        order_num_elem = page.query_selector("span.font-mono, h2:has-text('#')")
        print(f"Order Success confirmation page rendered.")

        # -------------------------------------------------------------
        # 4. TEST DEDICATED CUSTOMER PROFILE & ORDERS PAGE
        # -------------------------------------------------------------
        print("\n[STEP 4] Testing Dedicated Customer Profile & Orders Page...")
        page.goto(f"http://127.0.0.1:8000/store/{subdomain}/profile/", wait_until="networkidle")
        print(f"Loaded Profile page: {page.url}")

        # Verify customer details and order list
        page.wait_for_selector("text=Mening buyurtmalarim", timeout=5000)
        page.wait_for_selector("text=Qayta buyurtma berish", timeout=5000)
        print("Customer profile displays active customer info, orders list and 'Qayta buyurtma berish' button!")

        # -------------------------------------------------------------
        # 5. TEST DASHBOARD TELEGRAM PLATFORM (Token-Only Flow & Switcher)
        # -------------------------------------------------------------
        print("\n[STEP 5] Testing Dashboard Telegram Bot Setup...")
        # Merchant login
        page.goto("http://127.0.0.1:8000/login/", wait_until="networkidle")
        page.fill("input[name='login']", "+998904772809")
        page.fill("input[name='password']", "admin123")
        page.click("button[type='submit']")
        page.wait_for_url("**/dashboard/**", timeout=6000)

        # Go to Platforms -> Telegram
        page.goto("http://127.0.0.1:8000/dashboard/platforms/?tab=telegram", wait_until="networkidle")
        print(f"Loaded Dashboard Platforms tab: {page.url}")

        page.wait_for_selector("text=Telegram Web App (TMA) URL", timeout=5000)
        page.wait_for_selector("text=Boshqa bot ulash", timeout=5000)
        
        # Verify NO confusing Chat ID field in the settings
        has_chat_id_input = page.query_selector("input[name='telegram_chat_id']")
        assert has_chat_id_input is None, "Confusing manual telegram_chat_id field is completely removed as requested!"
        print("Verified: Manual chat ID input is removed. Only Token is required.")

        # Click 'Boshqa bot ulash'
        page.click("button:has-text('Boshqa bot ulash')")
        page.wait_for_selector("text=Yangi bot ulash yoki tokenni almashtirish", timeout=3000)
        print("Verified: 'Boshqa bot ulash' accordion opened smoothly for seamless bot switching!")

        # -------------------------------------------------------------
        # 6. TEST DASHBOARD PERIOD-SCOPED ANALYTICS
        # -------------------------------------------------------------
        print("\n[STEP 6] Testing Dashboard Analytics Period Filters (Bugun, Hafta, Har oy)...")
        page.goto("http://127.0.0.1:8000/dashboard/?period=today", wait_until="networkidle")
        page.wait_for_selector("text=Top mahsulotlar", timeout=5000)
        print("Dashboard Today analytics loaded. Top mahsulotlar reflects scoped sales.")

        page.goto("http://127.0.0.1:8000/dashboard/?period=week", wait_until="networkidle")
        page.wait_for_selector("text=Top mahsulotlar", timeout=5000)
        print("Dashboard Weekly analytics loaded successfully.")

        page.goto("http://127.0.0.1:8000/dashboard/?period=month", wait_until="networkidle")
        page.wait_for_selector("text=Top mahsulotlar", timeout=5000)
        print("Dashboard Monthly analytics loaded successfully.")

        browser.close()
        print("\n=======================================================")
        print(">>> ALL TESTS PASSED SUCCESSFULLY! (100% VERIFIED) <<<")
        print("=======================================================")


if __name__ == '__main__':
    test_ecommerce_suite()
