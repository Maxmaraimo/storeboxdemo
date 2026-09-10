from decimal import Decimal
import json
from django.utils import timezone
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.orders.models import Order, OrderItem, Customer, ChatMessage
from .views_auth import get_merchant_store

MONTH_NAMES_UZ_SHORT = ["", "Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"]

def get_dashboard_heatmap_data(store):
    """Computes a GitHub-style 52-week activity calendar matrix for merchant orders."""
    now = timezone.now()
    today = timezone.localdate(now)
    
    today_weekday = today.weekday() # Monday is 0, Sunday is 6
    start_date = today - timezone.timedelta(days=(52 * 7) + today_weekday)
    
    orders_qs = Order.objects.filter(
        store=store,
        created_at__date__gte=start_date,
        created_at__date__lte=today
    ).exclude(status=Order.OrderStatuses.CANCELLED)
    
    daily_stats = (
        orders_qs.annotate(d=TruncDate('created_at'))
        .values('d')
        .annotate(
            count=Count('id'),
            revenue=Sum('total_amount')
        )
    )
    
    stats_by_date = {
        row['d'].strftime('%Y-%m-%d'): {
            'count': row['count'],
            'revenue': float(row['revenue'] or 0)
        }
        for row in daily_stats
    }
    
    days = []
    weeks = []
    curr = start_date
    
    total_orders = 0
    total_revenue = 0.0
    active_days = 0
    max_orders_day = 0
    best_date = None
    longest_streak = 0
    temp_streak = 0
    
    current_week_days = []
    current_week_index = 0
    last_labeled_month = None
    
    while curr <= today:
        d_str = curr.strftime('%Y-%m-%d')
        stat = stats_by_date.get(d_str, {'count': 0, 'revenue': 0.0})
        cnt = stat['count']
        rev = stat['revenue']
        
        if cnt == 0:
            level = 0
        elif cnt <= 2:
            level = 1
        elif cnt <= 5:
            level = 2
        elif cnt <= 9:
            level = 3
        else:
            level = 4
            
        if cnt > 0:
            total_orders += cnt
            total_revenue += rev
            active_days += 1
            temp_streak += 1
            if temp_streak > longest_streak:
                longest_streak = temp_streak
            if cnt > max_orders_day:
                max_orders_day = cnt
                best_date = d_str
        else:
            temp_streak = 0
            
        day_obj = {
            'date': d_str,
            'count': cnt,
            'revenue': rev,
            'level': level,
            'weekday': curr.weekday(),
            'month': curr.month,
            'day': curr.day,
            'year': curr.year,
            'is_today': (curr == today),
            'is_future': False
        }
        days.append(day_obj)
        current_week_days.append(day_obj)
        
        if curr.weekday() == 6:
            month_for_week = current_week_days[0]['month']
            label = None
            if month_for_week != last_labeled_month:
                label = MONTH_NAMES_UZ_SHORT[month_for_week]
                last_labeled_month = month_for_week
                
            weeks.append({
                'week_index': current_week_index,
                'month_label': label,
                'days': current_week_days
            })
            current_week_index += 1
            current_week_days = []
            
        curr += timezone.timedelta(days=1)
        
    if current_week_days:
        month_for_week = current_week_days[0]['month']
        label = None
        if month_for_week != last_labeled_month:
            label = MONTH_NAMES_UZ_SHORT[month_for_week]
            last_labeled_month = month_for_week
            
        for pad_w in range(len(current_week_days), 7):
            pad_date = today + timezone.timedelta(days=(pad_w - today.weekday()))
            current_week_days.append({
                'date': pad_date.strftime('%Y-%m-%d'),
                'count': 0,
                'revenue': 0.0,
                'level': -1,
                'weekday': pad_w,
                'month': pad_date.month,
                'day': pad_date.day,
                'year': pad_date.year,
                'is_today': False,
                'is_future': True
            })
            
        weeks.append({
            'week_index': current_week_index,
            'month_label': label,
            'days': current_week_days
        })
        
    current_streak = 0
    check_day = today
    while check_day >= start_date:
        d_str = check_day.strftime('%Y-%m-%d')
        if stats_by_date.get(d_str, {}).get('count', 0) > 0:
            current_streak += 1
            check_day -= timezone.timedelta(days=1)
        else:
            if check_day == today:
                check_day -= timezone.timedelta(days=1)
                continue
            break

    return {
        'total_orders': total_orders,
        'total_revenue': total_revenue,
        'active_days': active_days,
        'max_orders_day': max_orders_day,
        'best_date': best_date,
        'longest_streak': longest_streak,
        'current_streak': current_streak,
        'start_date': start_date.strftime('%Y-%m-%d'),
        'end_date': today.strftime('%Y-%m-%d'),
        'weeks': weeks,
        'days': days
    }

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
            },
            "heatmap": get_dashboard_heatmap_data(store),
        },
        "top_products": top_products,
        "map_orders": map_orders
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_notifications_view(request):
    """Returns dynamic real-time unread counts and notification items for the store."""
    store = get_merchant_store(request)
    if not store:
        return Response({
            "new_orders_count": 0,
            "unread_chats_count": 0,
            "total_unread": 0,
            "notifications": []
        })

    new_orders_qs = Order.objects.filter(store=store, status=Order.OrderStatuses.NEW).order_by("-created_at")
    new_orders_count = new_orders_qs.count()

    unread_chats_qs = ChatMessage.objects.filter(
        store=store,
        sender=ChatMessage.Senders.CUSTOMER,
        is_read=False
    ).order_by("-created_at")
    unread_chats_count = unread_chats_qs.values("customer_phone").distinct().count()

    total_unread = new_orders_count + unread_chats_count

    notifications = []
    for o in new_orders_qs[:10]:
        notifications.append({
            "id": f"order_{o.id}",
            "type": "order",
            "title": f"Yangi buyurtma #{o.order_number}",
            "body": f"{o.customer_name or 'Mijoz'} - {float(o.total_amount):,.0f} so'm",
            "created_at": o.created_at.isoformat(),
            "url": "/orders",
            "is_read": False,
        })

    seen_phones = set()
    for m in unread_chats_qs[:20]:
        if m.customer_phone not in seen_phones:
            seen_phones.add(m.customer_phone)
            notifications.append({
                "id": f"chat_{m.id}",
                "type": "chat",
                "title": f"Yangi xabar: {m.customer_name or m.customer_phone}",
                "body": m.message[:60] + ("..." if len(m.message) > 60 else ""),
                "created_at": m.created_at.isoformat(),
                "url": "/chats",
                "is_read": False,
            })

    notifications.sort(key=lambda x: x["created_at"], reverse=True)

    return Response({
        "new_orders_count": new_orders_count,
        "unread_chats_count": unread_chats_count,
        "total_unread": total_unread,
        "notifications": notifications[:15],
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def dashboard_mark_notifications_read_view(request):
    """Marks unread customer chat messages as read for this store."""
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)

    ChatMessage.objects.filter(
        store=store,
        sender=ChatMessage.Senders.CUSTOMER,
        is_read=False
    ).update(is_read=True)

    return Response({"message": "Barcha xabarlar o'qildi deb belgilandi", "success": True})
