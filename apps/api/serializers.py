from rest_framework import serializers
from apps.orders.models import Order, OrderItem, Customer
from apps.catalog.models import Product, Category
from apps.stores.models import Store, Branch
from apps.accounts.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "phone", "first_name", "last_name", "role"]

class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ["id", "name", "subdomain", "business_category", "currency", "phone", "telegram_bot_username", "is_active"]

class CategorySerializer(serializers.ModelSerializer):
    primary_image_url = serializers.ReadOnlyField()
    active_products_count = serializers.ReadOnlyField()

    class Meta:
        model = Category
        fields = [
            "id", "name_uz", "name_ru", "name_en", "slug", "icon",
            "primary_image_url", "is_active", "sort_order", "active_products_count"
        ]

class ProductSerializer(serializers.ModelSerializer):
    primary_image_url = serializers.ReadOnlyField()
    category_name = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "name_uz", "name_ru", "name_en", "price", "old_price",
            "stock", "unit", "is_active", "primary_image_url",
            "category", "category_name", "created_at"
        ]

    def get_category_name(self, obj):
        if obj.category:
            return obj.category.name_uz or obj.category.name_ru
        return None

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
