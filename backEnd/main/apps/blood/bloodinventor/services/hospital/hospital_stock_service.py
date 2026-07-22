"""
Hospital-wise and national blood stock API endpoints.

Public endpoints:
    GET /api/v1/blood/hospital/<id>/stock/      — stock for a specific hospital
    GET /api/v1/blood/hospitals/stock/           — all hospitals summary
    GET /api/v1/blood/national/live/             — national live stock with filters

Admin endpoints:
    GET /api/v1/blood/national/dashboard/        — detailed national dashboard data
    GET /api/v1/blood/hospital/<id>/inventory/   — detailed inventory for a hospital
"""

from datetime import timedelta

from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.UserAuth.models.hospital import Hospital

from ...models.bloodinventor import BloodInventory
from ...models.expiryAlert import ExpiryAlert
from ...permissions.inventory_permissions import IsAdminRole, IsAdminOrInventoryOfficer

BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]


def _get_stock_status(total):
    """Return stock status label based on unit count."""
    if total < 10:
        return "Critical"
    if total < 30:
        return "Low"
    return "Normal"


def _build_blood_type_summary(queryset):
    """Aggregate available units by blood type from a queryset."""
    today = timezone.localdate()
    rows = (
        queryset.filter(status="available", expiry_date__gte=today)
        .values("blood_type")
        .annotate(total_units=Sum("quantity"))
    )
    units_map = {row["blood_type"]: int(row["total_units"] or 0) for row in rows}

    result = []
    for bt in BLOOD_TYPES:
        units = units_map.get(bt, 0)
        result.append({
            "bloodType": bt,
            "units": units,
            "status": _get_stock_status(units),
        })
    return result


# ─── Public: Single Hospital Stock ──────────────────────────────


@api_view(["GET"])
@permission_classes([AllowAny])
def hospital_stock(request, hospital_id):
    """
    GET /api/v1/blood/hospital/<id>/stock/
    Returns blood stock for a specific hospital (public view).
    """
    try:
        hospital = Hospital.objects.get(id=hospital_id)
    except Hospital.DoesNotExist:
        return Response({"error": "Hospital not found"}, status=404)

    qs = BloodInventory.objects.filter(hospital=hospital)
    summary = _build_blood_type_summary(qs)
    return Response(summary, status=200)


@api_view(["GET"])
@permission_classes([AllowAny])
def all_hospitals_stock(request):
    """
    GET /api/v1/blood/hospitals/stock/
    Returns blood stock for all hospitals (public view).
    """
    today = timezone.localdate()
    hospitals = Hospital.objects.select_related("district").all()
    hospitals_data = []

    for h in hospitals:
        total_units = BloodInventory.objects.filter(
            hospital=h,
            status="available",
            expiry_date__gte=today
        ).aggregate(total=Sum("quantity"))["total"] or 0

        expiring_soon = BloodInventory.objects.filter(
            hospital=h,
            status="available",
            expiry_date__gte=today,
            expiry_date__lte=today + timedelta(days=7)
        ).aggregate(total=Sum("quantity"))["total"] or 0

        hospitals_data.append({
            "id": h.id,
            "name": h.hosName,
            "district": h.district.districtName if h.district else None,
            "totalUnits": total_units,
            "status": _get_stock_status(total_units),
            "expiringSoon": expiring_soon,
        })

    return Response({"hospitals": hospitals_data}, status=200)


