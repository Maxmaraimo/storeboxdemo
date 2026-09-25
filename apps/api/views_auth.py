from django.contrib.auth import authenticate, login, logout
from django.conf import settings
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from apps.stores.models import Store
from apps.orders.permissions import get_user_permissions
from .serializers import UserSerializer, StoreSerializer

def get_merchant_store(request):
    user = request.user
    if not user.is_authenticated:
        return None
    
    # Priority: explicit request header or query param, then session
    store_id = request.headers.get("X-Store-Id") or request.GET.get("store_id")
    if not store_id and hasattr(request, "data") and isinstance(request.data, dict):
        store_id = request.data.get("store_id")
    if not store_id:
        session = getattr(request, "session", {})
        if hasattr(session, "get"):
            store_id = session.get("merchant_current_store_id") or session.get("selected_store_id")
    if store_id:
        store = Store.objects.filter(id=store_id, owner=user).first()
        if not store:
            from apps.orders.models import StoreStaff
            staff = StoreStaff.objects.filter(store_id=store_id, user=user, is_active=True).first()
            if staff:
                return staff.store
        if not store and user.is_superuser:
            store = Store.objects.filter(id=store_id).first()
        if store:
            return store

    # Check store owned by user
    store = Store.objects.filter(owner=user, is_active=True).first()
    if not store:
        store = Store.objects.filter(owner=user).first()
    
    # If not owner, check if user is staff or courier in a store
    if not store:
        from apps.orders.models import StoreStaff
        staff = StoreStaff.objects.filter(user=user, is_active=True).select_related('store').first()
        if staff and staff.store:
            return staff.store

    if not store and user.is_superuser:
        store = Store.objects.filter(is_active=True).first()
    return store

@api_view(["GET"])
@permission_classes([AllowAny])
def csrf_view(request):
    token = get_token(request)
    resp = Response({"csrfToken": token})
    resp.set_cookie(
        settings.CSRF_COOKIE_NAME,
        token,
        domain=settings.CSRF_COOKIE_DOMAIN,
        secure=settings.CSRF_COOKIE_SECURE,
        httponly=settings.CSRF_COOKIE_HTTPONLY,
        samesite=settings.CSRF_COOKIE_SAMESITE,
    )
    return resp

