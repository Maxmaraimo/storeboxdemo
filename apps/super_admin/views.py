import csv
import datetime
from decimal import Decimal
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse, HttpResponseForbidden
from django.utils import timezone
from django.db.models import Sum, Count, Q, Avg
from django.utils.text import slugify
from django.contrib import messages
from django.core.paginator import Paginator

from apps.accounts.models import User
from apps.stores.models import Store, MerchantBalance
from apps.orders.models import Order
from apps.payments.models import PaymentTransaction
from .models import (
    Partner, BillingDocument, ReconciliationEntry,
    TenantAdminNote, TenantAuditLog, TenantSmsLog
)
from .decorators import superadmin_required


@superadmin_required
def root_redirect_view(request):
    return redirect('super_admin:servers_list')


@superadmin_required
def servers_list_view(request):
    """
    Main iBox-inspired Servers/Tenants Registry table.
    """
    query = request.GET.get('q', '').strip()
    partner_id = request.GET.get('partner')
    status_filter = request.GET.get('status', 'all')
    days_filter = request.GET.get('days')
    page_num = request.GET.get('page', 1)

    stores_qs = Store.objects.select_related('owner', 'partner', 'merchant_balance').prefetch_related('admin_notes').order_by('-created_at')

    # Search filter
    if query:
        stores_qs = stores_qs.filter(
            Q(name__icontains=query) |
            Q(subdomain__icontains=query) |
            Q(company_name__icontains=query) |
            Q(phone__icontains=query) |
            Q(owner__username__icontains=query) |
            Q(owner__first_name__icontains=query) |
            Q(owner__last_name__icontains=query) |
            Q(owner__phone__icontains=query)
        )

    # Partner filter
    if partner_id and partner_id.isdigit():
        stores_qs = stores_qs.filter(partner_id=int(partner_id))

    now = timezone.now()
    seven_days_later = now + datetime.timedelta(days=7)

    # Status filter
    if status_filter == 'active':
        stores_qs = stores_qs.filter(is_active=True).filter(
            Q(license_expires_at__isnull=True) | Q(license_expires_at__gt=seven_days_later)
        )
    elif status_filter == 'expiring':
        stores_qs = stores_qs.filter(
            is_active=True,
            license_expires_at__isnull=False,
            license_expires_at__gte=now,
            license_expires_at__lte=seven_days_later
        )
    elif status_filter == 'expired':
        stores_qs = stores_qs.filter(
            license_expires_at__isnull=False,
            license_expires_at__lt=now
        )
    elif status_filter == 'disabled':
        stores_qs = stores_qs.filter(is_active=False)

    # Specific days remaining filter
    if days_filter and days_filter.isdigit():
        target_days = int(days_filter)
        threshold_date = now + datetime.timedelta(days=target_days)
        stores_qs = stores_qs.filter(
            license_expires_at__isnull=False,
            license_expires_at__lte=threshold_date,
            license_expires_at__gte=now
        )

    # Global Counter aggregates for the KPI widgets
    all_stores = Store.objects.all()
    total_count = all_stores.count()
    active_count = all_stores.filter(is_active=True).filter(
        Q(license_expires_at__isnull=True) | Q(license_expires_at__gt=seven_days_later)
    ).count()
    expiring_count = all_stores.filter(
        is_active=True,
        license_expires_at__isnull=False,
        license_expires_at__gte=now,
        license_expires_at__lte=seven_days_later
    ).count()
    expired_count = all_stores.filter(
        license_expires_at__isnull=False,
        license_expires_at__lt=now
    ).count()

    paginator = Paginator(stores_qs, 25)
    page_obj = paginator.get_page(page_num)

    partners = Partner.objects.filter(is_active=True).order_by('name')

    context = {
        'stores': page_obj,
        'page_obj': page_obj,
        'partners': partners,
        'total_count': total_count,
        'active_count': active_count,
        'expiring_count': expiring_count,
        'expired_count': expired_count,
        'current_q': query,
        'current_partner': partner_id,
        'current_status': status_filter,
        'current_days': days_filter,
        'now': now,
    }
    return render(request, 'super_admin/servers_list.html', context)


