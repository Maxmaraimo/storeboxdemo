import random
from decimal import Decimal
from rest_framework import serializers
from django.utils.text import slugify

from apps.orders.models import Order, OrderItem, Customer, PromoCode, ChatMessage, MarketingCampaign, StoreStaff
from apps.catalog.models import Product, Category
from apps.stores.models import Store, Branch
from apps.accounts.models import User
from apps.payments.models import StorePaymentSetting


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
    class Meta:
        model = Store
        fields = [
            "id", "name", "subdomain", "business_category", "currency",
            "phone", "telegram_bot_username", "is_active",
            "delivery_price", "free_delivery_threshold", "delivery_time_estimate",
            "pickup_enabled", "courier_enabled", "address",
            "primary_color", "theme_bg_color", "theme_card_style"
        ]


class CategorySerializer(serializers.ModelSerializer):
    primary_image_url = serializers.ReadOnlyField()
    active_products_count = serializers.ReadOnlyField()
    slug = serializers.CharField(required=False, allow_blank=True)

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


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    payment_method_display = serializers.CharField(source="get_payment_method_display", read_only=True)
    payment_status_display = serializers.CharField(source="get_payment_status_display", read_only=True)
    source_display = serializers.CharField(source="get_source_display", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "customer_name", "customer_phone",
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


class StoreStaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreStaff
        fields = ["id", "name", "phone", "role", "is_active", "created_at"]


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

