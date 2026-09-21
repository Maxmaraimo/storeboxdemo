import random
from decimal import Decimal
from rest_framework import serializers
from django.conf import settings
from django.utils.text import slugify

from apps.orders.models import (
    Order, OrderItem, Customer, PromoCode, ChatMessage, MarketingCampaign,
    StoreStaff, StoreRole, RolePermission, MODULE_CHOICES
)
from apps.catalog.models import Product, Category
from apps.stores.models import Store, Branch
from apps.accounts.models import User
from apps.payments.models import StorePaymentSetting


RESERVED_STOREFRONT_SUBDOMAINS = {
    "admin", "api", "app", "billing", "demo", "mail", "platform",
    "store", "storebox", "super-admin", "www",
}


def normalize_unit(unit_str):
    if not unit_str:
        return 'Dona'
    u = str(unit_str).strip().lower()
    mapping = {
        'dona': 'Dona', 'шт': 'Dona', 'pcs': 'Dona', 'pc': 'Dona',
        'metr': 'Metr', 'm': 'Metr', 'метр': 'Metr',
        'kilogram': 'Kilogram', 'kg': 'Kilogram', 'кг': 'Kilogram',
        'gramm': 'Gramm', 'g': 'Gramm', 'гр': 'Gramm',
        'litr': 'Litr', 'l': 'Litr', 'л': 'Litr',
        'portsiya': 'Portsiya', 'porsiya': 'Portsiya', 'порция': 'Portsiya',
        'pachka': 'Pachka', 'пачка': 'Pachka',
        'korobka': 'Korobka', 'коробка': 'Korobka',
        'upakovka': 'Upakovka', 'упаковка': 'Upakovka',
    }
    return mapping.get(u, 'Dona')


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "phone", "first_name", "last_name", "role"]


class StoreSerializer(serializers.ModelSerializer):
    subdomain = serializers.CharField(max_length=80, required=False)
    storefront_url = serializers.CharField(source="get_storefront_url", read_only=True)

    class Meta:
        model = Store
        fields = [
            "id", "name", "subdomain", "storefront_url", "business_category", "currency",
            "phone", "telegram_bot_username", "is_active",
            "delivery_price", "free_delivery_threshold", "delivery_time_estimate",
            "pickup_enabled", "courier_enabled", "address",
            "primary_color", "theme_bg_color", "theme_card_style"
        ]
        read_only_fields = ["id", "storefront_url", "is_active"]

    def validate_subdomain(self, value):
        raw_value = (value or "").strip().lower()
        domain_suffix = f".{settings.PLATFORM_DOMAIN.lower()}"
        if raw_value.endswith(domain_suffix):
            raw_value = raw_value[:-len(domain_suffix)]

        normalized = slugify(raw_value)
        if len(normalized) < 3:
            raise serializers.ValidationError("Subdomen kamida 3 ta belgidan iborat bo'lishi kerak.")
        if len(normalized) > 50:
            raise serializers.ValidationError("Subdomen 50 ta belgidan oshmasligi kerak.")
        if normalized in RESERVED_STOREFRONT_SUBDOMAINS:
            raise serializers.ValidationError("Bu subdomen tizim tomonidan band qilingan.")

        duplicate = Store.objects.filter(subdomain__iexact=normalized)
        if self.instance:
            duplicate = duplicate.exclude(pk=self.instance.pk)
        if duplicate.exists():
            raise serializers.ValidationError("Bu subdomen allaqachon band.")
        return normalized


class CategorySerializer(serializers.ModelSerializer):
    primary_image_url = serializers.ReadOnlyField()
    active_products_count = serializers.ReadOnlyField()
    slug = serializers.CharField(required=False, allow_blank=True)
    image_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Category
        fields = [
            "id", "name_uz", "name_ru", "name_en", "slug", "icon",
            "image_url", "primary_image_url", "is_active", "sort_order", "active_products_count"
        ]

    def validate(self, attrs):
        if not self.instance and not attrs.get("slug"):
            name = attrs.get("name_uz") or attrs.get("name_ru") or "cat"
            base_slug = slugify(name) or f"cat-{random.randint(100, 999)}"
            attrs["slug"] = base_slug
        return attrs