@superadmin_required
def server_detail_view(request, store_id):
    """
    Tenant Deep Profile Hub with 8 iBox-style vertical sections:
    1. Information
    2. Reconciliation (Сверка)
    3. Subscriptions (Подписки)
    4. Payments (Платежи)
    5. Statistics
    6. Notes
    7. Logs
    8. Sent SMS
    """
    store = get_object_or_404(
        Store.objects.select_related('owner', 'partner', 'payment_settings'),
        id=store_id
    )

    active_tab = request.GET.get('tab', 'info')

    # Ensure MerchantBalance exists
    merchant_balance, _ = MerchantBalance.objects.get_or_create(store=store)

    # 1. Information context
    branches_count = store.branches.count()
    products_count = store.products.count()
    categories_count = store.categories.count()

    # 2. Reconciliation context
    reconciliation_entries = store.reconciliation_entries.select_related('reference_doc').order_by('-created_at')[:80]
    rec_aggregates = store.reconciliation_entries.aggregate(
        total_debit=Sum('debit'),
        total_credit=Sum('credit')
    )
    total_debit = rec_aggregates['total_debit'] or Decimal('0.00')
    total_credit = rec_aggregates['total_credit'] or Decimal('0.00')

    # 3. Subscriptions context
    invoices = store.billing_documents.filter(doc_type=BillingDocument.DocTypes.INVOICE).order_by('-issue_date')[:50]

    # 4. Payments context
    tx_qs = PaymentTransaction.objects.filter(store=store)
    total_tx_amount = tx_qs.filter(state='COMPLETED').aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')
    transactions = tx_qs.select_related('order').order_by('-created_at')[:80]

    # 5. Statistics context
    orders_count = store.orders.count()
    successful_orders = store.orders.filter(status__in=['ACCEPTED', 'READY', 'ON_WAY', 'DELIVERED', 'COMPLETED'])
    total_revenue = successful_orders.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0.00')
    avg_ticket = successful_orders.aggregate(Avg('total_amount'))['total_amount__avg'] or Decimal('0.00')
    delivered_orders_count = store.orders.filter(status='DELIVERED').count()
    cancelled_orders_count = store.orders.filter(status='CANCELLED').count()

    # Dynamic daily orders for chart (past 14 days)
    now = timezone.now()
    days_data = []
    labels_data = []
    for i in range(13, -1, -1):
        day_date = (now - datetime.timedelta(days=i)).date()
        labels_data.append(day_date.strftime('%d.%m'))
        cnt = store.orders.filter(created_at__date=day_date).count()
        days_data.append(cnt)

    # 6. Notes context
    notes = store.admin_notes.select_related('author').order_by('-is_pinned', '-created_at')

    # 7. Logs context
    audit_logs = store.audit_logs.select_related('actor').order_by('-created_at')[:100]

    # 8. SMS logs context
    sms_logs = store.sms_logs.order_by('-sent_at')[:100]
    sms_count = store.sms_logs.count()
    sms_total_cost = store.sms_logs.aggregate(Sum('cost'))['cost__sum'] or Decimal('0.00')

    partners = Partner.objects.filter(is_active=True).order_by('name')

    context = {
        'store': store,
        'active_tab': active_tab,
        'merchant_balance': merchant_balance,
        'branches_count': branches_count,
        'products_count': products_count,
        'categories_count': categories_count,
        'reconciliation_entries': reconciliation_entries,
        'total_debit': total_debit,
        'total_credit': total_credit,
        'invoices': invoices,
        'transactions': transactions,
        'total_tx_amount': total_tx_amount,
        'orders_count': orders_count,
        'total_revenue': total_revenue,
        'avg_ticket': avg_ticket,
        'delivered_orders_count': delivered_orders_count,
        'cancelled_orders_count': cancelled_orders_count,
        'chart_labels': labels_data,
        'chart_values': days_data,
        'notes': notes,
        'audit_logs': audit_logs,
        'sms_logs': sms_logs,
        'sms_count': sms_count,
        'sms_total_cost': sms_total_cost,
        'partners': partners,
    }
    return render(request, 'super_admin/server_detail.html', context)


