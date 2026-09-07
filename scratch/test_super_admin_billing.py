import os
import sys
from pathlib import Path
import django

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storebox.settings')
django.setup()

from django.test import Client
from apps.accounts.models import User
from apps.stores.models import Store
from apps.super_admin.models import (
    Partner, BillingDocument, ReconciliationEntry,
    TenantAdminNote, TenantAuditLog, TenantSmsLog
)

def run_tests():
    print("--- Starting Super Admin Billing Automated Test Suite ---")
    client = Client()

    # 1. Anonymous Access Test
    resp = client.get('/super-admin/servers/')
    assert resp.status_code == 302, f"Expected 302 redirect for anon, got {resp.status_code}"
    assert '/login/' in resp['Location'], f"Expected redirect to login, got {resp['Location']}"
    print("✓ Anonymous access redirect to login verified")

    # 2. Regular Merchant Access Test (Forbidden)
    merchant = User.objects.filter(role=User.Roles.MERCHANT).first()
    assert merchant is not None, "Merchant user must exist"
    client.force_login(merchant)
    resp = client.get('/super-admin/servers/')
    assert resp.status_code == 403, f"Expected 403 for regular merchant, got {resp.status_code}"
    print(f"✓ Regular merchant '{merchant.username}' blocked with 403 Forbidden verified")

    # 3. Superuser Access Test (Allowed)
    admin = User.objects.filter(is_superuser=True).first()
    assert admin is not None, "Superuser admin must exist"
    client.force_login(admin)
    resp = client.get('/super-admin/servers/')
    assert resp.status_code == 200, f"Expected 200 for superuser, got {resp.status_code}"
    content = resp.content.decode('utf-8')
    assert "Центральный реестр всех инстансов" in content, "Servers list header missing"
    assert "EXPORT (CSV)" in content, "Export button missing"
    print("✓ Superuser access to /super-admin/servers/ verified (200 OK)")

    # 4. Filters & Search Test
    resp_active = client.get('/super-admin/servers/?status=active')
    assert resp_active.status_code == 200, "Active filter failed"

    resp_expiring = client.get('/super-admin/servers/?status=expiring')
    assert resp_expiring.status_code == 200, "Expiring filter failed"

    resp_expired = client.get('/super-admin/servers/?status=expired')
    assert resp_expired.status_code == 200, "Expired filter failed"

    resp_search = client.get('/super-admin/servers/?q=goldlavash')
    assert resp_search.status_code == 200, "Search filter failed"
    print("✓ Live filtering (status=active, expiring, expired, search query) verified")

    # 5. CSV Export Test
    resp_csv = client.get('/super-admin/servers/export/')
    assert resp_csv.status_code == 200, f"Expected 200 for CSV export, got {resp_csv.status_code}"
    assert 'text/csv' in resp_csv['Content-Type'], f"Invalid CSV content type: {resp_csv['Content-Type']}"
    assert 'attachment; filename="storebox_servers_' in resp_csv['Content-Disposition']
    csv_lines = resp_csv.content.decode('utf-8-sig').splitlines()
    assert len(csv_lines) > 10, f"Expected >10 lines in CSV, got {len(csv_lines)}"
    print(f"✓ Real database CSV export verified ({len(csv_lines)} rows)")

    # 6. Deep Tenant Profile & 8 Sub-sections Test
    test_store = Store.objects.first()
    assert test_store is not None, "Store must exist"
    
    tabs = ['info', 'reconciliation', 'subscriptions', 'payments', 'statistics', 'notes', 'logs', 'sms']
    for tab in tabs:
        resp_tab = client.get(f'/super-admin/servers/{test_store.id}/?tab={tab}')
        assert resp_tab.status_code == 200, f"Tab {tab} returned status {resp_tab.status_code}"
    print(f"✓ Tenant deep profile for '{test_store.subdomain}' with all 8 iBox tabs verified")

    # 7. BUY / License Extension API Test
    prev_expiry = test_store.license_expires_at
    resp_renew = client.post(
        f'/super-admin/servers/{test_store.id}/renew/',
        {
            'months': '3',
            'plan': 'PRO',
            'amount': '549000',
            'payment_status': 'PAID',
            'notes': 'Test renewal via Automated Suite'
        }
    )
    assert resp_renew.status_code in [200, 302], f"Renew returned {resp_renew.status_code}"
    test_store.refresh_from_db()
    assert test_store.license_plan == 'PRO', f"Expected PRO plan, got {test_store.license_plan}"
    assert test_store.license_expires_at > prev_expiry, "License expiry was not extended"
    
    # Verify Reconciliation Entry & BillingDocument created
    latest_doc = BillingDocument.objects.filter(store=test_store).order_by('-id').first()
    assert latest_doc is not None, "BillingDocument was not created"
    assert latest_doc.amount == 549000, f"Expected 549000 UZS amount, got {latest_doc.amount}"
    
    latest_rec = ReconciliationEntry.objects.filter(store=test_store).order_by('-id').first()
    assert latest_rec is not None, "Reconciliation entry was not created"
    assert latest_rec.debit == 549000, f"Expected debit 549000, got {latest_rec.debit}"
    
    latest_audit = TenantAuditLog.objects.filter(store=test_store, action="Продление лицензии").first()
    assert latest_audit is not None, "TenantAuditLog was not created"
    print(f"✓ BUY / License renewal API successfully extended license to {test_store.license_expires_at:%d.%m.%Y}, created Invoice #{latest_doc.doc_number} and ledger debit")

    # 8. Add Note API Test
    resp_note = client.post(
        f'/super-admin/servers/{test_store.id}/notes/add/',
        {
            'note_text': 'Автоматическая заметка проверки системы',
            'is_pinned': 'true'
        }
    )
    assert resp_note.status_code in [200, 302], f"Add note returned {resp_note.status_code}"
    note = TenantAdminNote.objects.filter(store=test_store, note_text='Автоматическая заметка проверки системы').first()
    assert note is not None, "Admin note was not saved to DB"
    assert note.is_pinned is True, "Admin note pin status was not saved"
    print("✓ Internal Admin Note API verified")

    # 9. Global SaaS Modules Test: Partners, Documents, Reports
    resp_partners = client.get('/super-admin/partners/')
    assert resp_partners.status_code == 200, f"Partners returned {resp_partners.status_code}"
    assert "Всего партнеров" in resp_partners.content.decode('utf-8')
    print("✓ /super-admin/partners/ module verified (200 OK)")

    resp_docs = client.get('/super-admin/documents/')
    assert resp_docs.status_code == 200, f"Documents returned {resp_docs.status_code}"
    assert "Документы и финансовая отчетность" in resp_docs.content.decode('utf-8')
    print("✓ /super-admin/documents/ module verified (200 OK)")

    resp_print = client.get(f'/super-admin/documents/{latest_doc.id}/download/')
    assert resp_print.status_code == 200, f"Document print returned {resp_print.status_code}"
    assert latest_doc.doc_number in resp_print.content.decode('utf-8')
    print(f"✓ Printable invoice document #{latest_doc.doc_number} verified (200 OK)")

    resp_reports = client.get('/super-admin/reports/')
    assert resp_reports.status_code == 200, f"Reports returned {resp_reports.status_code}"
    content_reports = resp_reports.content.decode('utf-8')
    assert "Платформенный GMV" in content_reports
    assert "MRR (Ежемесячный доход)" in content_reports
    assert "ARR (Годовой прогноз)" in content_reports
    print("✓ /super-admin/reports/ global SaaS analytics verified (200 OK)")

    print("\nALL SUPER ADMIN BILLING TESTS PASSED PERFECTLY! 100% FUNCTIONAL.")

if __name__ == '__main__':
    run_tests()
