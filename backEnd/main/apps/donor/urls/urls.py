from django.urls import path

from ..services.bloodCampService import (
    UpcomingBloodCampsView,
    LatestPublicBloodCampView,
    OrganizerBloodCampView,
    MarkArrivedCampRegistrationView,
    SendToScreeningCampRegistrationView,
    ScreeningQueueView,
    RegisterForCampView,
    CampRegistrationsView,
    ApproveCampRegistrationView,
    RejectCampRegistrationView,
    CompleteCampRegistrationView,
    DonorAfterDonateView,
)
from ..services.campBloodTransferService import (
    camp_collections_list,
    dispatch_camp_blood,
    pending_camp_blood_list,
    receive_camp_blood,
    verify_camp_blood,
)
from ..services.donationHistoryService import DonorDonationHistoryView
from ..services.donorAlertService import DonorAlertListView, DonorAlertMarkReadView
from ..services.donorDashboardService import DonorDashboardView
from ..services.donorService import DonorProfileView
from ..services.public.donorQrService import PublicDonorByQrView
from ..services.workflowNotificationService import (
    WorkflowNotificationListView,
    WorkflowNotificationMarkReadView,
)

urlpatterns = [
    path('profile/', DonorProfileView.as_view(), name='donor-profile-dashboard'),
    path('dashboard/', DonorDashboardView.as_view(), name='donor-dashboard-stats'),
    path('donations/', DonorDonationHistoryView.as_view(), name='donor-donation-history'),
    path('alerts/', DonorAlertListView.as_view(), name='donor-alerts-list'),
    path('alerts/<int:pk>/read/', DonorAlertMarkReadView.as_view(), name='donor-alert-mark-read'),
    path('notifications/', WorkflowNotificationListView.as_view(), name='workflow-notifications-list'),
    path('notifications/<int:pk>/read/', WorkflowNotificationMarkReadView.as_view(), name='workflow-notification-mark-read'),
    path("public/<uuid:qr_id>/", PublicDonorByQrView.as_view(), name="public-donor-by-qr"),

    # Blood Camp Routes
    path('camps/upcoming/', UpcomingBloodCampsView.as_view(), name='upcoming-camps'),
    path('camps/public/latest/', LatestPublicBloodCampView.as_view(), name='public-latest-camp'),
    path('camps/', OrganizerBloodCampView.as_view(), name='organizer-camps'),
    path('camps/<int:pk>/register/', RegisterForCampView.as_view(), name='register-camp'),
    path('camps/<int:pk>/registrations/', CampRegistrationsView.as_view(), name='camp-registrations'),
    path('camps/registrations/screening/', ScreeningQueueView.as_view(), name='screening-queue'),
    path('camps/registrations/<int:pk>/arrive/', MarkArrivedCampRegistrationView.as_view(), name='arrive-camp-registration'),
    path('camps/registrations/<int:pk>/screening/', SendToScreeningCampRegistrationView.as_view(), name='screening-camp-registration'),
    path('camps/registrations/<int:pk>/approve/', ApproveCampRegistrationView.as_view(), name='approve-camp-registration'),
    path('camps/registrations/<int:pk>/reject/', RejectCampRegistrationView.as_view(), name='reject-camp-registration'),
path('camps/donated-history/', DonorAfterDonateView.as_view(), name='organizer-donated-history'),

    path('camps/registrations/<int:pk>/donate/', CompleteCampRegistrationView.as_view(), name='donate-camp-registration'),
    path('camps/registrations/<int:pk>/complete/', CompleteCampRegistrationView.as_view(), name='complete-camp-registration'),

    # Camp Blood Transfer Routes
    path('camps/<int:camp_id>/collections/', camp_collections_list, name='camp-collections-list'),
    path('camps/<int:camp_id>/collections/dispatch/', dispatch_camp_blood, name='dispatch-camp-blood'),
    path('camp-blood/pending/', pending_camp_blood_list, name='pending-camp-blood-list'),
    path('camp-blood/<int:collection_id>/receive/', receive_camp_blood, name='receive-camp-blood'),
    path('camp-blood/<int:collection_id>/verify/', verify_camp_blood, name='verify-camp-blood'),
]