@superadmin_required
def renew_license_api(request, store_id):
    """
    BUY / License Extension API endpoint.
    Calculates new expiry date, records ReconciliationEntry debit and creates an Invoice.
    """
    if request.method != 'POST':
        return HttpResponseForbidden("Only POST allowed")

    store = get_object_or_404(Store, id=store_id)
    months = int(request.POST.get('months', 1))
    plan = request.POST.get('plan', store.license_plan or 'STANDARD')
    amount_raw = request.POST.get('amount', '199000').replace(' ', '').replace(',', '')
    try:
        amount = Decimal(amount_raw)
    except Exception:
        amount = Decimal('199000.00')

    payment_status = request.POST.get('payment_status', 'PAID')
    notes = request.POST.get('notes', '').strip()

    now = timezone.now()
    if store.license_expires_at and store.license_expires_at > now:
        new_expiry = store.license_expires_at + datetime.timedelta(days=months * 30)
    else:
        new_expiry = now + datetime.timedelta(days=months * 30)

    store.license_plan = plan
    store.license_expires_at = new_expiry
    store.is_active = True
    store.save(update_fields=['license_plan', 'license_expires_at', 'is_active', 'updated_at'])

    # Create Invoice
    doc_num = f"INV-{now.strftime('%Y%m')}-{store.id:04d}-{BillingDocument.objects.count() + 1}"
    doc = BillingDocument.objects.create(
        doc_number=doc_num,
        doc_type=BillingDocument.DocTypes.INVOICE,
        store=store,
        partner=store.partner,
        amount=amount,
        status=payment_status,
        issue_date=now.date(),
        description=f"Продление лицензии на {months} мес. Тариф: {store.get_license_plan_display()}. {notes}".strip()
    )

    # Create Reconciliation Entry (Debit)
    merch_bal, _ = MerchantBalance.objects.get_or_create(store=store)
    new_bal = merch_bal.balance - amount
    merch_bal.balance = new_bal
    merch_bal.save(update_fields=['balance'])

    ReconciliationEntry.objects.create(
        store=store,
        operation_type=ReconciliationEntry.OperationTypes.LICENSE,
        debit=amount,
        credit=0,
        balance_after=new_bal,
        description=f"Продление лицензии ({months} мес.) до {new_expiry:%d.%m.%Y}",
        reference_doc=doc
    )

    # Log action
    TenantAuditLog.objects.create(
        store=store,
        actor=request.user,
        actor_name=f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username,
        action="Продление лицензии",
        details=f"Продлена лицензия на {months} мес. (Тариф: {store.license_plan}). Новая дата: {new_expiry:%d.%m.%Y}. Сумма: {amount:,.0f} UZS. Документ: #{doc_num}",
        ip_address=request.META.get('REMOTE_ADDR', '127.0.0.1')
    )

    messages.success(request, f"Лицензия сервера {store.subdomain} успешно продлена на {months} мес. до {new_expiry:%d.%m.%Y}!")
    
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'ok',
            'new_expiry': new_expiry.strftime('%d.%m.%Y'),
            'days_left': (new_expiry - now).days,
            'message': 'Лицензия успешно продлена'
        })

    return redirect(f"/super-admin/servers/{store.id}/?tab=subscriptions")


