from rest_framework.permissions import BasePermission


class IsInventoryOfficer(BasePermission):
    """Allow only inventory officers."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None) in ["Inventor", "inventory_officer"]
        )


class IsAdminRole(BasePermission):
    """Allow only system admins."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None) in ["admin", "adminDashboard"]
        )


class IsAdminOrInventoryOfficer(BasePermission):
    """Allow inventory operations by admin/adminDashboard or inventory officer."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        role = getattr(user, "role", None)
        return role in ["admin", "adminDashboard", "Inventor", "inventory_officer"]

