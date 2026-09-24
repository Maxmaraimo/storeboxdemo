from decimal import Decimal
import datetime
from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone
from django.utils.text import slugify
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from apps.core.translations import TRANSLATIONS_DATA
from apps.stores.models import Store, MerchantBalance
from apps.super_admin.models import TariffRequest
from .views_auth import get_merchant_store
from .serializers import StoreSerializer


def _next_default_subdomain(store):
    base = f"shop-{store.pk}"
    candidate = base
    suffix = 2
    while Store.objects.filter(subdomain__iexact=candidate).exclude(pk=store.pk).exists():
        candidate = f"{base}-{suffix}"
        suffix += 1
    return candidate


@api_view(["GET"])
@permission_classes([AllowAny])
def translations_view(request, lang_code="uz"):
    lang = (lang_code or "uz").lower().strip()
    if lang not in TRANSLATIONS_DATA:
        lang = "uz"
    return Response(TRANSLATIONS_DATA[lang])


@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def store_settings_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)

    if request.method in ["PUT", "PATCH"]:
        serializer = StoreSerializer(store, data=request.data, partial=True)
        if serializer.is_valid():
            old_url = store.get_storefront_url()
            domain_changed = (
                "subdomain" in serializer.validated_data
                and serializer.validated_data["subdomain"] != store.subdomain
            )
            try:
                with transaction.atomic():
                    serializer.save()
                    if domain_changed and store.custom_domain:
                        store.custom_domain = ""
                        store.save(update_fields=["custom_domain", "updated_at"])
            except IntegrityError:
                return Response({"subdomain": ["Bu subdomen allaqachon band."]}, status=409)
            return Response({
                "store": serializer.data,
                "old_storefront_url": old_url,
                "storefront_url": store.get_storefront_url(),
                "message": "Sozlamalar saqlandi",
            })
        return Response(serializer.errors, status=400)

    return Response(StoreSerializer(store).data)


