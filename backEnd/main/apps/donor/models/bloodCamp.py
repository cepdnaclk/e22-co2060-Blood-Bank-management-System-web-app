from django.conf import settings
from django.db import models


class BloodCamp(models.Model):
    """
    Model representing a blood donation camp organized by a 'bloodcamp' role user.
    """
    STATUS_CHOICES = [
        ("Upcoming", "Upcoming"),
        ("Ongoing", "Ongoing"),
        ("Completed", "Completed"),
        ("Cancelled", "Cancelled"),
    ]

    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={"role": "bloodcamp"},
        related_name="organized_camps"
    )
    title = models.CharField(max_length=200)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    location = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="Upcoming"
    )

    # NEW: Destination hospital where collected blood will be sent
    destination_hospital = models.ForeignKey(
        "UserAuth.Hospital",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="receiving_camps",
        help_text="Hospital that will receive blood collected at this camp",
    )

    # NEW: Track totals
    total_collected_units = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-start_time"]
        verbose_name = "Blood Camp"
        verbose_name_plural = "Blood Camps"

    def __str__(self):
        return f"{self.title} - {self.date}"
