import csv
import datetime
import logging
from decimal import Decimal

logger = logging.getLogger(__name__)
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
from apps.telegram_bot.services import send_telegram_notification
from .models import (
    Partner, BillingDocument, ReconciliationEntry,
    TenantAdminNote, TenantAuditLog, TenantSmsLog, TariffRequest
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
    tariff_requests = store.tariff_requests.select_related('merchant', 'processed_by').order_by('-created_at')[:30]

    # 4. Payments context (Merchant Subscriptions & Customer Gateways)
    subscription_payments = store.billing_documents.filter(status='PAID').order_by('-issue_date')
    total_subscription_paid = subscription_payments.aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')

    tx_qs = PaymentTransaction.objects.filter(store=store)
    total_tx_amount = tx_qs.filter(state='COMPLETED').aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')
    transactions = tx_qs.select_related('order').order_by('-created_at')[:80]
    total_all_payments = total_subscription_paid + total_tx_amount

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
        'tariff_requests': tariff_requests,
        'subscription_payments': subscription_payments,
        'total_subscription_paid': total_subscription_paid,
        'transactions': transactions,
        'total_tx_amount': total_tx_amount,
        'total_all_payments': total_all_payments,
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
def calculate_tariff_api(request, store_id):
    """
    Real-time interactive calculator API:
    Input: plan, amount (e.g. 500000), months, days, target_date
    Output: JSON with calculated days, amount, daily_rate, new_expiry
    """
    store = get_object_or_404(Store, id=store_id)
    plan = request.GET.get('plan') or request.POST.get('plan') or store.license_plan or 'STANDARD'
    amount = request.GET.get('amount') or request.POST.get('amount')
    months = request.GET.get('months') or request.POST.get('months')
    days = request.GET.get('days') or request.POST.get('days')
    target_date = request.GET.get('target_date') or request.POST.get('target_date')

    calc = store.calculate_extension(
        plan=plan,
        amount=amount,
        months=months,
        days=days,
        target_date=target_date
    )
    return JsonResponse({'status': 'ok', 'result': calc})


@superadmin_required
def renew_license_api(request, store_id):
    """
    BUY / License Extension API endpoint with intelligent calculator support.
    Calculates new expiry date, records ReconciliationEntry debit, creates an Invoice,
    updates balance, and closes TariffRequest if linked.
    """
    if request.method != 'POST':
        return HttpResponseForbidden("Only POST allowed")

    store = get_object_or_404(Store, id=store_id)
    plan = request.POST.get('plan', store.license_plan or 'STANDARD')
    calc_mode = request.POST.get('calc_mode', 'period') # 'amount', 'period', 'days', 'date'

    amount_raw = request.POST.get('amount', '').replace(' ', '').replace(',', '').strip()
    months_raw = request.POST.get('months', '').strip()
    days_raw = request.POST.get('days', '').strip()
    target_date = request.POST.get('target_date', '').strip() or None
    payment_status = request.POST.get('payment_status', 'PAID')
    notes = request.POST.get('notes', '').strip()
    request_id = request.POST.get('request_id')

    calc_amount = Decimal(amount_raw) if (amount_raw and amount_raw != '0') else None
    calc_months = int(months_raw) if (months_raw and months_raw.isdigit()) else None
    calc_days = int(days_raw) if (days_raw and days_raw.isdigit()) else None

    # Apply extension using Store.apply_tariff
    calc = store.apply_tariff(
        plan=plan,
        amount=calc_amount if (calc_mode == 'amount' or (calc_amount and not calc_months)) else None,
        months=calc_months if calc_mode == 'period' else None,
        days=calc_days if calc_mode == 'days' else None,
        payment_status=payment_status,
        payment_method="Продление администратором",
        notes=notes,
        admin_user=request.user
    )

    # Link & approve tariff request if specified
    if request_id and str(request_id).isdigit():
        t_req = TariffRequest.objects.filter(id=int(request_id), store=store).first()
        if t_req:
            t_req.status = TariffRequest.Statuses.APPROVED
            t_req.processed_by = request.user
            t_req.processed_at = timezone.now()
            t_req.admin_notes = notes or "Одобрена супер-администратором"
            t_req.save()

    # Send Telegram notification to merchant if bot configured
    try:
        msg = (
            f"🎉 <b>Hurmatli do'kon egasi!</b>\n\n"
            f"Sizning <b>{store.name}</b> do'koningiz tarif rejasi muvaffaqiyatli uzaytirildi!\n\n"
            f"📦 <b>Tarif:</b> {calc['plan_display']}\n"
            f"⏳ <b>Muddat:</b> +{calc['days']} kun\n"
            f"📅 <b>Yangi tugash sanasi:</b> {calc['new_expiry']}\n"
            f"💰 <b>To'lov summasi:</b> {calc['amount']:,.0f} UZS\n\n"
            f"Xizmatimizdan foydalanayotganingiz uchun rahmat!"
        )
        send_telegram_notification(store, msg)
    except Exception:
        pass

    messages.success(
        request,
        f"Лицензия сервера {store.subdomain} успешно продлена на {calc['days']} дн. (Тариф: {calc['plan_display']}) до {calc['new_expiry']}!"
    )

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'ok',
            'new_expiry': calc['new_expiry'],
            'days_added': calc['days'],
            'plan': calc['plan'],
            'plan_display': calc['plan_display'],
            'amount': calc['amount'],
            'message': 'Лицензия успешно продлена'
        })

    next_url = request.POST.get('next') or f"/super-admin/servers/{store.id}/?tab=subscriptions"
    return redirect(next_url)


