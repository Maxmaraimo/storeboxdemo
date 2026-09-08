from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from apps.core.translations import TRANSLATIONS_DATA
from .views_auth import get_merchant_store
from .serializers import StoreSerializer

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
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    return Response(StoreSerializer(store).data)
