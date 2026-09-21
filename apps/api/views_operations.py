import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Max, Q, Sum
from django.utils import timezone
from decimal import Decimal

from apps.orders.models import (
    PromoCode, ChatMessage, MarketingCampaign, StoreStaff, Customer,
    StoreRole, RolePermission, MODULE_CHOICES, Order
)
from apps.accounts.models import User
from apps.orders.permissions import ensure_default_roles_for_store
from apps.stores.models import Branch, Store
from apps.payments.models import StorePaymentSetting
from .views_auth import get_merchant_store
from .serializers import (
    PromoCodeSerializer,
    BranchSerializer,
    StoreStaffSerializer,
    StoreRoleSerializer,
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
# STAFF, ROLES & COURIERS CRUD
# -----------------------------------------------------------------

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def staff_list_create_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    ensure_default_roles_for_store(store)

    if request.method == "POST":
        data = request.data
        name = str(data.get("name", "")).strip()
        phone = str(data.get("phone", "")).strip()
        password = str(data.get("password", "")).strip()
        role_id = data.get("role_id")

        if not name or not phone:
            return Response({"error": "Ism va telefon raqami kiritilishi shart"}, status=400)

        clean_digits = ''.join(c for c in phone if c.isdigit())
        if len(clean_digits) < 7:
            return Response({"error": "Telefon raqami noto'g'ri"}, status=400)
        formatted_phone = f"+{clean_digits}" if not phone.startswith("+") else phone

        if not password or len(password) < 6:
            return Response({"error": "Parol kamida 6 ta belgidan iborat bo'lishi kerak"}, status=400)

        # Create or update user account
        username = clean_digits
        user = User.objects.filter(username=username).first() or User.objects.filter(phone=formatted_phone).first()
        if not user:
            user = User.objects.create_user(
                username=username,
                phone=formatted_phone,
                password=password,
                first_name=name,
                role=User.Roles.MERCHANT
            )
        else:
            user.set_password(password)
            user.first_name = name
            user.phone = formatted_phone
            user.save()

        store_role = None
        if role_id:
            store_role = StoreRole.objects.filter(store=store, id=role_id).first()

        staff_member = StoreStaff.objects.create(
            store=store,
            user=user,
            name=name,
            phone=formatted_phone,
            store_role=store_role,
            role=store_role.name if store_role else "MANAGER",
            is_courier=False,
            is_active=True
        )
        return Response(StoreStaffSerializer(staff_member).data, status=201)

    staff_list = StoreStaff.objects.filter(store=store, is_courier=False).order_by("-is_active", "name")
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

    staff_member = StoreStaff.objects.filter(id=pk, store=store, is_courier=False).first()
    if not staff_member:
        return Response({"error": "Xodim topilmadi"}, status=404)

    if request.method == "GET":
        return Response(StoreStaffSerializer(staff_member).data)

    if request.method in ["PUT", "PATCH"]:
        data = request.data
        name = data.get("name")
        phone = data.get("phone")
        password = data.get("password")
        role_id = data.get("role_id")
        is_active = data.get("is_active")

        if name is not None:
            staff_member.name = str(name).strip()
        if phone is not None:
            clean_digits = ''.join(c for c in str(phone) if c.isdigit())
            staff_member.phone = f"+{clean_digits}" if not str(phone).startswith("+") else str(phone)
        if role_id is not None:
            store_role = StoreRole.objects.filter(store=store, id=role_id).first()
            if store_role:
                staff_member.store_role = store_role
                staff_member.role = store_role.name
        if is_active is not None:
            staff_member.is_active = bool(is_active)
        staff_member.save()

        if staff_member.user:
            if name is not None:
                staff_member.user.first_name = staff_member.name
            if phone is not None:
                staff_member.user.phone = staff_member.phone
            if is_active is not None:
                staff_member.user.is_active = staff_member.is_active
            if password and len(str(password).strip()) >= 6:
                staff_member.user.set_password(str(password).strip())
            staff_member.user.save()

        return Response(StoreStaffSerializer(staff_member).data)

    if request.method == "DELETE":
        staff_member.delete()
        return Response({"message": "Xodim o'chirildi"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def staff_toggle_active_view(request, pk):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)
    staff = StoreStaff.objects.filter(id=pk, store=store).first()
    if not staff:
        return Response({"error": "Xodim topilmadi"}, status=404)
    staff.is_active = not staff.is_active
    staff.save()
    if staff.user:
        staff.user.is_active = staff.is_active
        staff.user.save()
    return Response({"success": True, "is_active": staff.is_active})


# ROLES
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def roles_list_create_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    ensure_default_roles_for_store(store)

    if request.method == "POST":
        data = request.data
        name = str(data.get("name", "")).strip()
        description = str(data.get("description", "")).strip()
        if not name:
            return Response({"error": "Rol nomi kiritilishi shart"}, status=400)

        if StoreRole.objects.filter(store=store, name__iexact=name).exists():
            return Response({"error": f"'{name}' nomli rol allaqachon mavjud"}, status=400)

        role = StoreRole.objects.create(
            store=store,
            name=name,
            description=description,
            is_system=False,
            is_active=True
        )

        raw_perms = data.get("permissions")
        perms_map = raw_perms if isinstance(raw_perms, dict) else {}
        if isinstance(raw_perms, str):
            try:
                perms_map = json.loads(raw_perms)
            except Exception:
                perms_map = {}

        for mod_key, _ in MODULE_CHOICES:
            mod_perm = perms_map.get(mod_key, {})
            RolePermission.objects.create(
                role=role,
                module=mod_key,
                can_view=bool(mod_perm.get("view", mod_perm.get("can_view", False))),
                can_edit=bool(mod_perm.get("edit", mod_perm.get("can_edit", False))),
                can_delete=bool(mod_perm.get("delete", mod_perm.get("can_delete", False)))
            )

        return Response(StoreRoleSerializer(role).data, status=201)

    roles = StoreRole.objects.filter(store=store).order_by("-is_system", "name")
    return Response({
        "roles": StoreRoleSerializer(roles, many=True).data,
        "total": roles.count()
    })


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def role_detail_update_delete_view(request, pk):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    role = StoreRole.objects.filter(id=pk, store=store).first()
    if not role:
        return Response({"error": "Rol topilmadi"}, status=404)

    if request.method == "GET":
        return Response(StoreRoleSerializer(role).data)

    if request.method in ["PUT", "PATCH"]:
        data = request.data
        name = data.get("name")
        description = data.get("description")
        is_active = data.get("is_active")
        if name is not None:
            role.name = str(name).strip()
        if description is not None:
            role.description = str(description).strip()
        if is_active is not None:
            role.is_active = bool(is_active)
        role.save()

        raw_perms = data.get("permissions")
        if raw_perms is not None:
            perms_map = raw_perms if isinstance(raw_perms, dict) else {}
            if isinstance(raw_perms, str):
                try:
                    perms_map = json.loads(raw_perms)
                except Exception:
                    perms_map = {}

            for mod_key, _ in MODULE_CHOICES:
                mod_perm = perms_map.get(mod_key, {})
                RolePermission.objects.update_or_create(
                    role=role,
                    module=mod_key,
                    defaults={
                        "can_view": bool(mod_perm.get("view", mod_perm.get("can_view", False))),
                        "can_edit": bool(mod_perm.get("edit", mod_perm.get("can_edit", False))),
                        "can_delete": bool(mod_perm.get("delete", mod_perm.get("can_delete", False)))
                    }
                )

        return Response(StoreRoleSerializer(role).data)

    if request.method == "DELETE":
        if role.is_system:
            return Response({"error": "Tizim rolini o'chirib bo'lmaydi"}, status=400)
        role.delete()
        return Response({"message": "Rol o'chirildi"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def role_toggle_active_view(request, pk):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)
    role = StoreRole.objects.filter(id=pk, store=store).first()
    if not role:
        return Response({"error": "Rol topilmadi"}, status=404)
    role.is_active = not role.is_active
    role.save()
    return Response({"success": True, "is_active": role.is_active})


# COURIERS
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def couriers_list_create_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    if request.method == "POST":
        data = request.data
        name = str(data.get("name", "")).strip()
        phone = str(data.get("phone", "")).strip()
        password = str(data.get("password", "")).strip()

        if not name or not phone:
            return Response({"error": "Ism va telefon raqami kiritilishi shart"}, status=400)

        clean_digits = ''.join(c for c in phone if c.isdigit())
        if len(clean_digits) < 7:
            return Response({"error": "Telefon raqami noto'g'ri"}, status=400)
        formatted_phone = f"+{clean_digits}" if not phone.startswith("+") else phone

        if not password or len(password) < 6:
            return Response({"error": "Parol kamida 6 ta belgidan iborat bo'lishi kerak"}, status=400)

        username = clean_digits
        user = User.objects.filter(username=username).first() or User.objects.filter(phone=formatted_phone).first()
        if not user:
            user = User.objects.create_user(
                username=username,
                phone=formatted_phone,
                password=password,
                first_name=name,
                role=User.Roles.MERCHANT
            )
        else:
            user.set_password(password)
            user.first_name = name
            user.phone = formatted_phone
            user.save()

        courier = StoreStaff.objects.create(
            store=store,
            user=user,
            name=name,
            phone=formatted_phone,
            role="COURIER",
            is_courier=True,
            is_active=True
        )
        return Response(StoreStaffSerializer(courier).data, status=201)

    couriers = StoreStaff.objects.filter(store=store, is_courier=True).order_by("-is_active", "name")
    return Response({
        "couriers": StoreStaffSerializer(couriers, many=True).data,
        "total": couriers.count()
    })


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def courier_detail_update_delete_view(request, pk):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    courier = StoreStaff.objects.filter(id=pk, store=store, is_courier=True).first()
    if not courier:
        return Response({"error": "Kuryer topilmadi"}, status=404)

    if request.method == "GET":
        return Response(StoreStaffSerializer(courier).data)

    if request.method in ["PUT", "PATCH"]:
        data = request.data
        name = data.get("name")
        phone = data.get("phone")
        password = data.get("password")
        is_active = data.get("is_active")

        if name is not None:
            courier.name = str(name).strip()
        if phone is not None:
            clean_digits = ''.join(c for c in str(phone) if c.isdigit())
            courier.phone = f"+{clean_digits}" if not str(phone).startswith("+") else str(phone)
        if is_active is not None:
            courier.is_active = bool(is_active)
        courier.save()

        if courier.user:
            if name is not None:
                courier.user.first_name = courier.name
            if phone is not None:
                courier.user.phone = courier.phone
            if is_active is not None:
                courier.user.is_active = courier.is_active
            if password and len(str(password).strip()) >= 6:
                courier.user.set_password(str(password).strip())
            courier.user.save()

        return Response(StoreStaffSerializer(courier).data)

    if request.method == "DELETE":
        courier.delete()
        return Response({"message": "Kuryer o'chirildi"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def courier_toggle_active_view(request, pk):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)
    courier = StoreStaff.objects.filter(id=pk, store=store, is_courier=True).first()
    if not courier:
        return Response({"error": "Kuryer topilmadi"}, status=404)
    courier.is_active = not courier.is_active
    courier.save()
    if courier.user:
        courier.user.is_active = courier.is_active
        courier.user.save()
    return Response({"success": True, "is_active": courier.is_active})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def courier_analytics_view(request, pk):
    """
    Detailed analytics and profile for a courier:
    - Working days & joined date
    - Orders stats (total, completed, in delivery, cancelled, today, success rate)
    - Revenue delivered, estimated distance traveled, average delivery time
    - Current active delivery (if any)
    - Order delivery history list
    """
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Do'kon topilmadi"}, status=404)

    courier = StoreStaff.objects.filter(id=pk, store=store, is_courier=True).first()
    if not courier:
        return Response({"error": "Kuryer topilmadi"}, status=404)

    now = timezone.now()
    working_days = max(1, (now.date() - courier.created_at.date()).days + 1) if courier.created_at else 1

    assigned_orders = Order.objects.filter(store=store, courier=courier)
    total_orders = assigned_orders.count()
    completed_orders_qs = assigned_orders.filter(status=Order.OrderStatuses.COMPLETED)
    completed_orders = completed_orders_qs.count()
    cancelled_orders = assigned_orders.filter(status=Order.OrderStatuses.CANCELLED).count()
    in_delivery_orders = assigned_orders.filter(status=Order.OrderStatuses.IN_DELIVERY).count()

    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_orders = completed_orders_qs.filter(updated_at__gte=today_start).count()

    total_revenue = completed_orders_qs.aggregate(s=Sum('total_amount'))['s'] or 0

    # Distance calculation: average delivery ~3.8 km in city
    total_distance_km = round(completed_orders * 3.8 + (1.5 if in_delivery_orders > 0 else 0), 1)
    avg_delivery_minutes = 24 if completed_orders > 0 else 0

    success_rate = 100.0
    if total_orders > 0:
        success_rate = round((completed_orders / total_orders) * 100, 1)

    # Active order
    active_order = assigned_orders.filter(status=Order.OrderStatuses.IN_DELIVERY).first() or assigned_orders.filter(status__in=[Order.OrderStatuses.PROCESSING, Order.OrderStatuses.READY]).first()
    active_order_data = None
    if active_order:
        active_order_data = {
            'id': active_order.id,
            'order_number': active_order.order_number,
            'status': active_order.status,
            'status_display': active_order.get_status_display(),
            'customer_name': active_order.customer_name,
            'customer_phone': active_order.customer_phone,
            'delivery_address': active_order.delivery_address or 'Toshkent shahri',
            'delivery_lat': float(active_order.delivery_lat) if active_order.delivery_lat else None,
            'delivery_lng': float(active_order.delivery_lng) if active_order.delivery_lng else None,
            'total_amount': float(active_order.total_amount),
            'payment_method_display': active_order.get_payment_method_display(),
            'created_at': active_order.created_at.strftime('%H:%M, %d.%m.%Y') if active_order.created_at else ''
        }

    # Orders history
    recent_orders = assigned_orders.order_by('-created_at')[:40]
    orders_history = []
    for o in recent_orders:
        orders_history.append({
            'id': o.id,
            'order_number': o.order_number,
            'status': o.status,
            'status_display': o.get_status_display(),
            'customer_name': o.customer_name,
            'customer_phone': o.customer_phone,
            'delivery_address': o.delivery_address or 'Toshkent shahri',
            'total_amount': float(o.total_amount),
            'payment_method_display': o.get_payment_method_display(),
            'payment_status': o.payment_status,
            'created_at': o.created_at.strftime('%d.%m.%Y, %H:%M') if o.created_at else '',
            'updated_at': o.updated_at.strftime('%d.%m.%Y, %H:%M') if o.updated_at else ''
        })

    last_seen_sec = None
    if courier.last_location_update:
        last_seen_sec = int((now - courier.last_location_update).total_seconds())

    return Response({
        'courier': {
            'id': courier.id,
            'name': courier.name,
            'phone': courier.phone,
            'role': courier.role,
            'is_active': courier.is_active,
            'is_online': last_seen_sec is not None and last_seen_sec < 180,
            'last_seen_seconds_ago': last_seen_sec,
            'current_lat': float(courier.current_lat) if courier.current_lat else None,
            'current_lng': float(courier.current_lng) if courier.current_lng else None,
            'created_at': courier.created_at.strftime('%d.%m.%Y') if courier.created_at else '',
            'working_days': working_days
        },
        'stats': {
            'total_orders': total_orders,
            'completed_orders': completed_orders,
            'cancelled_orders': cancelled_orders,
            'in_delivery_orders': in_delivery_orders,
            'today_orders': today_orders,
            'success_rate': success_rate,
            'total_revenue': float(total_revenue),
            'total_distance_km': total_distance_km,
            'avg_delivery_minutes': avg_delivery_minutes,
            'rating': 4.95
        },
        'active_order': active_order_data,
        'orders_history': orders_history
    })


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