@superadmin_required
def tariff_requests_list_view(request):
    """
    List of all Tariff Requests from merchants.
    """
    status_filter = request.GET.get('status', 'PENDING')
    search_query = request.GET.get('q', '').strip()

    qs = TariffRequest.objects.select_related('store', 'merchant', 'processed_by').order_by('-created_at')

    if status_filter and status_filter != 'ALL':
        qs = qs.filter(status=status_filter)

    if search_query:
        qs = qs.filter(
            Q(store__name__icontains=search_query) |
            Q(store__subdomain__icontains=search_query) |
            Q(contact_phone__icontains=search_query) |
            Q(notes__icontains=search_query) |
            Q(merchant__username__icontains=search_query) |
            Q(merchant__phone__icontains=search_query)
        )

    counts = {
        'total': TariffRequest.objects.count(),
        'pending': TariffRequest.objects.filter(status=TariffRequest.Statuses.PENDING).count(),
        'approved': TariffRequest.objects.filter(status=TariffRequest.Statuses.APPROVED).count(),
        'rejected': TariffRequest.objects.filter(status=TariffRequest.Statuses.REJECTED).count(),
    }

    paginator = Paginator(qs, 25)
    page_obj = paginator.get_page(request.GET.get('page', 1))

    return render(request, 'super_admin/tariff_requests.html', {
        'page_obj': page_obj,
        'tariff_requests': page_obj.object_list,
        'current_status': status_filter,
        'search_query': search_query,
        'counts': counts,
    })


@superadmin_required
def approve_tariff_request_api(request, request_id):
    """
    One-click approval of a tariff request.
    """
    if request.method != 'POST':
        return HttpResponseForbidden("Only POST allowed")

    t_req = get_object_or_404(TariffRequest, id=request_id)
    store = t_req.store
    amount = t_req.amount if t_req.amount > 0 else None

    calc = store.apply_tariff(
        plan=t_req.requested_plan,
        months=t_req.period_months if not amount else None,
        amount=amount,
        payment_method=t_req.get_payment_method_display(),
        notes=f"Одобрена заявка #{t_req.id} ({t_req.get_payment_method_display()})",
        admin_user=request.user
    )

    t_req.status = TariffRequest.Statuses.APPROVED
    t_req.processed_by = request.user
    t_req.processed_at = timezone.now()
    t_req.admin_notes = request.POST.get('admin_notes', '').strip() or "Одобрена супер-администратором"
    t_req.save()

    # Send telegram confirmation
    try:
        msg = (
            f"✅ <b>Sizning tarif arizangiz ma'qullandi!</b>\n\n"
            f"🏪 Do'kon: <b>{store.name}</b>\n"
            f"📦 Yangi tarif: <b>{calc['plan_display']}</b>\n"
            f"⏳ Amaldagi muddat: +{calc['days']} kun ({calc['new_expiry']} gacha)\n\n"
            f"StoreBox platformasida muvaffaqiyatli savdo tilaymiz!"
        )
        send_telegram_notification(store, msg)
    except Exception:
        pass

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'ok',
            'message': f"Заявка #{t_req.id} одобрена! Тариф {calc['plan_display']} активирован до {calc['new_expiry']}.",
            'new_expiry': calc['new_expiry']
        })

    messages.success(request, f"Заявка #{t_req.id} для {store.name} одобрена! Тариф активирован до {calc['new_expiry']}.")
    return redirect('/super-admin/tariff-requests/')