@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    login_val = (request.data.get("username") or request.data.get("login") or "").strip()
    password = request.data.get("password", "")

    if not login_val or not password:
        return Response({"error": "Iltimos, login va parolni kiriting"}, status=400)

    clean = login_val.replace('+', '').replace(' ', '').replace('-', '').replace('(', '').replace(')', '')

    from apps.accounts.models import User
    from django.db.models import Q
    target_user = None
    if User.objects.filter(username=clean).exists():
        target_user = User.objects.filter(username=clean).first()
    elif User.objects.filter(username=login_val).exists():
        target_user = User.objects.filter(username=login_val).first()
    elif User.objects.filter(phone=login_val).exists():
        target_user = User.objects.filter(phone=login_val).first()
    elif User.objects.filter(phone=f"+{clean}").exists():
        target_user = User.objects.filter(phone=f"+{clean}").first()
    elif len(clean) == 9 and User.objects.filter(username=f"998{clean}").exists():
        target_user = User.objects.filter(username=f"998{clean}").first()
    elif len(clean) >= 9 and User.objects.filter(Q(username__endswith=clean[-9:]) | Q(phone__endswith=clean[-9:]) | Q(phone__contains=clean[-9:])).exists():
        target_user = User.objects.filter(Q(username__endswith=clean[-9:]) | Q(phone__endswith=clean[-9:]) | Q(phone__contains=clean[-9:])).first()
    elif '@' in login_val:
        target_user = User.objects.filter(email=login_val).first()

    user = None
    if target_user:
        user = authenticate(request, username=target_user.username, password=password)
    else:
        user = authenticate(request, username=clean, password=password)

    if not user:
        return Response({"error": "Login yoki parol noto'g'ri"}, status=401)

    login(request, user)

    # A Django login intentionally keeps unrelated session data. Store selection,
    # however, belongs to the previous account and must never cross logins.
    for key in ("merchant_current_store_id", "selected_store_id", "current_store_subdomain"):
        request.session.pop(key, None)

    store = get_merchant_store(request)
    stores = Store.objects.filter(owner=user).order_by("id")
    if store:
        request.session["merchant_current_store_id"] = store.id
        request.session["selected_store_id"] = store.id
        request.session["current_store_subdomain"] = store.subdomain
    perms = get_user_permissions(user, store) if store else None

    from apps.orders.models import StoreStaff
    is_courier = StoreStaff.objects.filter(user=user, is_courier=True, is_active=True).exists()

    response = Response({
        "user": UserSerializer(user).data,
        "store": StoreSerializer(store).data if store else None,
        "stores": StoreSerializer(stores, many=True).data,
        "permissions": perms,
        "is_courier": is_courier,
        "redirect_url": "/dashboard/courier/" if is_courier else None,
        "message": "Muvaffaqiyatli tizimga kirildi"
    })
    response["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    return response

@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    phone = request.data.get("phone", "").strip()
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "")
    password_confirm = request.data.get("password_confirm", "")

    import re
    clean_digits = re.sub(r'\D', '', phone)
    if len(clean_digits) == 10 and clean_digits.startswith('8'):
        clean_digits = '998' + clean_digits[1:]
    elif len(clean_digits) == 9:
        clean_digits = '998' + clean_digits

    if not clean_digits or len(clean_digits) < 9:
        return Response({"error": "Iltimos, telefon raqamini to'liq kiriting"}, status=400)

    if not password or len(password) < 6:
        return Response({"error": "Parol kamida 6 ta belgidan iborat bo'lishi kerak"}, status=400)

    if password_confirm and password != password_confirm:
        return Response({"error": "Parollar bir-biriga mos kelmadi"}, status=400)

    from apps.accounts.models import User
    from django.db.models import Q
    normalized_phone = f"+{clean_digits}"
    username = clean_digits

    if User.objects.filter(Q(username=username) | Q(phone=normalized_phone) | Q(phone=phone) | (Q(phone__endswith=clean_digits[-9:]) if len(clean_digits) >= 9 else Q(pk__in=[]))).exists():
        return Response({"error": "Ushbu telefon raqami allaqachon ro'yxatdan o'tgan", "user_exists": True}, status=400)

    user = User.objects.create_user(
        username=username,
        email=email,
        phone=normalized_phone,
        password=password,
        role=User.Roles.MERCHANT
    )
    login(request, user)
    return Response({
        "user": UserSerializer(user).data,
        "message": "Ro'yxatdan o'tish muvaffaqiyatli yakunlandi"
    }, status=201)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    user = request.user
    store = get_merchant_store(request)
    
    from apps.orders.models import StoreStaff
    is_courier = StoreStaff.objects.filter(user=user, is_courier=True, is_active=True).exists()

    stores = Store.objects.filter(owner=user)
    if not stores.exists() and store:
        stores = Store.objects.filter(id=store.id)
    elif not stores.exists():
        stores = Store.objects.filter(is_active=True)[:5]

    perms = get_user_permissions(user, store) if store else None

    return Response({
        "user": UserSerializer(user).data,
        "store": StoreSerializer(store).data if store else None,
        "stores": StoreSerializer(stores, many=True).data,
        "permissions": perms,
        "is_courier": is_courier,
        "redirect_url": "/dashboard/courier/" if is_courier else None,
    })
    response["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    return response

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({"message": "Tizimdan chiqildi"})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def switch_store_view(request, store_id):
    store = Store.objects.filter(id=store_id, owner=request.user).first()
    if not store:
        from apps.orders.models import StoreStaff
        staff = StoreStaff.objects.filter(
            store_id=store_id, user=request.user, is_active=True
        ).select_related("store").first()
        store = staff.store if staff else None
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)
    request.session["selected_store_id"] = store.id
    request.session["merchant_current_store_id"] = store.id
    request.session["current_store_subdomain"] = store.subdomain
    return Response({
        "message": "Dokon almashtirildi",
        "store": StoreSerializer(store).data
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_store_view(request):
    from django.utils.text import slugify
    from apps.payments.models import StorePaymentSetting
    from apps.orders.models import StoreStaff

    user = request.user
    user_stores_count = Store.objects.filter(owner=user).count()
    if user_stores_count >= 5:
        return Response({
            "error": "Bitta hisobda maksimal 5 ta do'kon yaratish mumkin"
        }, status=400)

    name = request.data.get("name", "").strip()
    if not name:
        return Response({"error": "Do'kon nomi kiritilishi shart"}, status=400)

    custom_sub = request.data.get("subdomain", "").strip().lower()
    b_type = request.data.get("business_type", Store.BusinessTypes.ONLINE_STORE)

    if custom_sub:
        sub = slugify(custom_sub)
        if Store.objects.filter(subdomain=sub).exists():
            return Response({"error": f"'{sub}' subdomeni band, iltimos boshqasini tanlang"}, status=400)
    else:
        base_sub = slugify(name) or "store"
        sub = base_sub
        c = 1
        while Store.objects.filter(subdomain=sub).exists():
            sub = f"{base_sub}-{c}"
            c += 1

    store = Store.objects.create(
        owner=user,
        name=name,
        business_type=b_type,
        subdomain=sub,
        is_active=True
    )
    StorePaymentSetting.objects.get_or_create(store=store)
    StoreStaff.objects.get_or_create(
        user=user,
        store=store,
        defaults={
            'name': user.get_full_name() or user.username,
            'phone': getattr(user, 'phone', ''),
            'role': 'ADMIN'
        }
    )
    request.session["selected_store_id"] = store.id
    request.session["merchant_current_store_id"] = store.id
    request.session["current_store_subdomain"] = store.subdomain

    all_stores = Store.objects.filter(owner=user)

    return Response({
        "message": "Do'kon muvaffaqiyatli yaratildi",
        "store": StoreSerializer(store).data,
        "stores": StoreSerializer(all_stores, many=True).data
    }, status=201)
