from django.contrib import admin

from .models.bloodCamp import BloodCamp
from .models.campRegistration import CampRegistration
from .models.donationHistory import DonationHistory
from .models.donorAlert import DonorAlert
from .models.donorDetails import DonorDetails
from .models.campBloodCollection import CampBloodCollection
from .models.workflowNotification import WorkflowNotification


@admin.register(DonorDetails)
class DonorAdmin(admin.ModelAdmin):
    list_display = ("user", "is_available", "last_donation_date", "total_donations")
    search_fields = ("user__username", "user__email", "user__profile__fullName")
    list_filter = ("is_available",)


@admin.register(DonorAlert)
class DonorAlertAdmin(admin.ModelAdmin):
    list_display = ("donor", "alert_type", "is_read", "created_at")
    list_filter = ("alert_type", "is_read")
    search_fields = ("message",)


@admin.register(DonationHistory)
class DonationHistoryAdmin(admin.ModelAdmin):
    list_display = ("donor", "donation_date", "hospital_name", "blood_group", "units", "status")
    list_filter = ("status", "blood_group")
    search_fields = ("donor__user__username", "hospital_name")
    date_hierarchy = "donation_date"


@admin.register(BloodCamp)
class BloodCampAdmin(admin.ModelAdmin):
    list_display = ("title", "organizer", "date", "status", "location", "destination_hospital")
    list_filter = ("status", "date")
    search_fields = ("title", "location", "organizer__username")
    date_hierarchy = "date"


@admin.register(CampRegistration)
class CampRegistrationAdmin(admin.ModelAdmin):
    list_display = ("donor", "camp", "status", "appointment_time", "created_at")
    list_filter = ("status", "camp")
    search_fields = ("donor__user__username", "camp__title")


@admin.register(WorkflowNotification)
class WorkflowNotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "event_type", "is_read", "created_at")
    list_filter = ("event_type", "is_read")
    search_fields = ("message", "user__username", "user__email")


@admin.register(CampBloodCollection)
class CampBloodCollectionAdmin(admin.ModelAdmin):
    list_display = (
        "camp", "donor", "blood_type", "units",
        "destination_hospital", "status", "collected_at",
    )
    list_filter = ("status", "blood_type", "destination_hospital")
    search_fields = ("camp__title", "donor__user__username")
