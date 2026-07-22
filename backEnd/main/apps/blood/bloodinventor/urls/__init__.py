from django.urls import include, path

from ..services.public.live_stock_service import live_stock
from ..services.hospital.hospital_stock_service import (
    all_hospitals_stock,
    hospital_inventory_detail,
    hospital_stock,
    national_dashboard,
    national_live_stock,
)
from ..services.hospital.expiry_service import (
    list_expiry_alerts,
    resolve_expiry_alert,
)

urlpatterns = [
    path("public/", include("apps.blood.bloodinventor.urls.public_urls")),
    path("officer/", include("apps.blood.bloodinventor.urls.officer_urls")),
    path("admin/", include("apps.blood.bloodinventor.urls.admin_urls")),
    path("doctor/", include("apps.blood.bloodinventor.urls.doctor_urls")),
    
    # Backward-compatible alias used by existing frontend.
    path("live-stock/", live_stock, name="live_stock"),

    # Hospital-wise and National views
    path("hospital/<int:hospital_id>/stock/", hospital_stock, name="hospital_stock"),
    path("hospitals/stock/", all_hospitals_stock, name="all_hospitals_stock"),
    path("national/live/", national_live_stock, name="national_live_stock"),
    path("national/dashboard/", national_dashboard, name="national_dashboard"),
    path("hospital/<int:hospital_id>/inventory/", hospital_inventory_detail, name="hospital_inventory_detail"),

    # Expiry alerts
    path("expiry/alerts/", list_expiry_alerts, name="expiry_alerts_list"),
    path("expiry/alerts/<int:alert_id>/resolve/", resolve_expiry_alert, name="expiry_alert_resolve"),
]