@superadmin_required
def toggle_server_status_api(request, store_id):
    """
    Toggle server active / inactive state.
    """
    if request.method != 'POST':
        return HttpResponseForbidden("Only POST allowed")

    store = get_object_or_404(Store, id=store_id)
    store.is_active = not store.is_active
    store.save(update_fields=['is_active', 'updated_at'])

    TenantAuditLog.objects.create(
        store=store,
        actor=request.user,
        actor_name=request.user.username,
        action="Изменение активности сервера",
        details=f"Сервер переведен в состояние: {'АКТИВЕН' if store.is_active else 'ЗАБЛОКИРОВАН / ОТКЛЮЧЕН'}",
        ip_address=request.META.get('REMOTE_ADDR', '127.0.0.1')
    )

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({'status': 'ok', 'is_active': store.is_active})
    
    messages.info(request, f"Статус сервера {store.subdomain} изменен: {'Активен' if store.is_active else 'Отключен'}")
    return redirect(f"/super-admin/servers/{store.id}/")


@superadmin_required
def add_tenant_note_api(request, store_id):
    """
    Add internal team memo for this tenant.
    """
    if request.method != 'POST':
        return HttpResponseForbidden("Only POST allowed")

    store = get_object_or_404(Store, id=store_id)
    text = request.POST.get('note_text', '').strip()
    is_pinned = request.POST.get('is_pinned') in ['true', '1', 'on', True]

    if text:
        TenantAdminNote.objects.create(
            store=store,
            author=request.user,
            note_text=text,
            is_pinned=is_pinned
        )
        TenantAuditLog.objects.create(
            store=store,
            actor=request.user,
            actor_name=request.user.username,
            action="Добавлена служебная заметка",
            details=f"Заметка: {text[:100]}...",
            ip_address=request.META.get('REMOTE_ADDR', '127.0.0.1')
        )
        messages.success(request, "Заметка сохранена")

    return redirect(f"/super-admin/servers/{store.id}/?tab=notes")


@superadmin_required
def delete_tenant_note_api(request, store_id, note_id):
    note = get_object_or_404(TenantAdminNote, id=note_id, store_id=store_id)
    note.delete()
    messages.info(request, "Заметка удалена")
    return redirect(f"/super-admin/servers/{store_id}/?tab=notes")


