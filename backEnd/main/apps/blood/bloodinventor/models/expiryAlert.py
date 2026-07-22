from django.db import models

from apps.UserAuth.models.hospital import Hospital

from .bloodinventor import BloodInventory


class ExpiryAlert(models.Model):
    """
    Tracks blood units approaching or past expiry.
    Created by the daily `check_blood_expiry` management command.
    """

    ALERT_TYPES = [
        ("expiring_soon", "Expiring Soon (7 days)"),
        ("expiring_critical", "Expiring Critical (3 days)"),
        ("expired", "Expired"),
    ]

    RESOLVE_ACTIONS = [
        ("used", "Used Before Expiry"),
        ("discarded", "Discarded"),
        ("transferred", "Transferred"),
    ]

    inventory = models.ForeignKey(
        BloodInventory,
        on_delete=models.CASCADE,
        related_name="expiry_alerts",
    )
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    hospital = models.ForeignKey(
        Hospital,
        on_delete=models.CASCADE,
        related_name="expiry_alerts",
    )
    blood_type = models.CharField(max_length=3)
    units_affected = models.PositiveIntegerField()
    days_until_expiry = models.IntegerField()

    is_resolved = models.BooleanField(default=False)
    resolved_action = models.CharField(
        max_length=50, choices=RESOLVE_ACTIONS, blank=True
    )
    resolved_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["days_until_expiry", "-created_at"]
        verbose_name = "Expiry Alert"
        verbose_name_plural = "Expiry Alerts"

    def __str__(self):
        hospital_name = self.hospital.hosName if self.hospital else "Unknown"
        return (
            f"[{self.alert_type}] {self.blood_type} "
            f"@ {hospital_name} - {self.days_until_expiry} days"
        )
