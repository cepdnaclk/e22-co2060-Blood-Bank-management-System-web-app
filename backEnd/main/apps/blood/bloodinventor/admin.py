from django.contrib import admin

from .models.bloodBank import BloodBank
from .models.bloodinventor import BloodInventory
from .models.bloodRequest import BloodRequest
from .models.expiryAlert import ExpiryAlert
from .models.inventoryChangeRequest import InventoryChangeRequest


@admin.register(BloodBank)
class BloodBankAdmin(admin.ModelAdmin):
    list_display = ("bloodBankName", "hospital", "district", "country", "is_active")
    list_filter = ("is_active", "country", "district")
    search_fields = ("bloodBankName", "hospital__hosName")


@admin.register(BloodInventory)
class BloodInventoryAdmin(admin.ModelAdmin):
    list_display = (
        "blood_type",
        "quantity",
        "hospital",
        "blood_bank",
        "status",
        "expiry_date",
        "source_type",
    )
    list_filter = ("blood_type", "status", "source_type", "hospital")
    search_fields = ("hospital__hosName", "blood_bank__bloodBankName")
    date_hierarchy = "expiry_date"


@admin.register(BloodRequest)
class BloodRequestAdmin(admin.ModelAdmin):
    list_display = (
        "doctor",
        "blood_group",
        "units_requested",
        "status",
        "priority_level",
        "created_at",
    )
    list_filter = ("status", "priority_level", "blood_group")


@admin.register(ExpiryAlert)
class ExpiryAlertAdmin(admin.ModelAdmin):
    list_display = (
        "blood_type",
        "hospital",
        "alert_type",
        "units_affected",
        "days_until_expiry",
        "is_resolved",
    )
    list_filter = ("alert_type", "is_resolved", "hospital")


@admin.register(InventoryChangeRequest)
class InventoryChangeRequestAdmin(admin.ModelAdmin):
    list_display = ("action", "status", "blood_type", "quantity_delta", "created_at")
    list_filter = ("action", "status")