@superadmin_required
def export_servers_csv(request):
    """
    Exports full live database stores in standard CSV format.
    """
    response = HttpResponse(content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="storebox_servers_{timezone.now().strftime("%Y%m%d_%H%M")}.csv"'
    response.write('\ufeff')  # UTF-8 BOM for Excel

    writer = csv.writer(response)
    writer.writerow([
        'ID', 'Название', 'Поддомен', 'Партнер / Селлер',
        'Тариф', 'Дата окончания лицензии', 'Осталось дней',
        'Статус', 'Владелец (Username)', 'Имя клиента',
        'Телефон', 'Компания', 'Создан'
    ])

    stores = Store.objects.select_related('owner', 'partner').order_by('id')
    now = timezone.now()

    for s in stores:
        partner_name = s.partner.name if s.partner else 'StoreBox Direct'
        days = s.license_days_left
        status_text = 'Активен' if s.is_active else 'Отключен'
        if days is not None and days < 0:
            status_text += ' (Истек)'
        elif days is not None and days <= 7:
            status_text += ' (Истекает)'

        writer.writerow([
            s.id,
            s.name,
            s.subdomain,
            partner_name,
            s.get_license_plan_display(),
            s.license_expires_at.strftime('%d.%m.%Y') if s.license_expires_at else 'Бессрочно',
            days if days is not None else '∞',
            status_text,
            s.owner.username if s.owner else '',
            s.owner_display_name,
            s.contact_phone,
            s.company_name,
            s.created_at.strftime('%d.%m.%Y %H:%M')
        ])

    return response


@superadmin_required
def create_server_api(request):
    """
    Quick Add Server / Tenant modal POST handler.
    """
    if request.method != 'POST':
        return HttpResponseForbidden("Only POST allowed")

    name = request.POST.get('name', '').strip()
    subdomain = slugify(request.POST.get('subdomain', '').strip().lower())
    phone = request.POST.get('phone', '').strip()
    company_name = request.POST.get('company_name', '').strip()
    partner_id = request.POST.get('partner')
    plan = request.POST.get('plan', 'STANDARD')
    months = int(request.POST.get('months', 1))

    if not name or not subdomain:
        messages.error(request, "Название и поддомен обязательны")
        return redirect('super_admin:servers_list')

    if Store.objects.filter(subdomain=subdomain).exists():
        messages.error(request, f"Поддомен '{subdomain}' уже занят")
        return redirect('super_admin:servers_list')

    # Get or create user for this merchant
    clean_phone = phone.replace('+', '').replace(' ', '').replace('-', '')
    username = clean_phone if clean_phone else f"client_{subdomain}"
    owner = User.objects.filter(username=username).first()
    if not owner:
        owner = User.objects.create_user(
            username=username,
            phone=phone,
            role=User.Roles.MERCHANT,
            first_name=name
        )
        owner.set_password('123456')
        owner.save()

    partner = Partner.objects.filter(id=partner_id).first() if partner_id else None
    expiry = timezone.now() + datetime.timedelta(days=months * 30)

    store = Store.objects.create(
        owner=owner,
        name=name,
        subdomain=subdomain,
        company_name=company_name,
        partner=partner,
        license_plan=plan,
        license_expires_at=expiry,
        phone=phone,
        is_active=True
    )

    MerchantBalance.objects.create(store=store, balance=0)

    TenantAuditLog.objects.create(
        store=store,
        actor=request.user,
        actor_name=request.user.username,
        action="Создание сервера",
        details=f"Сервер зарегистрирован через Супер-Админ панель. План: {plan}, Лицензия до: {expiry:%d.%m.%Y}",
        ip_address=request.META.get('REMOTE_ADDR', '127.0.0.1')
    )

    messages.success(request, f"Сервер '{store.name}' ({store.subdomain}) успешно создан!")
    return redirect(f"/super-admin/servers/{store.id}/")


@superadmin_required
def partners_list_view(request):
    """
    Partners / Sellers Management Module.
    """
    partners = Partner.objects.annotate(
        stores_count=Count('stores'),
        active_count=Count('stores', filter=Q(stores__is_active=True))
    ).order_by('name')

    total_partners = partners.count()
    total_commission_paid = partners.aggregate(Sum('balance'))['balance__sum'] or Decimal('0.00')

    context = {
        'partners': partners,
        'total_partners': total_partners,
        'total_commission_paid': total_commission_paid,
    }
    return render(request, 'super_admin/partners_list.html', context)


@superadmin_required
def create_partner_api(request):
    if request.method != 'POST':
        return HttpResponseForbidden("Only POST allowed")

    name = request.POST.get('name', '').strip()
    code = request.POST.get('code', '').strip().upper()
    contact_person = request.POST.get('contact_person', '').strip()
    phone = request.POST.get('phone', '').strip()
    email = request.POST.get('email', '').strip()
    rate_raw = request.POST.get('commission_rate', '15.00')
    try:
        commission_rate = Decimal(rate_raw)
    except Exception:
        commission_rate = Decimal('15.00')

    if name and code:
        Partner.objects.create(
            name=name,
            code=code,
            contact_person=contact_person,
            phone=phone,
            email=email,
            commission_rate=commission_rate
        )
        messages.success(request, f"Партнер {name} [{code}] успешно добавлен")
    else:
        messages.error(request, "Наименование и уникальный код обязательны")

    return redirect('super_admin:partners_list')


@superadmin_required
def documents_list_view(request):
    """
    Invoices, Acts and Billing Documents Registry.
    """
    doc_type = request.GET.get('type')
    status = request.GET.get('status')
    search = request.GET.get('q', '').strip()

    docs = BillingDocument.objects.select_related('store', 'partner').order_by('-issue_date', '-id')

    if doc_type:
        docs = docs.filter(doc_type=doc_type)
    if status:
        docs = docs.filter(status=status)
    if search:
        docs = docs.filter(
            Q(doc_number__icontains=search) |
            Q(store__name__icontains=search) |
            Q(store__subdomain__icontains=search)
        )

    aggregates = BillingDocument.objects.aggregate(
        total_sum=Sum('amount'),
        paid_sum=Sum('amount', filter=Q(status=BillingDocument.Statuses.PAID)),
        pending_sum=Sum('amount', filter=Q(status=BillingDocument.Statuses.PENDING))
    )

    paginator = Paginator(docs, 30)
    page_obj = paginator.get_page(request.GET.get('page', 1))

    context = {
        'documents': page_obj,
        'page_obj': page_obj,
        'total_sum': aggregates['total_sum'] or Decimal('0.00'),
        'paid_sum': aggregates['paid_sum'] or Decimal('0.00'),
        'pending_sum': aggregates['pending_sum'] or Decimal('0.00'),
        'current_type': doc_type,
        'current_status': status,
        'current_search': search,
    }
    return render(request, 'super_admin/documents_list.html', context)


@superadmin_required
def document_download_view(request, doc_id):
    """
    Printable and downloadable official Invoice / Act document.
    """
    doc = get_object_or_404(
        BillingDocument.objects.select_related('store', 'partner', 'store__owner'),
        id=doc_id
    )
    return render(request, 'super_admin/document_print.html', {'doc': doc})


@superadmin_required
def reports_view(request):
    """
    Global SaaS Platform Analytics & Growth Metrics.
    """
    all_stores = Store.objects.all()
    total_stores = all_stores.count()
    active_stores = all_stores.filter(is_active=True).count()
    expired_stores = all_stores.filter(license_expires_at__lt=timezone.now()).count()

    # Gross Merchandise Value (GMV) across all platform orders
    all_orders = Order.objects.all()
    total_orders = all_orders.count()
    platform_gmv = all_orders.filter(status__in=['ACCEPTED', 'READY', 'ON_WAY', 'DELIVERED', 'COMPLETED']).aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0.00')

    # Estimated MRR based on active stores
    mrr_estimate = active_stores * 199000
    arr_estimate = mrr_estimate * 12

    # Category breakdown
    category_stats = all_stores.values('business_category').annotate(count=Count('id')).order_by('-count')[:6]

    # Top stores by order turnover
    top_stores = Store.objects.annotate(
        orders_total=Count('orders'),
        revenue=Sum('orders__total_amount', filter=Q(orders__status__in=['ACCEPTED', 'READY', 'ON_WAY', 'DELIVERED', 'COMPLETED']))
    ).order_by('-revenue')[:8]

    # Month by month store registration trends (last 6 months)
    now = timezone.now()
    trend_labels = []
    trend_counts = []
    for i in range(5, -1, -1):
        month_start = (now.replace(day=1) - datetime.timedelta(days=i*30)).replace(day=1)
        next_month = (month_start + datetime.timedelta(days=32)).replace(day=1)
        month_label = month_start.strftime('%b %Y')
        cnt = all_stores.filter(created_at__gte=month_start, created_at__lt=next_month).count()
        trend_labels.append(month_label)
        trend_counts.append(cnt)

    context = {
        'total_stores': total_stores,
        'active_stores': active_stores,
        'expired_stores': expired_stores,
        'total_orders': total_orders,
        'platform_gmv': platform_gmv,
        'mrr_estimate': mrr_estimate,
        'arr_estimate': arr_estimate,
        'category_stats': category_stats,
        'top_stores': top_stores,
        'trend_labels': trend_labels,
        'trend_counts': trend_counts,
    }
    return render(request, 'super_admin/reports.html', context)
