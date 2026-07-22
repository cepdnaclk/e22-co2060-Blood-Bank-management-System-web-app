"""
Camp blood transfer service — tracks blood from camp to hospital inventory.

Endpoints:
    GET  /api/v1/donor/camps/<id>/collections/          — list collections for a camp
    POST /api/v1/donor/camps/<id>/collections/dispatch/  — dispatch blood to hospital
    POST /api/v1/blood/camp-blood/<id>/receive/          — receive at hospital
    POST /api/v1/blood/camp-blood/<id>/verify/           — verify & add to inventory
"""

from datetime import timedelta

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.blood.bloodinventor.models.bloodBank import BloodBank
from apps.blood.bloodinventor.models.bloodinventor import BloodInventory
from apps.donor.models.bloodCamp import BloodCamp
from apps.donor.models.campBloodCollection import CampBloodCollection
from apps.donor.models.workflowNotification import WorkflowNotification

ROLE_BLOOD_CAMP = "bloodcamp"
ROLE_ADMIN = "admin"

# Standard blood shelf life — 35 days for whole blood (Sri Lanka NBTS)
BLOOD_SHELF_LIFE_DAYS = 35


def _serialize_collection(c):
    """Serialize a CampBloodCollection to dict."""
    return {
        "id": c.id,
        "campId": c.camp_id,
        "campTitle": c.camp.title,
        "donorName": c.donor.user.username if c.donor and c.donor.user else "Unknown",
        "bloodType": c.blood_type,
        "units": c.units,
        "status": c.status,
        "destinationHospital": {
            "id": c.destination_hospital.id,
            "name": c.destination_hospital.hosName,
        } if c.destination_hospital else None,
        "collectedAt": c.collected_at.isoformat() if c.collected_at else None,
        "transitStartedAt": c.transit_started_at.isoformat() if c.transit_started_at else None,
        "receivedAt": c.received_at.isoformat() if c.received_at else None,
        "qualityCheckedAt": c.quality_checked_at.isoformat() if c.quality_checked_at else None,
        "rejectionReason": c.rejection_reason,
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def camp_collections_list(request, camp_id):
    """
    GET /api/v1/donor/camps/<id>/collections/
    List all blood collections for a camp (camp organizer or admin).
    """
    if request.user.role not in {ROLE_BLOOD_CAMP, ROLE_ADMIN}:
        raise PermissionDenied("Only camp organizers or admins can view collections.")

    camp = get_object_or_404(BloodCamp, pk=camp_id)

    # If camp organizer, verify they own the camp
    if request.user.role == ROLE_BLOOD_CAMP and camp.organizer != request.user:
        raise PermissionDenied("You can only view collections for your own camps.")

    collections = CampBloodCollection.objects.filter(
        camp=camp
    ).select_related("donor__user", "destination_hospital", "camp")

    data = [_serialize_collection(c) for c in collections]
    return Response({"collections": data, "total": len(data)})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def dispatch_camp_blood(request, camp_id):
    """
    POST /api/v1/donor/camps/<id>/collections/dispatch/
    Mark all 'collected' blood for this camp as 'in_transit' to the destination hospital.
    """
    if request.user.role not in {ROLE_BLOOD_CAMP, ROLE_ADMIN}:
        raise PermissionDenied("Only camp organizers can dispatch blood.")

    camp = get_object_or_404(BloodCamp, pk=camp_id)

    if request.user.role == ROLE_BLOOD_CAMP and camp.organizer != request.user:
        raise PermissionDenied("You can only dispatch blood from your own camps.")

    if not camp.destination_hospital:
        return Response(
            {"error": "No destination hospital set for this camp. Please update the camp."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    now = timezone.now()
    updated = CampBloodCollection.objects.filter(
        camp=camp, status="collected"
    ).update(status="in_transit", transit_started_at=now)

    if updated == 0:
        return Response(
            {"detail": "No collected blood to dispatch."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Notify admins
    _notify_admins(
        f"{updated} blood unit(s) dispatched from {camp.title} to {camp.destination_hospital.hosName}."
    )

    return Response({
        "detail": f"{updated} blood unit(s) dispatched to {camp.destination_hospital.hosName}.",
        "unitsDispatched": updated,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def receive_camp_blood(request, collection_id):
    """
    POST /api/v1/blood/camp-blood/<id>/receive/
    Inventory officer receives camp blood at hospital.
    """
    user = request.user
    if user.role not in {"Inventor", "inventory_officer", "admin"}:
        raise PermissionDenied("Only inventory officers can receive blood.")

    collection = get_object_or_404(
        CampBloodCollection.objects.select_related("camp", "destination_hospital"),
        pk=collection_id,
    )

    if collection.status != "in_transit":
        return Response(
            {"error": f"Cannot receive blood in status '{collection.status}'. Must be 'in_transit'."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    collection.status = "received"
    collection.received_at = timezone.now()
    collection.received_by = user
    collection.save(update_fields=["status", "received_at", "received_by", "updated_at"])

    return Response({
        "detail": f"Blood received at hospital. Proceed to quality check.",
        "collection": _serialize_collection(collection),
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_camp_blood(request, collection_id):
    """
    POST /api/v1/blood/camp-blood/<id>/verify/
    Quality check passed → add to hospital blood inventory.
    Payload (optional): { "temperature": 4.0, "reject": false, "rejection_reason": "" }
    """
    user = request.user
    if user.role not in {"Inventor", "inventory_officer", "admin"}:
        raise PermissionDenied("Only inventory officers can verify blood.")

    collection = get_object_or_404(
        CampBloodCollection.objects.select_related(
            "camp", "destination_hospital", "donor__user"
        ),
        pk=collection_id,
    )

    if collection.status != "received":
        return Response(
            {"error": f"Cannot verify blood in status '{collection.status}'. Must be 'received'."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check if rejected
    is_rejected = request.data.get("reject", False)
    if is_rejected:
        reason = request.data.get("rejection_reason", "Quality check failed")
        collection.status = "rejected"
        collection.rejection_reason = reason
        collection.quality_checked_at = timezone.now()
        collection.save(update_fields=[
            "status", "rejection_reason", "quality_checked_at", "updated_at"
        ])
        return Response({"detail": "Blood rejected during quality check."})

    # Quality check passed — add to inventory
    hospital = collection.destination_hospital
    temperature = request.data.get("temperature", 4.0)
    now = timezone.now()
    today = now.date()

    with transaction.atomic():
        # Find or use the hospital's blood bank
        blood_bank = BloodBank.objects.filter(hospital=hospital).first()
        if not blood_bank:
            # Create a default blood bank for this hospital
            blood_bank = BloodBank.objects.create(
                bloodBankName=f"{hospital.hosName} Blood Bank",
                hospital=hospital,
                district=hospital.district,
                country=hospital.country,
            )

        # Create inventory record
        inventory = BloodInventory.objects.create(
            blood_type=collection.blood_type,
            quantity=collection.units,
            blood_bank=blood_bank,
            hospital=hospital,
            collected_date=today,
            expiry_date=today + timedelta(days=BLOOD_SHELF_LIFE_DAYS),
            status="available",
            temperature=temperature,
            source_type="camp",
            source_camp=collection.camp,
        )

        # Update collection status
        collection.status = "added_to_inventory"
        collection.quality_checked_at = now
        collection.inventory_record = inventory
        collection.save(update_fields=[
            "status", "quality_checked_at", "inventory_record", "updated_at"
        ])

        # Update camp's total collected units
        BloodCamp.objects.filter(pk=collection.camp_id).update(
            total_collected_units=CampBloodCollection.objects.filter(
                camp=collection.camp, status="added_to_inventory"
            ).count()
        )

    return Response({
        "detail": f"{collection.blood_type} blood added to {hospital.hosName} inventory.",
        "inventoryId": inventory.id,
        "collection": _serialize_collection(collection),
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def pending_camp_blood_list(request):
    """
    GET /api/v1/blood/camp-blood/pending/
    List all camp blood not yet in inventory (for inventory officers/admins).
    """
    user = request.user
    if user.role not in {"Inventor", "inventory_officer", "admin"}:
        raise PermissionDenied("Only inventory officers can view pending blood.")

    qs = CampBloodCollection.objects.exclude(
        status__in=["added_to_inventory", "rejected"]
    ).select_related("camp", "donor__user", "destination_hospital").order_by("-collected_at")

    hospital_id = request.query_params.get("hospital_id")
    if hospital_id:
        qs = qs.filter(destination_hospital_id=hospital_id)

    data = [_serialize_collection(c) for c in qs[:100]]
    return Response({"collections": data, "total": len(data)})


def _notify_admins(message):
    """Send workflow notification to all admin users."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    admins = User.objects.filter(role="admin", is_active=True)
    notifications = [
        WorkflowNotification(
            user=admin,
            event_type="info",
            message=message,
        )
        for admin in admins
    ]
    if notifications:
        WorkflowNotification.objects.bulk_create(notifications)
