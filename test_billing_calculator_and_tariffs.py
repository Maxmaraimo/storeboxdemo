import os
import sys
import json
import django
from decimal import Decimal
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storebox.settings')
django.setup()

from django.test import RequestFactory
from django.utils import timezone
from apps.accounts.models import User
from apps.stores.models import Store, MerchantBalance
from apps.super_admin.models import TariffRequest, BillingDocument, ReconciliationEntry, TenantAuditLog
from apps.api.views_settings import tariff_info_view, tariff_request_view, calculate_tariff_view
from apps.super_admin.views import calculate_tariff_api, renew_license_api, approve_tariff_request_api, reject_tariff_request_api, tariff_requests_list_view
from apps.storefront.views import storefront_home_view
from apps.core.middleware import SubdomainTenantMiddleware
from django.contrib.messages.storage.fallback import FallbackStorage
from django.contrib.sessions.backends.db import SessionStore

def setup_request(req, user=None, store_id=None):
    if user:
        req.user = user
    req.session = SessionStore()
    if store_id:
        req.session['merchant_current_store_id'] = store_id
    req._messages = FallbackStorage(req)
    req._dont_enforce_csrf_checks = True
    return req

def run_tests():
    print("=" * 60)
    print("🚀 RUNNING END-TO-END BILLING & TARIFFS TEST SUITE")
    print("=" * 60)

    # 1. Test Superuser & Merchant User
    admin = User.objects.filter(is_superuser=True).first()
    if not admin:
        admin = User.objects.create_superuser('test_admin', 'admin@storebox.uz', 'pass123')
    
    merchant = User.objects.filter(role=User.Roles.MERCHANT).first()
    if not merchant:
        merchant = User.objects.create_user('test_merchant', 'merchant@storebox.uz', 'pass123', role=User.Roles.MERCHANT, phone='+998901112233')

    # 2. Test 7-Day Free Trial Auto-Creation
    test_subdomain = f"test-calc-{int(timezone.now().timestamp())}"
    store = Store.objects.create(
        owner=merchant,
        name="Test Billing Shop",
        subdomain=test_subdomain,
        license_plan="STANDARD"
    )
    print(f"\n[1] Store created: {store.name} ({store.subdomain})")
    assert store.license_expires_at is not None, "❌ Error: license_expires_at was not set!"
    days_to_expiry = (store.license_expires_at - timezone.now()).days
    assert 6 <= days_to_expiry <= 8, f"❌ Error: Expected ~7 days trial, got {days_to_expiry}"
    print(f"  ✓ 7-Day free trial auto-applied: expires at {store.license_expires_at:%d.%m.%Y} (days left: {store.license_days_left})")

    # 3. Test Intelligent Calculator: Custom Amount 500,000 UZS
    # Standard plan: 199,000 UZS/mo -> 199,000 should give exactly 30 days, 500,000 gives 75 days
    calc_std_exact = store.calculate_extension(plan='STANDARD', amount=Decimal('199000'))
    assert calc_std_exact['days'] == 30, f"❌ Expected 30 days for 199k on STANDARD, got {calc_std_exact['days']}"
    print(f"  ✓ STANDARD 199,000 UZS -> {calc_std_exact['days']} days (+{calc_std_exact['new_expiry']})")

    calc_std = store.calculate_extension(plan='STANDARD', amount=Decimal('500000'))
    assert calc_std['days'] == 75, f"❌ Expected 75 days for 500k on STANDARD, got {calc_std['days']}"
    print(f"  ✓ STANDARD 500,000 UZS -> {calc_std['days']} days (+{calc_std['new_expiry']})")

    # Start plan: 99,000 UZS/mo -> 99,000 should give 30 days, 500,000 gives 151 days
    calc_start_exact = store.calculate_extension(plan='START', amount=Decimal('99000'))
    assert calc_start_exact['days'] == 30, f"❌ Expected 30 days for 99k on START, got {calc_start_exact['days']}"
    calc_start = store.calculate_extension(plan='START', amount=Decimal('500000'))
    assert calc_start['days'] == 151, f"❌ Expected 151 days for 500k on START, got {calc_start['days']}"
    print(f"  ✓ START 99,000 UZS -> 30 days, 500,000 UZS -> {calc_start['days']} days")

    # Pro plan: 399,000 UZS/mo -> 399,000 gives 30 days, 500,000 gives 37 days
    calc_pro_exact = store.calculate_extension(plan='PRO', amount=Decimal('399000'))
    assert calc_pro_exact['days'] == 30, f"❌ Expected 30 days for 399k on PRO, got {calc_pro_exact['days']}"
    calc_pro = store.calculate_extension(plan='PRO', amount=Decimal('500000'))
    assert calc_pro['days'] == 37, f"❌ Expected 37 days for 500k on PRO, got {calc_pro['days']}"
    print(f"  ✓ PRO 399,000 UZS -> 30 days, 500,000 UZS -> {calc_pro['days']} days")

    # Test discounts for 6 months (-10%) and 12 months (-20%) on STANDARD (199,000 UZS)
    calc_6m = store.calculate_extension(plan='STANDARD', months=6)
    expected_6m = float(Decimal('199000') * 6 * Decimal('0.90'))
    assert calc_6m['amount'] == expected_6m, f"❌ Expected {expected_6m} for 6m, got {calc_6m['amount']}"
    print(f"  ✓ STANDARD 6 Months (-10%) -> {calc_6m['amount']:,.0f} UZS (180 days)")

    calc_12m = store.calculate_extension(plan='STANDARD', months=12)
    expected_12m = float(Decimal('199000') * 12 * Decimal('0.80'))
    assert calc_12m['amount'] == expected_12m, f"❌ Expected {expected_12m} for 12m, got {calc_12m['amount']}"
    print(f"  ✓ STANDARD 12 Months (-20%) -> {calc_12m['amount']:,.0f} UZS (360 days)")

    # 4. Test Super-Admin Calculator API
    factory = RequestFactory()
    req_calc = factory.get(f'/super-admin/servers/{store.id}/calculate/?plan=STANDARD&amount=199000')
    setup_request(req_calc, user=admin)
    res_calc = calculate_tariff_api(req_calc, store.id)
    assert res_calc.status_code == 200
    res_calc_data = res_calc.content.decode('utf-8')
    assert '"days": 30' in res_calc_data
    print("  ✓ Super-Admin calculate_tariff_api endpoint passed (199k = 30 days)")

    # 5. Test Super-Admin License Extension by Custom Amount (500 000 UZS)
    old_expiry = store.license_expires_at
    req_renew = factory.post(f'/super-admin/servers/{store.id}/renew/', {
        'plan': 'STANDARD',
        'calc_mode': 'amount',
        'amount': '500000',
        'payment_status': 'PAID',
        'notes': 'Test payment 500k'
    }, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
    setup_request(req_renew, user=admin)
    res_renew = renew_license_api(req_renew, store.id)
    assert res_renew.status_code == 200
    store.refresh_from_db()
    assert store.license_expires_at > old_expiry, "❌ Expiry was not extended!"
    print(f"  ✓ Super-Admin renew_license_api (500k) passed: New expiry is {store.license_expires_at:%d.%m.%Y %H:%M}")

    # Verify Invoice, ReconciliationEntry and Merchant Balance credited
    inv = BillingDocument.objects.filter(store=store).first()
    assert inv is not None, "❌ Invoice not created!"
    assert inv.amount == Decimal('500000.00'), f"❌ Expected 500k invoice, got {inv.amount}"
    recon = ReconciliationEntry.objects.filter(store=store, operation_type='TOPUP').first()
    assert recon is not None, "❌ ReconciliationEntry TOPUP not created!"
    mb = MerchantBalance.objects.get(store=store)
    assert mb.balance >= Decimal('500000.00'), f"❌ Balance should be credited with 500k, got {mb.balance}"
    print(f"  ✓ Invoice #{inv.doc_number} ({inv.amount:,.0f} UZS), ReconciliationEntry TOPUP, and Merchant Balance ({mb.balance:,.0f} UZS) verified")

    # 6. Test Merchant Dashboard Tariff Info API
    req_m_info = factory.get('/api/v1/billing/tariff-info/')
    setup_request(req_m_info, user=merchant, store_id=store.id)
    res_m_info = tariff_info_view(req_m_info)
    assert res_m_info.status_code == 200
    info_data = res_m_info.data
    assert info_data['store']['id'] == store.id
    assert len(info_data['plans']) == 4
    # Check updated price in plans
    start_plan = next(p for p in info_data['plans'] if p['code'] == 'START')
    assert start_plan['monthly_price'] == 99000, f"Expected 99k for START, got {start_plan['monthly_price']}"
    print(f"  ✓ Merchant tariff_info_view returned store info: Plan={info_data['store']['plan_display']}, Balance={info_data['store']['balance']}, START price={start_plan['monthly_price']}")

    # 7. Test Merchant Submitting Tariff Request (Bank Transfer / Invoice)
    req_sub = factory.post('/api/v1/billing/tariff-request/', data=json.dumps({
        'plan': 'PRO',
        'months': 3,
        'payment_method': 'BANK_TRANSFER',
        'contact_phone': '+998909998877',
        'notes': 'Please send invoice to LLC StoreBox'
    }), content_type='application/json')
    setup_request(req_sub, user=merchant, store_id=store.id)
    res_sub = tariff_request_view(req_sub)
    assert res_sub.status_code == 200, f"Error: {getattr(res_sub, 'data', None)}"
    sub_data = res_sub.data
    assert sub_data['status'] == 'success'
    assert sub_data['auto_activated'] is False
    req_id = sub_data['request_id']
    print(f"  ✓ Merchant submitted TariffRequest #{req_id} for plan PRO (3 months, {sub_data['amount']:,.0f} UZS)")

    # 8. Test Super-Admin Approving the Tariff Request
    t_req = TariffRequest.objects.get(id=req_id)
    assert t_req.status == TariffRequest.Statuses.PENDING
    pre_appr_balance = MerchantBalance.objects.get(store=store).balance
    req_appr = factory.post(f'/super-admin/tariff-requests/{req_id}/approve/', {
        'admin_notes': 'Bank payment received via treasury'
    }, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
    setup_request(req_appr, user=admin)
    res_appr = approve_tariff_request_api(req_appr, req_id)
    assert res_appr.status_code == 200
    t_req.refresh_from_db()
    assert t_req.status == TariffRequest.Statuses.APPROVED
    store.refresh_from_db()
    assert store.license_plan == 'PRO'
    post_appr_balance = MerchantBalance.objects.get(store=store).balance
    assert post_appr_balance > pre_appr_balance, "❌ Balance was not credited upon request approval!"
    print(f"  ✓ Super-Admin approved Request #{req_id}: Store plan=PRO, balance credited from {pre_appr_balance:,.0f} to {post_appr_balance:,.0f} UZS")

    # 9. Test Merchant Direct Payment via Balance
    mb = MerchantBalance.objects.get(store=store)
    # First test: balance insufficient (reduce to 10k)
    mb.balance = Decimal('10000') # only 10k
    mb.save()
    req_bal_fail = factory.post('/api/v1/billing/tariff-request/', data=json.dumps({
        'plan': 'START',
        'months': 1,
        'payment_method': 'BALANCE'
    }), content_type='application/json')
    setup_request(req_bal_fail, user=merchant, store_id=store.id)
    res_bal_fail = tariff_request_view(req_bal_fail)
    assert res_bal_fail.status_code == 400, "❌ Should fail when balance is insufficient"
    print(f"  ✓ Insufficient balance check passed (blocked with 400 error)")

    # Second test: top up balance to 500,000 and pay for START (99k)
    mb.balance = Decimal('500000')
    mb.save()
    req_bal_ok = factory.post('/api/v1/billing/tariff-request/', data=json.dumps({
        'plan': 'START',
        'months': 1,
        'payment_method': 'BALANCE'
    }), content_type='application/json')
    setup_request(req_bal_ok, user=merchant, store_id=store.id)
    res_bal_ok = tariff_request_view(req_bal_ok)
    assert res_bal_ok.status_code == 200
    bal_ok_data = res_bal_ok.data
    assert bal_ok_data['auto_activated'] is True
    mb.refresh_from_db()
    expected_bal = Decimal('500000') - Decimal('99000')
    assert mb.balance == expected_bal, f"❌ Expected {expected_bal} balance, got {mb.balance}"
    print(f"  ✓ Balance payment successful: 99k deducted, new balance: {mb.balance:,.0f} UZS")

    # 10. Test Cancel Subscription
    from apps.super_admin.views import cancel_subscription_api, delete_server_api
    store.refresh_from_db()
    cancel_days = 30
    cancel_refund = 99000
    pre_cancel_bal = mb.balance
    pre_cancel_expiry = store.license_expires_at
    req_cancel = factory.post(f'/super-admin/servers/{store.id}/cancel-subscription/', {
        'days': str(cancel_days),
        'refund_amount': str(cancel_refund),
        'reason': 'Customer requested refund'
    }, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
    setup_request(req_cancel, user=admin)
    res_cancel = cancel_subscription_api(req_cancel, store.id)
    assert res_cancel.status_code == 200
    store.refresh_from_db()
    mb.refresh_from_db()
    assert store.license_expires_at < pre_cancel_expiry, f"❌ Expiry was not rolled back! pre: {pre_cancel_expiry}, post: {store.license_expires_at}"
    assert mb.balance == pre_cancel_bal - Decimal(str(cancel_refund)), f"❌ Balance refund mismatch! {mb.balance} vs {pre_cancel_bal - Decimal(str(cancel_refund))}"
    print(f"  ✓ cancel_subscription_api passed: days rolled back, balance adjusted to {mb.balance:,.0f} UZS")

    # 11. Test Storefront Access vs Expired Suspension
    def dummy_get_response(request):
        from django.http import HttpResponse
        return HttpResponse("Storefront OK", status=200)

    middleware = SubdomainTenantMiddleware(dummy_get_response)
    req_sf_ok = factory.get(f'/store/{store.subdomain}/')
    setup_request(req_sf_ok)
    res_sf_ok = middleware(req_sf_ok)
    assert res_sf_ok.status_code == 200
    print(f"  ✓ Active storefront returned 200 OK")

    # Store expires -> Storefront returns 403 Suspended
    store.license_expires_at = timezone.now() - datetime.timedelta(days=2)
    store.save()
    assert store.is_expired is True, "❌ Store should be marked expired!"
    
    req_sf_exp = factory.get(f'/store/{store.subdomain}/')
    setup_request(req_sf_exp)
    res_sf_exp = middleware(req_sf_exp)
    assert res_sf_exp.status_code == 403, f"❌ Expected 403 Suspended for expired store, got {res_sf_exp.status_code}"
    assert "Do'kon vaqtincha faol emas" in res_sf_exp.content.decode('utf-8')
    print(f"  ✓ Expired store correctly suspended with 403 on storefront")

    # 12. Test Store Delete API
    req_del = factory.post(f'/super-admin/servers/{store.id}/delete/', {
        'confirm_name': store.name
    }, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
    setup_request(req_del, user=admin)
    res_del = delete_server_api(req_del, store.id)
    assert res_del.status_code == 200
    assert not Store.objects.filter(id=store.id).exists(), "❌ Store was not deleted!"
    print(f"  ✓ delete_server_api passed: Store safely removed and audited")

    print("\n" + "=" * 60)
    print("🎉 ALL BILLING & TARIFF TESTS PASSED PERFECTLY!")
    print("=" * 60)

if __name__ == '__main__':
    run_tests()