@api_view(["GET"])
@permission_classes([AllowAny])
def national_live_stock(request):
    """
    GET /api/v1/blood/national/live/
    Returns national live stock summary, optionally filtered by hospital or district.
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
            "status": _get_stock_status(units),
        })

    return Response({
        "updatedAt": timezone.now().isoformat(),
        "stocks": stocks
    }, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminRole])
def national_dashboard(request):
    """
    GET /api/v1/blood/national/dashboard/
    Returns complete dashboard details for administrators.
    """
    today = timezone.localdate()

    total_units = BloodInventory.objects.filter(
        status="available",
        expiry_date__gte=today
    ).aggregate(total=Sum("quantity"))["total"] or 0

    total_hospitals = Hospital.objects.count()

    try:
        from apps.donor.models.campBloodCollection import CampBloodCollection
        pending_camp_blood = CampBloodCollection.objects.exclude(
            status__in=["added_to_inventory", "rejected"]
        ).aggregate(total=Sum("units"))["total"] or 0
    except Exception:
        pending_camp_blood = 0

    alerts = ExpiryAlert.objects.filter(is_resolved=False)
    alert_summary = {
        "expiring_soon": alerts.filter(alert_type="expiring_soon").count(),
        "expiring_critical": alerts.filter(alert_type="expiring_critical").count(),
        "expired": alerts.filter(alert_type="expired").count(),
    }

    national_qs = BloodInventory.objects.all()
    national_stock = _build_blood_type_summary(national_qs)

    hospitals = Hospital.objects.select_related("district").all()
    hospitals_data = []
    for h in hospitals:
        h_units = BloodInventory.objects.filter(
            hospital=h,
            status="available",
            expiry_date__gte=today
        ).aggregate(total=Sum("quantity"))["total"] or 0

        h_exp_soon = BloodInventory.objects.filter(
            hospital=h,
            status="available",
            expiry_date__gte=today,
            expiry_date__lte=today + timedelta(days=7)
        ).aggregate(total=Sum("quantity"))["total"] or 0

        hospitals_data.append({
            "id": h.id,
            "name": h.hosName,
            "district": h.district.districtName if h.district else None,
            "totalUnits": h_units,
            "status": _get_stock_status(h_units),
            "expiringSoon": h_exp_soon,
        })

    return Response({
        "updatedAt": timezone.now().isoformat(),
        "totalUnits": total_units,
        "totalHospitals": total_hospitals,
        "pendingCampBlood": pending_camp_blood,
        "alertSummary": alert_summary,
        "nationalStock": national_stock,
        "hospitals": hospitals_data
    }, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrInventoryOfficer])
def hospital_inventory_detail(request, hospital_id):
    """
    GET /api/v1/blood/hospital/<id>/inventory/
    Returns inventory details for a hospital.
    """
    today = timezone.localdate()
    try:
        hospital = Hospital.objects.select_related("district").get(id=hospital_id)
    except Hospital.DoesNotExist:
        return Response({"error": "Hospital not found"}, status=404)

    h_data = {
        "id": hospital.id,
        "name": hospital.hosName,
        "address": hospital.address,
        "district": hospital.district.districtName if hospital.district else None,
        "phone": hospital.phone
    }

    qs = BloodInventory.objects.filter(hospital=hospital)
    stock_summary = _build_blood_type_summary(qs)

    inventory_items = []
    for item in BloodInventory.objects.filter(hospital=hospital):
        days_to_expiry = (item.expiry_date - today).days
        inventory_items.append({
            "id": item.id,
            "bloodType": item.blood_type,
            "collectedDate": item.collected_date.isoformat(),
            "expiryDate": item.expiry_date.isoformat(),
            "daysToExpiry": days_to_expiry,
            "sourceType": item.source_type,
            "status": item.status
        })

    alerts = ExpiryAlert.objects.filter(hospital=hospital, is_resolved=False)
    alert_summary = {
        "expiring_soon": alerts.filter(alert_type="expiring_soon").count(),
        "expiring_critical": alerts.filter(alert_type="expiring_critical").count(),
        "expired": alerts.filter(alert_type="expired").count(),
    }

    expiring_soon = BloodInventory.objects.filter(
        hospital=hospital,
        status="available",
        expiry_date__gte=today,
        expiry_date__lte=today + timedelta(days=7)
    ).aggregate(total=Sum("quantity"))["total"] or 0

    return Response({
        "hospital": h_data,
        "stockSummary": stock_summary,
        "inventory": inventory_items,
        "alertSummary": alert_summary,
        "expiringSoon": expiring_soon
    }, status=200)
