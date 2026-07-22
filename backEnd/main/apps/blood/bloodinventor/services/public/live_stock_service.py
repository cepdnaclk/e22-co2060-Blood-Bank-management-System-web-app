from django.db.models import Sum
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...models.bloodinventor import BloodInventory

BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]


def get_stock_status(total):
    if total < 10:
        return "Critical"
    if total < 30:
        return "Low"
    return "Normal"


@api_view(["GET"])
@permission_classes([AllowAny])
def live_stock(request):
    """
    GET /api/v1/blood/live-stock/
    Enhanced live stock — supports optional hospital_id and district_id filters.
    Without filters: returns national aggregate.
    """
    today = timezone.localdate()
    hospital_id = request.query_params.get("hospital_id")
    district_id = request.query_params.get("district_id")

    qs = BloodInventory.objects.filter(status="available", expiry_date__gte=today)

    if hospital_id:
        qs = qs.filter(hospital_id=hospital_id)
    if district_id:
        qs = qs.filter(hospital__district_id=district_id)

    rows = qs.values("blood_type").annotate(total_units=Sum("quantity"))
    units_by_type = {row["blood_type"]: int(row["total_units"] or 0) for row in rows}

    stocks = []
    for blood_type in BLOOD_TYPES:
        units = units_by_type.get(blood_type, 0)
        stocks.append({
            "bloodType": blood_type,
            "units": units,
            "status": get_stock_status(units),
        })

    return Response({
        "updatedAt": timezone.now().isoformat(),
        "stocks": stocks
    }, status=200)
