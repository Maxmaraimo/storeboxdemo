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
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")

    if not username or not password:
        return Response({"error": "Iltimos, login va parolni kiriting"}, status=400)

    user = authenticate(request, username=username, password=password)
    if not user:
        clean_phone = username.replace(" ", "").replace("-", "")
        if not clean_phone.startswith("+") and clean_phone.startswith("998"):
            clean_phone = "+" + clean_phone
        user = authenticate(request, username=clean_phone, password=password)

    if not user:
        return Response({"error": "Login yoki parol notogri"}, status=401)

    login(request, user)
    store = get_merchant_store(request)

    return Response({
        "user": UserSerializer(user).data,
        "store": StoreSerializer(store).data if store else None,
        "message": "Muvaffaqiyatli tizimga kirildi"
    })

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