class ProductSerializer(serializers.ModelSerializer):
    primary_image_url = serializers.ReadOnlyField()
    category_name = serializers.SerializerMethodField()
    slug = serializers.CharField(required=False, allow_blank=True)
    image_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Product
        fields = [
            "id", "name_uz", "name_ru", "name_en", "slug", "price", "old_price",
            "cost_price", "margin", "stock", "unit", "is_active", "is_featured",
            "primary_image_url", "image_url", "category", "category_name",
            "description_uz", "description_ru", "description_en",
            "barcode", "ikpu_code", "created_at"
        ]

    def get_category_name(self, obj):
        if obj.category:
            return obj.category.name_uz or obj.category.name_ru or obj.category.name_en
        return None

    def to_internal_value(self, data):
        data = data.copy()
        if "unit" in data:
            data["unit"] = normalize_unit(data.get("unit"))
        if data.get("cost_price") in [None, "", "null"]:
            data["cost_price"] = 0
        if data.get("stock") in [None, "", "null"]:
            data["stock"] = 0
        if data.get("category") in [None, "", "null", "undefined"]:
            data["category"] = None
        if not self.instance and not data.get("slug"):
            name = data.get("name_uz") or data.get("name_ru") or "prod"
            data["slug"] = slugify(name) or f"prod-{random.randint(1000, 9999)}"
        return super().to_internal_value(data)


class OrderItemSerializer(serializers.ModelSerializer):
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ["id", "product_name", "quantity", "unit_price", "total_price", "product_image"]

    def get_product_image(self, obj):
        if obj.product and obj.product.primary_image_url:
            return obj.product.primary_image_url
        return None


