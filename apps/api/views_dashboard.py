from decimal import Decimal
import json
from django.utils import timezone
from django.db.models import Sum
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.orders.models import Order, OrderItem, Customer
from .views_auth import get_merchant_store

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_summary_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)

    period = request.GET.get("period", "today")
    custom_start = request.GET.get("start_date", "").strip()
    custom_end = request.GET.get("end_date", "").strip()
    now = timezone.now()

    store_orders = Order.objects.filter(store=store)

    if custom_start and custom_end:
        try:
            s_date = timezone.datetime.strptime(custom_start, "%Y-%m-%d").date()
            e_date = timezone.datetime.strptime(custom_end, "%Y-%m-%d").date()
            if s_date > e_date:
                s_date, e_date = e_date, s_date
            start_date = timezone.make_aware(timezone.datetime.combine(s_date, timezone.datetime.min.time()))
            end_date = timezone.make_aware(timezone.datetime.combine(e_date, timezone.datetime.max.time()))
            period = "custom"
        except Exception:
            start_date = (now - timezone.timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = now
    elif period == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    elif period == "week":
        start_date = (now - timezone.timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    elif period == "month":
        start_date = (now - timezone.timedelta(days=30)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    elif period == "quarter":
        start_date = (now - timezone.timedelta(days=90)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    elif period == "year":
        start_date = (now - timezone.timedelta(days=365)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    else:
        start_date = (now - timezone.timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now

    orders_scope = store_orders.filter(created_at__range=(start_date, end_date))

    sotuvlar_summasi = orders_scope.exclude(status=Order.OrderStatuses.CANCELLED).aggregate(
        total=Sum("total_amount")
    )["total"] or Decimal("0")

    yetkazib_berish_summasi = orders_scope.exclude(status=Order.OrderStatuses.CANCELLED).aggregate(
        total=Sum("delivery_fee")
    )["total"] or Decimal("0")

    foyda = sotuvlar_summasi - yetkazib_berish_summasi
    if foyda < Decimal("0"):
        foyda = sotuvlar_summasi

    orders_count = orders_scope.count()
    yangi_orders = orders_scope.filter(status=Order.OrderStatuses.NEW).count()
    tayyor_orders = orders_scope.filter(status__in=[Order.OrderStatuses.READY, Order.OrderStatuses.COMPLETED]).count()
    bekor_qilindi = orders_scope.filter(status=Order.OrderStatuses.CANCELLED).count()

    total_customers = Customer.objects.filter(store=store).count()
    avg_order = (foyda / orders_count) if orders_count > 0 else Decimal("0")

    web_cnt = store_orders.filter(source=Order.Sources.WEB).count()
    tma_cnt = store_orders.filter(source=Order.Sources.TELEGRAM_MINI_APP).count()

    # Timeline chart
    chart_labels = []
    chart_revenue = []
    
    if period == "today":
        chart_labels = [f"{h:02d}:00" for h in range(0, 24, 2)]
        chart_revenue = [0.0] * 12
        for o in orders_scope.exclude(status=Order.OrderStatuses.CANCELLED):
            local_hour = timezone.localtime(o.created_at).hour
            slot = local_hour // 2
            if slot < 12:
                chart_revenue[slot] += float(o.total_amount)
    elif period == "week":
        for i in range(6, -1, -1):
            day_date = (now - timezone.timedelta(days=i)).date()
            label = day_date.strftime("%d.%m")
            rev = store_orders.filter(
                created_at__date=day_date
            ).exclude(status=Order.OrderStatuses.CANCELLED).aggregate(tot=Sum("total_amount"))["tot"] or 0
            chart_labels.append(label)
            chart_revenue.append(float(rev))
    elif period == "custom":
        num_days = max(1, (end_date.date() - start_date.date()).days + 1)
        step = max(1, num_days // 10)
        curr = start_date.date()
        while curr <= end_date.date():
            next_curr = min(end_date.date() + timezone.timedelta(days=1), curr + timezone.timedelta(days=step))
            rev = store_orders.filter(
                created_at__date__gte=curr,
                created_at__date__lt=next_curr
            ).exclude(status=Order.OrderStatuses.CANCELLED).aggregate(tot=Sum("total_amount"))["tot"] or 0
            chart_labels.append(curr.strftime("%d.%m"))
            chart_revenue.append(float(rev))
            curr = next_curr
    elif period == "month":
        for i in range(29, -1, -3):
            day_date = (now - timezone.timedelta(days=i)).date()
            label = day_date.strftime("%d.%m")
            rev = store_orders.filter(
                created_at__date__gte=day_date,
                created_at__date__lt=day_date + timezone.timedelta(days=3)
            ).exclude(status=Order.OrderStatuses.CANCELLED).aggregate(tot=Sum("total_amount"))["tot"] or 0
            chart_labels.append(label)
            chart_revenue.append(float(rev))
    else: # quarter or year
        for i in range(11, -1, -1):
            day_date = (now - timezone.timedelta(days=i * 30)).date()
            label = day_date.strftime("%m.%y")
            rev = store_orders.filter(
                created_at__date__gte=day_date,
                created_at__date__lt=day_date + timezone.timedelta(days=30)
            ).exclude(status=Order.OrderStatuses.CANCELLED).aggregate(tot=Sum("total_amount"))["tot"] or 0
            chart_labels.append(label)
            chart_revenue.append(float(rev))

    # Top products
    top_products_qs = OrderItem.objects.filter(order__in=orders_scope).values("product_name").annotate(
        sold_qty=Sum("quantity"),
        sold_sum=Sum("total_price")
    ).order_by("-sold_qty")[:8]
    
    if not top_products_qs.exists():
        top_products_qs = OrderItem.objects.filter(order__store=store).values("product_name").annotate(
            sold_qty=Sum("quantity"),
            sold_sum=Sum("total_price")
        ).order_by("-sold_qty")[:8]

    top_products = list(top_products_qs)

    # Deliveries map
    map_orders = []
    for ord in store_orders.filter(delivery_lat__isnull=False, delivery_lng__isnull=False)[:30]:
        map_orders.append({
            "num": ord.order_number,
            "client": ord.customer_name,
            "lat": ord.delivery_lat,
            "lng": ord.delivery_lng,
            "total": float(ord.total_amount),
            "status": ord.get_status_display()
        })

    return Response({
        "metrics": {
            "period": period,
            "revenue": float(foyda),
            "sales_sum": float(sotuvlar_summasi),
            "delivery_fee": float(yetkazib_berish_summasi),
            "orders_count": orders_count,
            "new_orders": yangi_orders,
            "ready_orders": tayyor_orders,
            "cancelled_orders": bekor_qilindi,
            "total_customers": total_customers,
            "avg_order": float(avg_order),
            "web_cnt": web_cnt,
            "tma_cnt": tma_cnt
        },
        "charts": {
            "labels": chart_labels,
            "revenue": chart_revenue,
            "traffic": {
                "web": web_cnt,
                "telegram": tma_cnt
            }
        },
        "top_products": top_products,
        "map_orders": map_orders
    })