@superadmin_required
def reject_tariff_request_api(request, request_id):
    """
    Rejects a tariff request with optional note.
    """
    if request.method != 'POST':
        return HttpResponseForbidden("Only POST allowed")

    t_req = get_object_or_404(TariffRequest, id=request_id)
    notes = request.POST.get('admin_notes', '').strip() or "Отклонена администратором"

    t_req.status = TariffRequest.Statuses.REJECTED
    t_req.admin_notes = notes
    t_req.processed_by = request.user
    t_req.processed_at = timezone.now()
    t_req.save()

    messages.info(request, f"Заявка #{t_req.id} для {t_req.store.name} отклонена.")
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({'status': 'ok', 'message': f'Заявка #{t_req.id} отклонена.'})

    return redirect('/super-admin/tariff-requests/')


@superadmin_required
def send_tariff_reminder_api(request, store_id):
    """
    Sends manual reminder to store owner via Telegram / SMS.
    """
    if request.method != 'POST':
        return HttpResponseForbidden("Only POST allowed")

    store = get_object_or_404(Store, id=store_id)
    days_left = store.license_days_left
    days_str = f"{days_left} kun" if (days_left and days_left > 0) else "bugun"

    msg = (
        f"⚠️ <b>DIQQAT: Tarif muddati tugamoqda!</b>\n\n"
        f"Hurmatli <b>{store.name}</b> do'koni egasi!\n"
        f"Do'koningizning StoreBox obuna muddati <b>{days_str}</b> ichida yakunlanadi.\n\n"
        f"Xizmatlar, bot va veb-sayt to'xtab qolmasligi uchun tarifni o'z vaqtida uzaytirishingizni so'raymiz:\n"
        f"🔗 https://app.storebox.uz/dashboard/settings/tariffs/\n\n"
        f"Savollar bo'yicha: @storebox_support"
    )

    success, res_msg = send_telegram_notification(store, msg)

    # Log to SMS/notification log
    TenantSmsLog.objects.create(
        store=store,
        recipient=store.contact_phone or 'Telegram Bot',
        message_text=f"Напоминание о тарифе: осталось {days_str}",
        sms_type=TenantSmsLog.SmsTypes.SYSTEM,
        status=TenantSmsLog.Statuses.DELIVERED if success else TenantSmsLog.Statuses.FAILED,
        cost=Decimal('0.00')
    )

    TenantAuditLog.objects.create(
        store=store,
        actor=request.user,
        actor_name=str(request.user),
        action="Отправка напоминания о тарифе",
        details=f"Результат: {'Успешно' if success else 'Ошибка: ' + str(res_msg)}"
    )

    return JsonResponse({
        'status': 'ok' if success else 'error',
        'message': 'Напоминание успешно отправлено в Telegram' if success else f'Не удалось отправить: {res_msg}'
    })



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
def delete_server_api(request, store_id):
    """
    Safely delete a store and related resources with confirmation.
    """
    if request.method != 'POST':
        return HttpResponseForbidden("Only POST allowed")

    store = get_object_or_404(Store, id=store_id)
    store_name = store.name
    subdomain = store.subdomain
    logger.warning(
        "Store deleted: %s (%s.storebox.uz) by user %s [IP: %s]",
        store_name, subdomain, request.user.username, request.META.get('REMOTE_ADDR', '127.0.0.1')
    )

    store.delete()

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({'status': 'ok', 'message': f'Магазин {subdomain} успешно удален'})

    messages.success(request, f"Магазин {store_name} ({subdomain}.storebox.uz) успешно удален.")
    return redirect('/super-admin/servers/')