class StoreStaffSerializer(serializers.ModelSerializer):
    role_id = serializers.IntegerField(source="store_role.id", read_only=True)
    role_name = serializers.SerializerMethodField()
    orders_count = serializers.IntegerField(read_only=True)
    completed_orders_count = serializers.SerializerMethodField()
    cancelled_orders_count = serializers.SerializerMethodField()
    active_order = serializers.SerializerMethodField()
    last_seen_seconds_ago = serializers.SerializerMethodField()

    class Meta:
        model = StoreStaff
        fields = [
            "id", "name", "phone", "role", "role_id", "role_name",
            "is_courier", "is_active", "orders_count", "completed_orders_count", "cancelled_orders_count",
            "current_lat", "current_lng", "last_location_update", "last_seen_seconds_ago", "active_order",
            "created_at", "updated_at"
        ]

    current_lat = serializers.SerializerMethodField()
    current_lng = serializers.SerializerMethodField()

    def get_current_lat(self, obj):
        if obj.current_lat is not None:
            try:
                return float(obj.current_lat)
            except (ValueError, TypeError):
                pass
        active = obj.assigned_orders.filter(status='IN_DELIVERY').first() or obj.assigned_orders.filter(status__in=['PROCESSING', 'READY']).first()
        if active and active.delivery_lat:
            try:
                return round(float(active.delivery_lat) - 0.012, 6)
            except (ValueError, TypeError):
                pass
        return 41.311087

    def get_current_lng(self, obj):
        if obj.current_lng is not None:
            try:
                return float(obj.current_lng)
            except (ValueError, TypeError):
                pass
        active = obj.assigned_orders.filter(status='IN_DELIVERY').first() or obj.assigned_orders.filter(status__in=['PROCESSING', 'READY']).first()
        if active and active.delivery_lng:
            try:
                return round(float(active.delivery_lng) - 0.012, 6)
            except (ValueError, TypeError):
                pass
        return 69.240562

    def get_completed_orders_count(self, obj):
        if obj.is_courier:
            return obj.assigned_orders.filter(status='COMPLETED').count()
        return 0

    def get_cancelled_orders_count(self, obj):
        if obj.is_courier:
            return obj.assigned_orders.filter(status='CANCELLED').count()
        return 0

    def get_role_name(self, obj):
        if obj.is_courier:
            return "Kuryer"
        if obj.store_role:
            return obj.store_role.name
        return obj.role

    def get_last_seen_seconds_ago(self, obj):
        if obj.last_location_update:
            from django.utils import timezone
            return int((timezone.now() - obj.last_location_update).total_seconds())
        return None

    def get_active_order(self, obj):
        if not obj.is_courier:
            return None
        active = obj.assigned_orders.filter(status='IN_DELIVERY').first()
        if not active:
            active = obj.assigned_orders.filter(status__in=['PROCESSING', 'READY']).first()
        if active:
            d_lat = 41.2995
            d_lng = 69.2401
            if active.delivery_lat:
                try:
                    d_lat = float(active.delivery_lat)
                except (ValueError, TypeError):
                    pass
            if active.delivery_lng:
                try:
                    d_lng = float(active.delivery_lng)
                except (ValueError, TypeError):
                    pass
            return {
                "id": active.id,
                "order_number": active.order_number,
                "status": active.status,
                "status_display": active.get_status_display(),
                "customer_name": active.customer_name,
                "customer_phone": active.customer_phone,
                "delivery_address": active.delivery_address or "Toshkent shahri",
                "delivery_lat": d_lat,
                "delivery_lng": d_lng,
                "total_amount": float(active.total_amount)
            }
        return None


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    courier = StoreStaffSerializer(read_only=True)
    courier_id = serializers.PrimaryKeyRelatedField(
        queryset=StoreStaff.objects.all(), source="courier", write_only=True, required=False, allow_null=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    payment_method_display = serializers.CharField(source="get_payment_method_display", read_only=True)
    payment_status_display = serializers.CharField(source="get_payment_status_display", read_only=True)
    source_display = serializers.CharField(source="get_source_display", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "customer_name", "customer_phone",
            "courier", "courier_id",
            "delivery_address", "delivery_lat", "delivery_lng", "delivery_fee",
            "payment_method", "payment_method_display", "payment_status", "payment_status_display",
            "status", "status_display", "total_amount", "discount_amount",
            "source", "source_display", "items", "created_at", "updated_at"
        ]


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ["id", "name", "phone", "bonus_balance", "orders_count", "total_spent", "created_at"]


class PromoCodeSerializer(serializers.ModelSerializer):
    times_used = serializers.ReadOnlyField()

    class Meta:
        model = PromoCode
        fields = [
            "id", "code", "discount_type", "discount_value",
            "min_order_amount", "max_uses", "times_used", "is_active"
        ]


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = [
            "id", "customer_phone", "customer_name", "sender",
            "message", "is_read", "created_at"
        ]


class MarketingCampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketingCampaign
        fields = [
            "id", "title", "channel", "message", "sent_count", "status", "created_at"
        ]


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ["id", "name", "address", "phone", "latitude", "longitude", "is_main", "is_active"]


class StoreRoleSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()
    staff_count = serializers.SerializerMethodField()

    class Meta:
        model = StoreRole
        fields = [
            "id", "name", "description", "is_system", "is_active",
            "created_at", "updated_at", "permissions", "staff_count"
        ]

    def get_permissions(self, obj):
        perms = {p.module: {"view": p.can_view, "edit": p.can_edit, "delete": p.can_delete} for p in obj.permissions.all()}
        for mod_key, _ in MODULE_CHOICES:
            if mod_key not in perms:
                perms[mod_key] = {"view": False, "edit": False, "delete": False}
        return perms

    def get_staff_count(self, obj):
        return obj.staff_members.count()


class StorePaymentSettingSerializer(serializers.ModelSerializer):
    cash_enabled = serializers.BooleanField(source="cash_on_delivery_enabled", required=False)
    terminal_enabled = serializers.BooleanField(source="terminal_on_delivery_enabled", required=False)

    class Meta:
        model = StorePaymentSetting
        fields = [
            "id", "cash_enabled", "terminal_enabled",
            "cash_on_delivery_enabled", "terminal_on_delivery_enabled",
            "payme_enabled", "payme_merchant_id",
            "click_enabled", "click_service_id", "click_merchant_id",
            "uzum_enabled"
        ]
