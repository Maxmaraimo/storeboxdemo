from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Max, Q
from decimal import Decimal

from apps.orders.models import PromoCode, ChatMessage, MarketingCampaign, StoreStaff, Customer
from apps.stores.models import Branch, Store
from apps.payments.models import StorePaymentSetting
from .views_auth import get_merchant_store
from .serializers import (
    PromoCodeSerializer,
    BranchSerializer,
    StoreStaffSerializer,
    StorePaymentSettingSerializer,
    ChatMessageSerializer,
    MarketingCampaignSerializer,
    StoreSerializer,
)


# -----------------------------------------------------------------
# PROMO CODES CRUD
# -----------------------------------------------------------------

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def promocodes_list_create_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    if request.method == "POST":
        data = request.data.copy()
        code = str(data.get("code", "")).strip().upper()
        if not code:
            return Response({"error": "Promokod kodi kiritilishi shart"}, status=400)
        data["code"] = code

        if PromoCode.objects.filter(store=store, code=code).exists():
            return Response({"error": f"'{code}' nomli promokod allaqachon mavjud"}, status=400)

        serializer = PromoCodeSerializer(data=data)
        if serializer.is_valid():
            promo = serializer.save(store=store)
            return Response(PromoCodeSerializer(promo).data, status=201)
        return Response(serializer.errors, status=400)

    promos = PromoCode.objects.filter(store=store).order_by("-id")
    return Response({
        "promocodes": PromoCodeSerializer(promos, many=True).data,
        "total": promos.count()
    })


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def promocode_detail_update_delete_view(request, pk):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    promo = PromoCode.objects.filter(id=pk, store=store).first()
    if not promo:
        return Response({"error": "Promokod topilmadi"}, status=404)

    if request.method == "GET":
        return Response(PromoCodeSerializer(promo).data)

    if request.method in ["PUT", "PATCH"]:
        serializer = PromoCodeSerializer(promo, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response(PromoCodeSerializer(updated).data)
        return Response(serializer.errors, status=400)

    if request.method == "DELETE":
        promo.delete()
        return Response({"message": "Promokod o'chirildi"})


# -----------------------------------------------------------------
# BRANCHES CRUD
# -----------------------------------------------------------------

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def branches_list_create_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    if request.method == "POST":
        data = request.data.copy()
        name = str(data.get("name", "")).strip()
        if not name:
            return Response({"error": "Filial nomi kiritilishi shart"}, status=400)

        serializer = BranchSerializer(data=data)
        if serializer.is_valid():
            branch = serializer.save(store=store)
            return Response(BranchSerializer(branch).data, status=201)
        return Response(serializer.errors, status=400)

    branches = Branch.objects.filter(store=store).order_by("-is_main", "name")
    return Response({
        "branches": BranchSerializer(branches, many=True).data,
        "total": branches.count()
    })


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def branch_detail_update_delete_view(request, pk):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    branch = Branch.objects.filter(id=pk, store=store).first()
    if not branch:
        return Response({"error": "Filial topilmadi"}, status=404)

    if request.method == "GET":
        return Response(BranchSerializer(branch).data)

    if request.method in ["PUT", "PATCH"]:
        serializer = BranchSerializer(branch, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response(BranchSerializer(updated).data)
        return Response(serializer.errors, status=400)

    if request.method == "DELETE":
        branch.delete()
        return Response({"message": "Filial o'chirildi"})


# -----------------------------------------------------------------
# STAFF CRUD
# -----------------------------------------------------------------

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def staff_list_create_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    if request.method == "POST":
        data = request.data.copy()
        name = str(data.get("name", "")).strip()
        phone = str(data.get("phone", "")).strip()
        if not name or not phone:
            return Response({"error": "Ism va telefon raqami kiritilishi shart"}, status=400)

        serializer = StoreStaffSerializer(data=data)
        if serializer.is_valid():
            staff_member = serializer.save(store=store)
            return Response(StoreStaffSerializer(staff_member).data, status=201)
        return Response(serializer.errors, status=400)

    staff_list = StoreStaff.objects.filter(store=store).order_by("role", "name")
    return Response({
        "staff": StoreStaffSerializer(staff_list, many=True).data,
        "total": staff_list.count()
    })


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def staff_detail_update_delete_view(request, pk):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    staff_member = StoreStaff.objects.filter(id=pk, store=store).first()
    if not staff_member:
        return Response({"error": "Xodim topilmadi"}, status=404)

    if request.method == "GET":
        return Response(StoreStaffSerializer(staff_member).data)

    if request.method in ["PUT", "PATCH"]:
        serializer = StoreStaffSerializer(staff_member, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response(StoreStaffSerializer(updated).data)
        return Response(serializer.errors, status=400)

    if request.method == "DELETE":
        staff_member.delete()
        return Response({"message": "Xodim o'chirildi"})


# -----------------------------------------------------------------
# PAYMENTS SETTINGS
# -----------------------------------------------------------------

@api_view(["GET", "PUT", "PATCH", "POST"])
@permission_classes([IsAuthenticated])
def store_payments_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    setting, _ = StorePaymentSetting.objects.get_or_create(store=store)

    if request.method in ["PUT", "PATCH", "POST"]:
        serializer = StorePaymentSettingSerializer(setting, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response(StorePaymentSettingSerializer(updated).data)
        return Response(serializer.errors, status=400)

    return Response(StorePaymentSettingSerializer(setting).data)


# -----------------------------------------------------------------
# DELIVERY SETTINGS
# -----------------------------------------------------------------

@api_view(["GET", "PUT", "PATCH", "POST"])
@permission_classes([IsAuthenticated])
def store_delivery_settings_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    if request.method in ["PUT", "PATCH", "POST"]:
        data = request.data
        if "delivery_price" in data:
            store.delivery_price = Decimal(str(data["delivery_price"]))
        if "free_delivery_threshold" in data:
            store.free_delivery_threshold = Decimal(str(data["free_delivery_threshold"]))
        if "delivery_time_estimate" in data:
            store.delivery_time_estimate = str(data["delivery_time_estimate"])
        if "pickup_enabled" in data:
            store.pickup_enabled = bool(data["pickup_enabled"])
        if "courier_enabled" in data:
            store.courier_enabled = bool(data["courier_enabled"])
        if "address" in data:
            store.address = str(data["address"])
        store.save(update_fields=[
            "delivery_price", "free_delivery_threshold", "delivery_time_estimate",
            "pickup_enabled", "courier_enabled", "address", "updated_at"
        ])

    return Response({
        "delivery_price": store.delivery_price,
        "free_delivery_threshold": store.free_delivery_threshold,
        "delivery_time_estimate": store.delivery_time_estimate,
        "pickup_enabled": store.pickup_enabled,
        "courier_enabled": store.courier_enabled,
        "address": store.address
    })


# -----------------------------------------------------------------
# CHATS & MESSAGES
# -----------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def chats_list_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    all_msgs = ChatMessage.objects.filter(store=store).order_by("created_at")
    threads = {}
    display_phone_map = {}

    for m in all_msgs:
        raw_p = (m.customer_phone or "").strip()
        digits = "".join(c for c in raw_p if c.isdigit())
        key = digits if digits else raw_p
        if not key:
            continue

        display_p = raw_p if raw_p.startswith("+") else (f"+{digits}" if digits else raw_p)
        if key not in threads:
            threads[key] = []
            display_phone_map[key] = display_p
        threads[key].append(m)

    conversations = []
    for key, msgs in threads.items():
        last_msg = msgs[-1]
        display_p = display_phone_map[key]
        unread_count = sum(1 for m in msgs if m.sender == ChatMessage.Senders.CUSTOMER and not m.is_read)

        customer = Customer.objects.filter(store=store).filter(
            Q(phone__icontains=key) | Q(phone__icontains=display_p)
        ).first()

        customer_name = customer.name if (customer and customer.name) else None
        if not customer_name:
            for m in reversed(msgs):
                if m.customer_name and m.customer_name not in ["Mijoz", "Покупатель", ""]:
                    customer_name = m.customer_name
                    break
        if not customer_name:
            customer_name = last_msg.customer_name or display_p

        conversations.append({
            "phone": display_p,
            "customer_name": customer_name,
            "last_message": last_msg.message if last_msg else "",
            "last_message_at": last_msg.created_at.isoformat() if last_msg else None,
            "unread_count": unread_count,
        })

    conversations.sort(key=lambda x: x["last_message_at"] or "", reverse=True)
    return Response({"conversations": conversations, "total": len(conversations)})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def chat_messages_view(request, customer_phone):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    digits = "".join(c for c in customer_phone if c.isdigit())
    if digits:
        msg_filter = Q(customer_phone__icontains=digits) | Q(customer_phone=customer_phone)
    else:
        msg_filter = Q(customer_phone=customer_phone)

    messages = ChatMessage.objects.filter(store=store).filter(msg_filter).order_by("created_at")

    ChatMessage.objects.filter(store=store).filter(msg_filter).filter(
        sender=ChatMessage.Senders.CUSTOMER,
        is_read=False
    ).update(is_read=True)

    return Response({
        "customer_phone": customer_phone,
        "messages": ChatMessageSerializer(messages, many=True).data
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def chat_send_message_view(request, customer_phone):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    text = request.data.get("message", "").strip()
    if not text:
        return Response({"error": "Xabar matni bo'sh bo'lishi mumkin emas"}, status=400)

    digits = "".join(c for c in customer_phone if c.isdigit())
    customer = None
    if digits:
        customer = Customer.objects.filter(store=store).filter(
            Q(phone__icontains=digits) | Q(phone=customer_phone)
        ).first()
    else:
        customer = Customer.objects.filter(store=store, phone=customer_phone).first()

    customer_name = customer.name if (customer and customer.name) else "Mijoz"

    # Also notify telegram if customer linked bot
    try:
        from apps.dashboard.views import send_telegram_chat_reply
        send_telegram_chat_reply(store, customer_phone, text)
    except Exception:
        pass

    # Save message with canonical customer_phone format
    msg = ChatMessage.objects.create(
        store=store,
        customer_phone=customer_phone,
        customer_name=customer_name,
        sender=ChatMessage.Senders.MERCHANT,
        message=text,
        is_read=True
    )

    return Response(ChatMessageSerializer(msg).data, status=201)


# -----------------------------------------------------------------
# MARKETING CAMPAIGNS
# -----------------------------------------------------------------

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def marketing_campaigns_list_create_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    if request.method == "POST":
        data = request.data.copy()
        title = data.get("title", "").strip() or "Yangi aksiya"
        message = data.get("message", "").strip()
        channel = data.get("channel", "TELEGRAM")

        if not message:
            return Response({"error": "Xabar matnini kiriting"}, status=400)

        customer_count = Customer.objects.filter(store=store).count()
        sent_count = max(1, customer_count)

        campaign = MarketingCampaign.objects.create(
            store=store,
            title=title,
            channel=channel,
            message=message,
            sent_count=sent_count,
            status=MarketingCampaign.Statuses.SENT
        )

        return Response(MarketingCampaignSerializer(campaign).data, status=201)

    campaigns = MarketingCampaign.objects.filter(store=store).order_by("-created_at")
    return Response({
        "campaigns": MarketingCampaignSerializer(campaigns, many=True).data,
        "total": campaigns.count()
    })
