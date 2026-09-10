import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "storebox.settings")
django.setup()

from django.test import Client
from apps.accounts.models import User
from apps.stores.models import Store

def test_all():
    c = Client()
    print("--- 1. Testing Root Landing Page ---")
    res = c.get('/')
    assert res.status_code == 200, f"Landing failed: {res.status_code}"
    content = res.content.decode('utf-8')
    assert "StoreBox" in content
    assert "hero-dashboard-desktop.png" in content
    assert "hero-dashboard-mobile.png" in content
    assert "storefront-product-mobile.png" in content
    assert "restaurant-mobile.png" in content
    assert "design-studio-showcase.png" in content
    assert "chat-showcase.png" in content
    assert "imageLightboxModal" in content
    assert "openLightbox" in content
    assert "switchHeroDisplay" in content
    assert "planLinkStart" in content
    assert "planLinkBasic" in content
    assert "planLinkPro" in content
    assert "shop-655" in content
    print("Root landing page checks: PASSED!")

    print("--- 2. Testing Multilingual Landing (UZ, RU, EN) ---")
    for lang, expected_badge in [('uz', "StoreBox Dizayn Studiyasi"), ('ru', "StoreBox Дизайн Студия"), ('en', "StoreBox Design Studio")]:
        res = c.get(f'/?lang={lang}')
        assert res.status_code == 200
        cnt = res.content.decode('utf-8')
        assert expected_badge in cnt, f"Missing {expected_badge} in {lang}"
        print(f"Language {lang}: PASSED!")

    print("--- 3. Testing Registration with Plan Params ---")
    for plan, expected_text in [('start', 'Start'), ('basic', 'Basic'), ('pro', 'Professional')]:
        res = c.get(f'/register/?plan={plan}&duration=6')
        assert res.status_code == 200
        cnt = res.content.decode('utf-8')
        assert "Tanlangan tarif:" in cnt
        assert expected_text in cnt
        print(f"Registration with plan={plan}: PASSED!")

    print("--- 4. Testing Static Image Assets ---")
    for img in [
        'hero-dashboard-desktop.png',
        'hero-dashboard-mobile.png',
        'storefront-product-mobile.png',
        'restaurant-mobile.png',
        'design-studio-showcase.png',
        'chat-showcase.png'
    ]:
        res = c.get(f'/static/images/{img}')
        assert res.status_code == 200, f"Static asset {img} failed: {res.status_code}"
        print(f"Asset /static/images/{img}: 200 OK (FileResponse)")

    print("--- 5. Testing Storefront /store/shop-655/ ---")
    res = c.get('/store/shop-655/')
    assert res.status_code == 200
    cnt = res.content.decode('utf-8')
    assert "StoreBox Burger" in cnt
    print("Storefront shop-655: PASSED!")

    print("--- 6. Testing Merchant Dashboard Pages ---")
    user = User.objects.filter(role=User.Roles.MERCHANT).first()
    if not user:
        user = User.objects.create_user(username="998901112233", phone="+998901112233", password="testpass123", role=User.Roles.MERCHANT)
    store = Store.objects.filter(owner=user).first()
    if not store:
        store = Store.objects.filter(subdomain="shop-655").first()
    c.force_login(user)
    session = c.session
    if store:
        session['merchant_current_store_id'] = store.id
        session['current_store_subdomain'] = store.subdomain
        session.save()

    res_design = c.get('/dashboard/design/')
    assert res_design.status_code == 200, f"Design studio failed: {res_design.status_code}"
    print("Dashboard Design Studio (/dashboard/design/): 200 OK!")

    res_chats = c.get('/dashboard/chats/')
    assert res_chats.status_code == 200, f"Dashboard chats failed: {res_chats.status_code}"
    print("Dashboard Chats (/dashboard/chats/): 200 OK!")

    print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    test_all()
