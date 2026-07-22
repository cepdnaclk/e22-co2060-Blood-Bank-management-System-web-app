"""
Expiry alert management API endpoints.

Endpoints:
    GET  /api/v1/blood/expiry/alerts/              — list active expiry alerts
    POST /api/v1/blood/expiry/alerts/<id>/resolve/  — resolve an expiry alert
"""

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ...models.bloodinventor import BloodInventory
from ...models.expiryAlert import ExpiryAlert
from ...permissions.inventory_permissions import IsAdminOrInventoryOfficer


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrInventoryOfficer])
def list_expiry_alerts(request):
    """
    GET /api/v1/blood/expiry/alerts/
    Query params:
        - hospital_id: filter by hospital
        - alert_type: 'expiring_soon', 'expiring_critical', 'expired'
        - resolved: 'true' or 'false' (default: false)
    """
    hospital_id = request.query_params.get("hospital_id")
    alert_type = request.query_params.get("alert_type")
    show_resolved = request.query_params.get("resolved", "false").lower() == "true"

    qs = ExpiryAlert.objects.select_related("hospital", "inventory")

    if not show_resolved:
        qs = qs.filter(is_resolved=False)

    if hospital_id:
        qs = qs.filter(hospital_id=hospital_id)
    if alert_type:
        qs = qs.filter(alert_type=alert_type)

    alerts = []
    for alert in qs[:100]:
        alerts.append({
            "id": alert.id,
            "alertType": alert.alert_type,
            "bloodType": alert.blood_type,
            "unitsAffected": alert.units_affected,
            "daysUntilExpiry": alert.days_until_expiry,
            "hospital": {
                "id": alert.hospital.id,
                "name": alert.hospital.hosName,
            },
            "inventoryId": alert.inventory_id,
            "isResolved": alert.is_resolved,
            "resolvedAction": alert.resolved_action,
            "resolvedAt": alert.resolved_at.isoformat() if alert.resolved_at else None,
            "createdAt": alert.created_at.isoformat(),
        })

    return Response({"alerts": alerts, "total": len(alerts)})


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminOrInventoryOfficer])
def resolve_expiry_alert(request, alert_id):
    """
    POST /api/v1/blood/expiry/alerts/<id>/resolve/
    Payload: { "action": "used" | "discarded" | "transferred" }
    """
    try:
        alert = ExpiryAlert.objects.get(id=alert_id)
    except ExpiryAlert.DoesNotExist:
        return Response({"error": "Alert not found"}, status=status.HTTP_404_NOT_FOUND)

    if alert.is_resolved:
        return Response(
            {"error": "Alert is already resolved"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    action = request.data.get("action", "").strip()
    valid_actions = ["used", "discarded", "transferred"]
    if action not in valid_actions:
        return Response(
            {"error": f"action must be one of: {', '.join(valid_actions)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    alert.is_resolved = True
    alert.resolved_action = action
    alert.resolved_at = timezone.now()
    alert.save(update_fields=["is_resolved", "resolved_action", "resolved_at"])

    # If discarded, also update the inventory record status
    if action == "discarded" and alert.inventory:
        alert.inventory.status = "deleted"
        alert.inventory.save(update_fields=["status", "updated_at"])

    return Response({
        "message": f"Alert resolved with action: {action}",
        "alertId": alert.id,
    })
