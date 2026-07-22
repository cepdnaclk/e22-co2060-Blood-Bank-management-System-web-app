from django.db import models

from apps.UserAuth.models.hospital import Hospital

from .bloodBank import BloodBank


class BloodInventory(models.Model):

    BLOOD_TYPES = [
        ("A+", "A+"),
        ("A-", "A-"),
        ("B+", "B+"),
        ("B-", "B-"),
        ("O+", "O+"),
        ("O-", "O-"),
        ("AB+", "AB+"),
        ("AB-", "AB-"),
    ]

    STATUS_CHOICES = [
        ("available", "Available"),
        ("reserved", "Reserved"),
        ("expired", "Expired"),
        ("damaged", "Damaged"),
        ("used", "Used"),
        ("deleted", "Deleted"),
    ]

    SOURCE_TYPES = [
        ("camp", "Blood Camp"),
        ("direct", "Direct Donation"),
        ("transfer", "Transfer"),
    ]

    blood_type = models.CharField(max_length=3, choices=BLOOD_TYPES)
    quantity = models.PositiveIntegerField()
    blood_bank = models.ForeignKey(
        BloodBank, on_delete=models.CASCADE, related_name="inventory_items"
    )

    # NEW: Direct hospital FK for fast queries
    hospital = models.ForeignKey(
        Hospital,
        on_delete=models.CASCADE,
        related_name="blood_inventory",
        null=True,
        blank=True,
    )

    collected_date = models.DateField()
    expiry_date = models.DateField(db_index=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="available"
    )
    temperature = models.DecimalField(
        max_digits=5, decimal_places=2, default=4.00
    )

    # Expiry management
    expiry_alert_sent = models.BooleanField(default=False)

    # Source tracking — where this blood unit came from
    source_type = models.CharField(
        max_length=20, choices=SOURCE_TYPES, default="direct"
    )
    source_camp = models.ForeignKey(
        "donor.BloodCamp",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_units",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(
                fields=["hospital", "blood_type", "status"],
                name="idx_hospital_type_status",
            ),
            models.Index(
                fields=["expiry_date", "status"],
                name="idx_expiry_status",
            ),
        ]
        verbose_name = "Blood Inventory"
        verbose_name_plural = "Blood Inventories"

    def __str__(self):
        hospital_name = self.hospital.hosName if self.hospital else "Unknown"
        return f"{self.blood_type} - {self.quantity} units @ {hospital_name}"
