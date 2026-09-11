from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from apps.stores.models import Store
from .serializers import UserSerializer, StoreSerializer

def get_merchant_store(request):
    user = request.user
    if not user.is_authenticated:
        return None
    session = getattr(request, "session", {})
    selected_store_id = session.get("selected_store_id") if hasattr(session, "get") else None
    if selected_store_id:
        store = Store.objects.filter(id=selected_store_id, owner=user).first()
        if store:
            return store
    store = Store.objects.filter(owner=user).first()
    if store:
        return store
    return Store.objects.filter(is_active=True).first()

@api_view(["GET"])
@permission_classes([AllowAny])
def csrf_view(request):
    token = get_token(request)
    return Response({"csrfToken": token})

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
    store = get_merchant_store(request)

    return Response({
        "user": UserSerializer(user).data,
        "store": StoreSerializer(store).data if store else None,
        "message": "Muvaffaqiyatli tizimga kirildi"
    })

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
    stores = Store.objects.filter(owner=user)
    if not stores.exists():
        stores = Store.objects.filter(is_active=True)[:5]

    return Response({
        "user": UserSerializer(user).data,
        "store": StoreSerializer(store).data if store else None,
        "stores": StoreSerializer(stores, many=True).data,
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({"message": "Tizimdan chiqildi"})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def switch_store_view(request, store_id):
    store = Store.objects.filter(id=store_id).first()
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)
    request.session["selected_store_id"] = store.id
    return Response({
        "message": "Dokon almashtirildi",
        "store": StoreSerializer(store).data
    })