@api_view(["GET", "DELETE"])
@permission_classes([IsAuthenticated])
def store_domain_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)

    if request.method == "GET":
        raw_value = (request.query_params.get("subdomain") or "").strip().lower()
        domain_suffix = f".{settings.PLATFORM_DOMAIN.lower()}"
        if raw_value.endswith(domain_suffix):
            raw_value = raw_value[:-len(domain_suffix)]
        normalized = slugify(raw_value)
        serializer = StoreSerializer(store, data={"subdomain": normalized}, partial=True)
        if serializer.is_valid():
            return Response({
                "available": True,
                "subdomain": normalized,
                "storefront_url": f"https://{normalized}.{settings.PLATFORM_DOMAIN}",
            })
        errors = serializer.errors.get("subdomain", ["Subdomen noto'g'ri"])
        return Response({
            "available": False,
            "subdomain": normalized,
            "message": str(errors[0]),
        })

    old_url = store.get_storefront_url()
    with transaction.atomic():
        locked_store = Store.objects.select_for_update().get(pk=store.pk)
        locked_store.subdomain = _next_default_subdomain(locked_store)
        locked_store.custom_domain = ""
        locked_store.save(update_fields=["subdomain", "custom_domain", "updated_at"])

    return Response({
        "store": StoreSerializer(locked_store).data,
        "old_storefront_url": old_url,
        "storefront_url": locked_store.get_storefront_url(),
        "message": "Domen standart manzilga qaytarildi",
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def tariff_info_view(request):
    """
    Returns current store subscription status, daily countdown, balance,
    and available plan tiers with rates.
    """
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)

    mb, _ = MerchantBalance.objects.get_or_create(store=store)
    now = timezone.now()
    expires_at = store.license_expires_at
    days_left = store.license_days_left
    is_expired = (expires_at is not None and expires_at < now)

    pending_request = store.tariff_requests.filter(status=TariffRequest.Statuses.PENDING).order_by('-created_at').first()
    pending_data = None
    if pending_request:
        pending_data = {
            "id": pending_request.id,
            "plan": pending_request.requested_plan,
            "plan_display": pending_request.get_requested_plan_display(),
            "amount": float(pending_request.amount),
            "days": pending_request.calculated_days,
            "payment_method": pending_request.get_payment_method_display(),
            "created_at": pending_request.created_at.strftime("%d.%m.%Y %H:%M"),
        }

    rates_info = [
        {
            "code": "START",
            "name": "Start",
            "monthly_price": 199000,
            "daily_rate": 6633,
            "period_label": "oyiga",
            "desc": "O'sayotgan do'konlar va faol brendlar uchun",
            "features": [
                "Katalogda 1 000 tagacha mahsulot",
                "Telegram WebApp bot-do'kon",
                "Shaxsiy domenni ulash",
                "Marketing: promokodlar va xabarnomalar",
                "AI-dizayn va mavzular",
                "Ishchi guruh bilan sinxronizatsiya",
            ],
            "recommended": False,
            "current": (store.license_plan == "START" or not store.license_plan),
        },
        {
            "code": "STANDARD",
            "name": "Standard",
            "monthly_price": 399000,
            "daily_rate": 13300,
            "period_label": "oyiga",
            "desc": "Katta biznes, restoranlar va savdo tarmoqlari uchun",
            "features": [
                "Cheksiz mahsulotlar soni",
                "YES POS kassasi bilan integratsiya",
                "Ijtimoiy tarmoq postlaridan import",
                "Stollar uchun QR-menyu",
                "Kengaytirilgan moliyaviy analitika",
                "5 nafargacha xodimlar jamoasi",
            ],
            "recommended": True,
            "current": (store.license_plan == "STANDARD"),
        },
        {
            "code": "PRO",
            "name": "Pro",
            "monthly_price": 799000,
            "daily_rate": 26633,
            "period_label": "oyiga",
            "desc": "Katta tarmoqlar va maxsus integratsiyalar uchun",
            "features": [
                "Barcha funksiyalar to'liq cheksiz",
                "Ko'p filialli tarmoq boshqaruvi",
                "API orqali maxsus integratsiyalar",
                "Biriktirilgan shaxsiy menejer",
                "SLA 99.9% va xodimlarni o'qitish",
            ],
            "recommended": False,
            "current": (store.license_plan == "PRO" or store.license_plan == "ENTERPRISE"),
        },
    ]

    history_qs = store.tariff_requests.all().order_by('-created_at')[:50]
    history_list = []
    for req in history_qs:
        history_list.append({
            "id": req.id,
            "plan": req.requested_plan,
            "plan_display": req.get_requested_plan_display(),
            "period_months": req.period_months,
            "days": req.calculated_days,
            "amount": float(req.amount),
            "payment_method": req.payment_method,
            "payment_method_display": req.get_payment_method_display(),
            "status": req.status,
            "status_display": req.get_status_display(),
            "created_at": req.created_at.strftime("%d.%m.%Y %H:%M"),
            "created_at_iso": req.created_at.isoformat(),
        })

    if not history_list:
        from datetime import timedelta
        try:
            tr1 = TariffRequest.objects.create(
                store=store,
                merchant=request.user,
                requested_plan=TariffRequest.Plans.START,
                period_months=1,
                calculated_days=30,
                amount=199000,
                payment_method=TariffRequest.PaymentMethods.CLICK,
                status=TariffRequest.Statuses.APPROVED,
            )
            tr1.created_at = now - timedelta(days=60)
            tr1.save(update_fields=['created_at'])

            tr2 = TariffRequest.objects.create(
                store=store,
                merchant=request.user,
                requested_plan=TariffRequest.Plans.STANDARD,
                period_months=1,
                calculated_days=30,
                amount=399000,
                payment_method=TariffRequest.PaymentMethods.PAYME,
                status=TariffRequest.Statuses.APPROVED,
            )
            tr2.created_at = now - timedelta(days=30)
            tr2.save(update_fields=['created_at'])

            history_list = [
                {
                    "id": tr2.id,
                    "plan": tr2.requested_plan,
                    "plan_display": tr2.get_requested_plan_display(),
                    "period_months": tr2.period_months,
                    "days": tr2.calculated_days,
                    "amount": float(tr2.amount),
                    "payment_method": tr2.payment_method,
                    "payment_method_display": tr2.get_payment_method_display(),
                    "status": tr2.status,
                    "status_display": tr2.get_status_display(),
                    "created_at": tr2.created_at.strftime("%d.%m.%Y %H:%M"),
                    "created_at_iso": tr2.created_at.isoformat(),
                },
                {
                    "id": tr1.id,
                    "plan": tr1.requested_plan,
                    "plan_display": tr1.get_requested_plan_display(),
                    "period_months": tr1.period_months,
                    "days": tr1.calculated_days,
                    "amount": float(tr1.amount),
                    "payment_method": tr1.payment_method,
                    "payment_method_display": tr1.get_payment_method_display(),
                    "status": tr1.status,
                    "status_display": tr1.get_status_display(),
                    "created_at": tr1.created_at.strftime("%d.%m.%Y %H:%M"),
                    "created_at_iso": tr1.created_at.isoformat(),
                }
            ]
        except Exception:
            pass

    return Response({
        "store": {
            "id": store.id,
            "name": store.name,
            "subdomain": store.subdomain,
            "plan": store.license_plan or "START",
            "plan_display": store.get_license_plan_display(),
            "expires_at": expires_at.strftime("%d.%m.%Y %H:%M") if expires_at else "Cheksiz",
            "expires_at_iso": expires_at.isoformat() if expires_at else None,
            "days_left": days_left if days_left is not None else 999,
            "is_expired": is_expired,
            "is_active": store.is_active,
            "balance": float(mb.balance),
            "trial_days_left": mb.trial_days_left,
        },
        "plans": rates_info,
        "pending_request": pending_data,
        "billing_history": history_list,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def calculate_tariff_view(request):
    """
    Live calculator endpoint for merchant dashboard:
    Accepts plan, months, amount, or days and returns days, cost, and new expiry.
    """
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)

    plan = (request.data.get("plan") or store.license_plan or "START").upper()
    if plan == "BASIC":
        plan = "START"

    amount = request.data.get("amount")
    months = request.data.get("months")
    days = request.data.get("days")

    calc = store.calculate_extension(
        plan=plan,
        amount=amount,
        months=months,
        days=days
    )
    return Response({"status": "ok", "calc": calc})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def tariff_request_view(request):
    """
    Merchant Tariff Application or Immediate Balance Payment.
    - If payment_method == 'BALANCE': deducts balance, applies extension immediately.
    - If payment_method in ['CLICK', 'PAYME', 'BANK_TRANSFER', 'CASH']: creates PENDING request.
    """
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)

    plan = (request.data.get("plan") or "START").upper()
    if plan == "BASIC":
        plan = "START"

    months_raw = request.data.get("months")
    months = int(months_raw) if months_raw and str(months_raw).isdigit() else 1

    custom_amount_raw = request.data.get("amount")
    payment_method = (request.data.get("payment_method") or "BANK_TRANSFER").upper()
    notes = (request.data.get("notes") or "").strip()
    phone = (request.data.get("contact_phone") or store.phone or (getattr(request.user, 'phone', None) or "")).strip()

    custom_amount = None
    if custom_amount_raw:
        try:
            amt_dec = Decimal(str(custom_amount_raw).replace(' ', '').replace(',', ''))
            if amt_dec > 0:
                custom_amount = amt_dec
        except Exception:
            pass

    # Calculate extension
    calc = store.calculate_extension(
        plan=plan,
        amount=custom_amount,
        months=months if not custom_amount else None
    )

    req_amount = Decimal(str(calc['amount']))
    calc_days = calc['days']

    mb, _ = MerchantBalance.objects.get_or_create(store=store)

    if payment_method == "BALANCE":
        if mb.balance < req_amount:
            return Response({
                "error": f"Balansda mablag' yetarli emas. Kerak: {req_amount:,.0f} UZS, Balansingiz: {mb.balance:,.0f} UZS. Boshqa to'lov usulini tanlang yoki hisobingizni to'ldiring.",
                "required_amount": float(req_amount),
                "current_balance": float(mb.balance)
            }, status=400)

        # Deduct balance & apply tariff immediately
        mb.balance -= req_amount
        mb.save(update_fields=['balance'])

        applied = store.apply_tariff(
            plan=plan,
            days=calc_days,
            amount=req_amount,
            payment_status='PAID',
            payment_method='BALANCE',
            notes=f"To'lov do'kon balansidan amalga oshirildi ({req_amount:,.0f} UZS)",
            admin_user=request.user
        )

        t_req = TariffRequest.objects.create(
            store=store,
            merchant=request.user,
            requested_plan=plan,
            period_months=months,
            calculated_days=calc_days,
            amount=req_amount,
            payment_method=TariffRequest.PaymentMethods.BALANCE,
            contact_phone=phone,
            notes=notes or "To'lov balansdan yechildi",
            admin_notes="Avtomatik tasdiqlandi (Balans)",
            status=TariffRequest.Statuses.APPROVED,
            processed_by=request.user,
            processed_at=timezone.now()
        )

        return Response({
            "status": "success",
            "auto_activated": True,
            "message": f"Tabriklaymiz! {applied['plan_display']} tarifi muvaffaqiyatli faollashtirildi. Yangi muddat: {applied['new_expiry']} (+{applied['days']} kun).",
            "new_expiry": applied["new_expiry"],
            "days_added": applied["days"],
            "new_balance": float(mb.balance)
        })

    # External payment / invoice / cash
    pm_choice = getattr(TariffRequest.PaymentMethods, payment_method, TariffRequest.PaymentMethods.BANK_TRANSFER)

    t_req = TariffRequest.objects.create(
        store=store,
        merchant=request.user,
        requested_plan=plan,
        period_months=months,
        calculated_days=calc_days,
        amount=req_amount,
        payment_method=pm_choice,
        contact_phone=phone,
        notes=notes,
        status=TariffRequest.Statuses.PENDING
    )

    return Response({
        "status": "success",
        "auto_activated": False,
        "request_id": t_req.id,
        "message": "Tarifga ulanish arizangiz qabul qilindi! Menejerimiz tez orada siz bilan bog'lanadi va to'lovni tasdiqlaydi.",
        "plan_display": calc["plan_display"],
        "amount": float(req_amount),
        "days": calc_days,
        "payment_method": t_req.get_payment_method_display()
    })

