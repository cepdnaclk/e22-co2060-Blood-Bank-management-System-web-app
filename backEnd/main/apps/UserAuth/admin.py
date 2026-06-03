# Register your models here.
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Profile, User


class UserAdmin(BaseUserAdmin):
    """
    Use Django's built-in UserAdmin which properly handles password hashing.
    Without this, saving a user in admin would corrupt the password hash.
    """
    list_display = ["username", "email", "role", "is_active", "is_staff"]
    list_filter = ["role", "is_active", "is_staff"]
    search_fields = ["username", "email"]

    # Fields shown when EDITING an existing user
    fieldsets = (
        (None, {"fields": ("username", "email", "password")}),
        ("Role & Permissions", {"fields": ("role", "is_active", "is_staff", "is_superuser")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    # Fields shown when CREATING a new user via admin
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("username", "email", "role", "password1", "password2"),
        }),
    )

    ordering = ("email",)


class ProfileAdmin(admin.ModelAdmin):
    list_editable = ["district", "hospital"]
    list_display = ["user", "fullName", "district", "hospital"]


admin.site.register(User, UserAdmin)
admin.site.register(Profile, ProfileAdmin)
