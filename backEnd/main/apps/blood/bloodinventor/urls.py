from django.urls import include, path

from .services.hospital.hospital_stock_service import (
    all_hospitals_stock,
    hospital_inventory_detail,
    hospital_stock,
    national_dashboard,
    national_live_stock,
)
from .services.hospital.expiry_service import (
    list_expiry_alerts,
    resolve_expiry_alert,
)
from .services.public.live_stock_service import live_stock

urlpatterns = [
    # Existing sub-URL includes
    path("public/", include("apps.blood.bloodinventor.urls_public")),
    path("officer/", include("apps.blood.bloodinventor.urls_officer")),
    path("admin/", include("apps.blood.bloodinventor.urls_admin")),

    # Backward-compatible alias used by existing frontend.
    path("live-stock/", live_stock, name="live_stock"),

    # ─── NEW: Hospital-wise stock (public) ───────────────────────
    path("hospital/<int:hospital_id>/stock/", hospital_stock, name="hospital_stock"),
    path("hospitals/stock/", all_hospitals_stock, name="all_hospitals_stock"),

    # ─── NEW: National views ─────────────────────────────────────
    path("national/live/", national_live_stock, name="national_live_stock"),
    path("national/dashboard/", national_dashboard, name="national_dashboard"),

    # ─── NEW: Hospital detail (admin) ────────────────────────────
    path("hospital/<int:hospital_id>/inventory/", hospital_inventory_detail, name="hospital_inventory_detail"),

    # ─── NEW: Expiry alerts ──────────────────────────────────────
    path("expiry/alerts/", list_expiry_alerts, name="expiry_alerts_list"),
    path("expiry/alerts/<int:alert_id>/resolve/", resolve_expiry_alert, name="expiry_alert_resolve"),
]
