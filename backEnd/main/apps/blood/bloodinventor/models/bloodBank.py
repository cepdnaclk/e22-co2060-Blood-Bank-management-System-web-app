from django.db import models

from apps.UserAuth.models.hospital import Hospital
from apps.UserAuth.models.location import Country, District

__all__ = ["BloodBank"]


class BloodBank(models.Model):
    bloodBankName = models.CharField(max_length=100)
    postTalCode = models.CharField(max_length=20, blank=True)
    district = models.ForeignKey(
        District, on_delete=models.CASCADE, related_name="blood_banks"
    )
    country = models.ForeignKey(
        Country, on_delete=models.CASCADE, related_name="blood_banks"
    )
    registrationId = models.CharField(max_length=50, blank=True)

    # NEW: Link to hospital (each hospital has one blood bank)
    hospital = models.OneToOneField(
        Hospital,
        on_delete=models.CASCADE,
        related_name="blood_bank",
        null=True,
        blank=True,
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        hospital_name = self.hospital.hosName if self.hospital else "No Hospital"
        return f"{self.bloodBankName} ({hospital_name})"

    class Meta:
        verbose_name = "Blood Bank"
        verbose_name_plural = "Blood Banks"
