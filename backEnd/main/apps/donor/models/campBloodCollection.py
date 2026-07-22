from django.conf import settings
from django.db import models

from .bloodCamp import BloodCamp
from .campRegistration import CampRegistration
from .donorDetails import DonorDetails


class CampBloodCollection(models.Model):
    """
    Tracks individual blood units collected at a blood camp.
    Bridges the gap between camp donation and hospital inventory.

    Lifecycle:
        collected → in_transit → received → quality_check → added_to_inventory
                                                          → rejected
    """

    STATUS_CHOICES = [
        ("collected", "Collected at Camp"),
        ("in_transit", "In Transit to Hospital"),
        ("received", "Received at Hospital"),
        ("quality_check", "Quality Check"),
        ("added_to_inventory", "Added to Inventory"),
        ("rejected", "Rejected (Quality Failed)"),
    ]

    camp = models.ForeignKey(
        BloodCamp,
        on_delete=models.CASCADE,
        related_name="blood_collections",
    )
    registration = models.OneToOneField(
        CampRegistration,
        on_delete=models.CASCADE,
        related_name="blood_collection",
    )
    donor = models.ForeignKey(
        DonorDetails,
        on_delete=models.CASCADE,
        related_name="camp_blood_collections",
    )

    blood_type = models.CharField(max_length=3)
    units = models.PositiveIntegerField(default=1)
    collected_at = models.DateTimeField(auto_now_add=True)

    # Destination hospital (from camp's destination_hospital)
    destination_hospital = models.ForeignKey(
        "UserAuth.Hospital",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="incoming_camp_blood",
    )

    # Status tracking
    status = models.CharField(
        max_length=25, choices=STATUS_CHOICES, default="collected"
    )
    transit_started_at = models.DateTimeField(null=True, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="received_camp_blood",
    )
    quality_checked_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    # Link to the BloodInventory record created when added to inventory
    inventory_record = models.ForeignKey(
        "bloodinventor.BloodInventory",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="source_collection",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-collected_at"]
        verbose_name = "Camp Blood Collection"
        verbose_name_plural = "Camp Blood Collections"

    def __str__(self):
        dest = self.destination_hospital.hosName if self.destination_hospital else "Unassigned"
        return f"{self.blood_type} from {self.camp.title} → {dest} ({self.status})"