@superadmin_required
def cancel_subscription_api(request, store_id):
    """
    Cancel or revert subscription days for a store.
    """
    if request.method != 'POST':
        return HttpResponseForbidden("Only POST allowed")

    store = get_object_or_404(Store, id=store_id)
    days_raw = request.POST.get('days', '').strip()
    days_to_deduct = int(days_raw) if days_raw and days_raw.isdigit() else None
    reason = request.POST.get('reason', '').strip() or "Отмена администратором"

    res = store.cancel_subscription(
        days_to_deduct=days_to_deduct,
        admin_user=request.user,
        reason=reason
    )

    msg = f"Подписка для {store.subdomain} отозвана (-{res['revoked_days']} дн.). Новый срок: {res['new_expiry']}."
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({'status': 'ok', 'message': msg, 'result': res})

    messages.warning(request, msg)
    return redirect(f"/super-admin/servers/{store.id}/?tab=subscriptions")


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
    search_q = request.GET.get('q', '').strip()
    status_filter = request.GET.get('status', '').strip()

    qs = Partner.objects.annotate(
        stores_count=Count('stores'),
        active_count=Count('stores', filter=Q(stores__is_active=True))
    ).prefetch_related('stores').order_by('-id')

    if search_q:
        qs = qs.filter(
            Q(name__icontains=search_q) |
            Q(code__icontains=search_q) |
            Q(contact_person__icontains=search_q) |
            Q(phone__icontains=search_q) |
            Q(email__icontains=search_q)
        )

    if status_filter == 'active':
        qs = qs.filter(is_active=True)
    elif status_filter == 'inactive':
        qs = qs.filter(is_active=False)

    all_partners = Partner.objects.all()
    total_partners = all_partners.count()
    active_partners_count = all_partners.filter(is_active=True).count()
    total_commission_paid = all_partners.aggregate(Sum('balance'))['balance__sum'] or Decimal('0.00')
    avg_commission = all_partners.aggregate(Avg('commission_rate'))['commission_rate__avg'] or Decimal('15.0')

    context = {
        'partners': qs,
        'search_q': search_q,
        'status_filter': status_filter,
        'total_partners': total_partners,
        'active_partners_count': active_partners_count,
        'total_commission_paid': total_commission_paid,
        'avg_commission': avg_commission,
    }
    return render(request, 'super_admin/partners_list.html', context)


@superadmin_required
def partner_detail_api(request, partner_id):
    partner = get_object_or_404(Partner, id=partner_id)
    stores = []
    for s in partner.stores.all().order_by('-created_at'):
        bal = 0
        if hasattr(s, 'merchant_balance') and s.merchant_balance:
            bal = float(s.merchant_balance.balance)
        stores.append({
            'id': s.id,
            'name': s.name,
            'subdomain': s.subdomain,
            'company_name': s.company_name or '—',
            'phone': s.contact_phone or '—',
            'license_plan': s.get_license_plan_display(),
            'raw_plan': s.license_plan,
            'license_days_left': s.license_days_left,
            'license_status': s.license_status,
            'expires_at': s.license_expires_at.strftime('%d.%m.%Y') if s.license_expires_at else 'Бессрочно',
            'is_active': s.is_active,
            'storefront_url': s.get_storefront_url(),
            'balance': bal,
        })

    data = {
        'status': 'ok',
        'partner': {
            'id': partner.id,
            'name': partner.name,
            'code': partner.code,
            'commission_rate': str(partner.commission_rate),
            'balance': float(partner.balance),
            'contact_person': partner.contact_person or '',
            'phone': partner.phone or '',
            'email': partner.email or '',
            'notes': partner.notes or '',
            'is_active': partner.is_active,
            'stores_count': partner.stores.count(),
            'active_stores_count': partner.stores.filter(is_active=True).count(),
            'stores': stores,
        }
    }
    return JsonResponse(data)


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
def update_partner_api(request, partner_id):
    if request.method != 'POST':
        return HttpResponseForbidden("Only POST allowed")

    partner = get_object_or_404(Partner, id=partner_id)
    name = request.POST.get('name', '').strip()
    code = request.POST.get('code', '').strip().upper()
    contact_person = request.POST.get('contact_person', '').strip()
    phone = request.POST.get('phone', '').strip()
    email = request.POST.get('email', '').strip()
    rate_raw = request.POST.get('commission_rate', '').strip()
    notes = request.POST.get('notes', '').strip()
    is_active = request.POST.get('is_active') in ['true', '1', 'on', True]

    if not name or not code:
        messages.error(request, "Наименование и код обязательны")
        return redirect('super_admin:partners_list')

    if Partner.objects.filter(code=code).exclude(id=partner.id).exists():
        messages.error(request, f"Код партнера '{code}' уже используется другим партнером")
        return redirect('super_admin:partners_list')

    partner.name = name
    partner.code = code
    partner.contact_person = contact_person
    partner.phone = phone
    partner.email = email
    partner.notes = notes
    partner.is_active = is_active

    if rate_raw:
        try:
            partner.commission_rate = Decimal(rate_raw)
        except Exception:
            pass

    partner.save()
    messages.success(request, f"Данные партнера {name} [{code}] успешно обновлены")

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({'status': 'ok', 'message': f"Партнер {name} обновлен"})

    return redirect('super_admin:partners_list')


