from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils.text import slugify
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from apps.core.translations import TRANSLATIONS_DATA
from apps.stores.models import Store
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
