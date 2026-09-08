from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.orders.models import Customer
from .views_auth import get_merchant_store
from .serializers import CustomerSerializer

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def customers_list_view(request):
    store = get_merchant_store(request)
    if not store:
        return Response({"error": "Dokon topilmadi"}, status=404)

    query = request.GET.get("q", "").strip()
    qs = Customer.objects.filter(store=store).order_by("-created_at")

    if query:
        qs = qs.filter(
            Q(name__icontains=query) |
            Q(phone__icontains=query)
        )

    return Response({
        "customers": CustomerSerializer(qs[:100], many=True).data,
        "total": qs.count()
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def adjust_bonus_view(request):
    store = get_merchant_store(request)
    customer_id = request.data.get("customer_id")
    points = int(request.data.get("points", 0))

    customer = Customer.objects.filter(id=customer_id, store=store).first()
    if not customer:
        return Response({"error": "Mijoz topilmadi"}, status=404)

    customer.bonus_balance = max(0, customer.bonus_balance + points)
    customer.save(update_fields=["bonus_balance"])

    return Response({
        "message": f"{points} bonus ball berildi!",
        "new_balance": customer.bonus_balance,
        "customer": CustomerSerializer(customer).data
    })
