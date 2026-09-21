from django.db.models import Q, Sum
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.orders.models import Order
from .views_auth import get_merchant_store
from .serializers import OrderSerializer

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def orders_list_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)

    status_param = request.GET.get("status", "ALL").upper()
    query = request.GET.get("q", "").strip()
    branch_id = request.GET.get("branch") or request.GET.get("branch_id")

    orders_qs = Order.objects.filter(store=store).select_related("store").prefetch_related("items").order_by("-created_at")
    if branch_id and branch_id != "all":
        try:
            orders_qs = orders_qs.filter(branch_id=int(branch_id))
        except (ValueError, TypeError):
            pass

    # Calculate status counts across all orders
    counts = {
        "all": orders_qs.count(),
        "new": orders_qs.filter(status=Order.OrderStatuses.NEW).count(),
        "processing": orders_qs.filter(status=Order.OrderStatuses.PROCESSING).count(),
        "ready": orders_qs.filter(status=Order.OrderStatuses.READY).count(),
        "in_delivery": orders_qs.filter(status__in=[Order.OrderStatuses.IN_DELIVERY, "SHIPPED"]).count(),
        "history": orders_qs.filter(status__in=[Order.OrderStatuses.COMPLETED, Order.OrderStatuses.CANCELLED]).count(),
        "total_revenue": float(orders_qs.exclude(status=Order.OrderStatuses.CANCELLED).aggregate(tot=Sum("total_amount"))["tot"] or 0)
    }

    # Filter by status
    if status_param == "NEW":
        orders_qs = orders_qs.filter(status=Order.OrderStatuses.NEW)
    elif status_param == "PROCESSING":
        orders_qs = orders_qs.filter(status=Order.OrderStatuses.PROCESSING)
    elif status_param == "READY":
        orders_qs = orders_qs.filter(status=Order.OrderStatuses.READY)
    elif status_param in ["IN_DELIVERY", "SHIPPED"]:
        orders_qs = orders_qs.filter(status__in=[Order.OrderStatuses.IN_DELIVERY, "SHIPPED"])
    elif status_param in ["HISTORY", "COMPLETED"]:
        orders_qs = orders_qs.filter(status__in=[Order.OrderStatuses.COMPLETED, Order.OrderStatuses.CANCELLED])

    # Filter by search
    if query:
        orders_qs = orders_qs.filter(
            Q(order_number__icontains=query) |
            Q(customer_name__icontains=query) |
            Q(customer_phone__icontains=query)
        )

    # Simple limit / pagination
    limit = int(request.GET.get("limit", 50))
    orders_data = OrderSerializer(orders_qs[:limit], many=True).data

    return Response({
        "counts": counts,
        "orders": orders_data,
        "total": orders_qs.count()
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_detail_view(request, order_id):
    store = get_merchant_store(request)
    order = Order.objects.filter(id=order_id, store=store).first()
    if not order:
        return Response({"error": "Buyurtma topilmadi"}, status=404)
    return Response(OrderSerializer(order).data)

@api_view(["PATCH", "POST"])
@permission_classes([IsAuthenticated])
def update_order_status_view(request, order_id):
    store = get_merchant_store(request)
    order = Order.objects.filter(id=order_id, store=store).first()
    if not order:
        return Response({"error": "Buyurtma topilmadi"}, status=404)

    update_fields = ["updated_at"]
    new_status = request.data.get("status", "").upper()
    new_payment_status = request.data.get("payment_status", "").upper()

    valid_statuses = [s[0] for s in Order.OrderStatuses.choices]
    valid_payment_statuses = [p[0] for p in Order.PaymentStatuses.choices]

    old_status = order.status
    if new_status:
        if new_status not in valid_statuses:
            return Response({"error": f"Noto`g`ri holat: {new_status}"}, status=400)
        order.status = new_status
        update_fields.append("status")

    if new_payment_status:
        if new_payment_status not in valid_payment_statuses:
            return Response({"error": f"Noto`g`ri to`lov holati: {new_payment_status}"}, status=400)
        order.payment_status = new_payment_status
        update_fields.append("payment_status")

    if "courier_id" in request.data:
        courier_id = request.data.get("courier_id")
        if courier_id in [None, "", "null", 0, "0"]:
            order.courier = None
            update_fields.append("courier")
        else:
            courier = StoreStaff.objects.filter(id=courier_id, store=store, is_courier=True).first()
            if not courier:
                return Response({"error": "Kuryer topilmadi"}, status=404)
            order.courier = courier
            update_fields.append("courier")

    order.save(update_fields=update_fields)

    if new_status == Order.OrderStatuses.CANCELLED and old_status != Order.OrderStatuses.CANCELLED:
        for item in order.items.all():
            if item.product:
                item.product.stock += item.quantity
                item.product.save(update_fields=["stock", "updated_at"])

    return Response({
        "message": f"Buyurtma ma`lumotlari muvaffaqiyatli saqlandi",
        "order": OrderSerializer(order).data
    })