@superadmin_required
def delete_partner_api(request, partner_id):
    if request.method != 'POST':
        return HttpResponseForbidden("Only POST allowed")

    partner = get_object_or_404(Partner, id=partner_id)
    partner_name = partner.name
    partner_code = partner.code
    stores_count = partner.stores.count()

    partner.stores.update(partner=None)
    partner.delete()

    msg = f"Партнер {partner_name} [{partner_code}] успешно удален. Магазинов отвязано: {stores_count}."
    messages.success(request, msg)

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({'status': 'ok', 'message': msg})

    return redirect('super_admin:partners_list')


@superadmin_required
def toggle_partner_status_api(request, partner_id):
    if request.method != 'POST':
        return HttpResponseForbidden("Only POST allowed")

    partner = get_object_or_404(Partner, id=partner_id)
    partner.is_active = not partner.is_active
    partner.save(update_fields=['is_active', 'updated_at'])

    status_str = "активирован" if partner.is_active else "заблокирован"
    msg = f"Партнер {partner.name} [{partner.code}] {status_str}."

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'ok',
            'is_active': partner.is_active,
            'message': msg
        })

    messages.info(request, msg)
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


@superadmin_required
def update_server_api(request, store_id):
    if request.method != 'POST':
        return HttpResponseForbidden("Only POST allowed")

    store = get_object_or_404(Store, id=store_id)
    name = request.POST.get('name', '').strip()
    subdomain = request.POST.get('subdomain', '').strip().lower()
    company_name = request.POST.get('company_name', '').strip()
    contact_phone = request.POST.get('contact_phone', '').strip()
    partner_id = request.POST.get('partner_id', '').strip()
    license_plan = request.POST.get('license_plan', '').strip().upper()
    expires_at_raw = request.POST.get('license_expires_at', '').strip()
    admin_comment = request.POST.get('admin_comment', '').strip()
    is_active = request.POST.get('is_active') in ['true', '1', 'on', True]

    if not name or not subdomain:
        messages.error(request, "Название и поддомен обязательны")
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'status': 'error', 'message': "Название и поддомен обязательны"}, status=400)
        return redirect('super_admin:servers_list')

    if Store.objects.filter(subdomain=subdomain).exclude(id=store.id).exists():
        msg = f"Поддомен '{subdomain}' уже используется другим магазином"
        messages.error(request, msg)
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'status': 'error', 'message': msg}, status=400)
        return redirect('super_admin:servers_list')

    store.name = name
    store.subdomain = subdomain
    store.company_name = company_name
    store.phone = contact_phone
    if store.owner and contact_phone:
        store.owner.phone = contact_phone
        store.owner.save(update_fields=['phone'])
    store.admin_comment = admin_comment
    store.is_active = is_active

    if partner_id:
        try:
            store.partner = Partner.objects.get(id=int(partner_id))
        except (Partner.DoesNotExist, ValueError):
            store.partner = None
    else:
        store.partner = None

    valid_plans = [choice[0] for choice in Store._meta.get_field('license_plan').choices]
    if license_plan in valid_plans:
        store.license_plan = license_plan

    if expires_at_raw:
        try:
            if 'T' in expires_at_raw:
                dt = datetime.datetime.fromisoformat(expires_at_raw)
            else:
                dt = datetime.datetime.strptime(expires_at_raw, "%Y-%m-%d")
            if timezone.is_naive(dt):
                dt = timezone.make_aware(dt)
            store.license_expires_at = dt
        except Exception:
            pass

    store.save()
    messages.success(request, f"Магазин {store.name} ({store.subdomain}) успешно обновлен")

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({'status': 'ok', 'message': f"Магазин {store.name} обновлен"})

    return redirect('super_admin:servers_list')

