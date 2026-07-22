from django.shortcuts import get_object_or_404
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import ListAPIView, ListCreateAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models.bloodCamp import BloodCamp
from ..models.campBloodCollection import CampBloodCollection
from ..models.campRegistration import CampRegistration
from ..models.donationHistory import DonationHistory
from ..models.donorAlert import DonorAlert
from ..models.donorDetails import DonorDetails
from ..models.workflowNotification import WorkflowNotification
from ..serializers.bloodCampSerializer import (
    BloodCampSerializer,
    CampRegistrationSerializer,
)

ROLE_BLOOD_CAMP = "bloodcamp"
ROLE_DOCTOR = "doctor"
ROLE_ADMIN = "admin"
User = get_user_model()


class UpcomingBloodCampsView(ListAPIView):
    """
    GET /api/v1/camps/upcoming/
    Returns a list of upcoming blood camps. Accessible to all authenticated users (Donors).
    """
    permission_classes = [IsAuthenticated]
    serializer_class = BloodCampSerializer

    def get_queryset(self):
        return BloodCamp.objects.filter(status="Upcoming")


class LatestPublicBloodCampView(APIView):
    """
    GET /api/v1/camps/public/latest/
    Returns the latest upcoming blood camp for public users.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        latest_camp = (
            BloodCamp.objects.filter(status="Upcoming")
            .order_by("-created_at")
            .first()
        )
        if not latest_camp:
            return Response(None, status=status.HTTP_200_OK)
        serializer = BloodCampSerializer(latest_camp, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class OrganizerBloodCampView(ListCreateAPIView):
    """
    GET /api/v1/camps/
    POST /api/v1/camps/
    List or create blood camps. Only accessible to 'bloodcamp' role.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = BloodCampSerializer

    def get_queryset(self):
        if self.request.user.role != ROLE_BLOOD_CAMP:
            raise PermissionDenied("Only Camp Organizers can manage camps.")
        return BloodCamp.objects.filter(organizer=self.request.user)

    def perform_create(self, serializer):
        if self.request.user.role != ROLE_BLOOD_CAMP:
            raise PermissionDenied("Only Camp Organizers can create camps.")
        serializer.save(organizer=self.request.user)


class RegisterForCampView(APIView):
    """
    POST /api/v1/camps/<id>/register/
    Allows a Donor to request to donate at a specific camp.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != "donor":
            raise PermissionDenied("Only donors can register for camps.")

        camp = get_object_or_404(BloodCamp, pk=pk)
        donor, _ = DonorDetails.objects.get_or_create(user=request.user)

        # Check if already registered
        if CampRegistration.objects.filter(donor=donor, camp=camp).exists():
            return Response({"detail": "Already registered for this camp."}, status=status.HTTP_400_BAD_REQUEST)

        registration = CampRegistration.objects.create(donor=donor, camp=camp)
        _notify_users(
            users=[camp.organizer],
            event_type="donor_registered",
            message=f"New donor registered for {camp.title}.",
            metadata={"registration_id": registration.id, "camp_id": camp.id},
        )
        return Response(
            CampRegistrationSerializer(registration, context={"request": request}).data,
            status=status.HTTP_201_CREATED
        )


class CampRegistrationsView(ListAPIView):
    """
    GET /api/v1/camps/<id>/registrations/
    Allows Camp Organizers to view registrations for a specific camp they organize.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = CampRegistrationSerializer

    def get_queryset(self):
        if self.request.user.role != ROLE_BLOOD_CAMP:
            raise PermissionDenied("Only Camp Organizers can view registrations.")

        camp_id = self.kwargs.get("pk")
        camp = get_object_or_404(BloodCamp, pk=camp_id, organizer=self.request.user)
        return CampRegistration.objects.filter(camp=camp)


class ScreeningQueueView(ListAPIView):
    """
    GET /api/v1/donor/camps/registrations/screening/
    Returns donors currently waiting in the doctor screening queue.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = CampRegistrationSerializer

    def get_queryset(self):
        if self.request.user.role not in {ROLE_DOCTOR, ROLE_ADMIN}:
            raise PermissionDenied("Only doctors can view screening queue.")

        queryset = CampRegistration.objects.filter(status="screening").select_related("donor__user", "camp")
        camp_id = self.request.query_params.get("camp_id")
        if camp_id:
            queryset = queryset.filter(camp_id=camp_id)
        return queryset


def _invalid_transition_response(current_status, expected_states):
    states = ", ".join(expected_states)
    return Response(
        {
            "detail": (
                f"Invalid status transition from '{current_status}'. "
                f"Allowed current status: {states}."
            )
        },
        status=status.HTTP_400_BAD_REQUEST,
    )


def _get_staff_registration(user, pk):
    if user.role == ROLE_ADMIN:
        return get_object_or_404(CampRegistration, pk=pk)
    return get_object_or_404(CampRegistration, pk=pk, camp__organizer=user)


def _notify_users(users, event_type, message, metadata=None):
    notifications = [
        WorkflowNotification(
            user=user,
            event_type=event_type,
            message=message,
            metadata=metadata or {},
        )
        for user in users
    ]
    if notifications:
        WorkflowNotification.objects.bulk_create(notifications)


class MarkArrivedCampRegistrationView(APIView):
    """
    POST /api/v1/donor/camps/registrations/<id>/arrive/
    Mark a registered donor as arrived at camp.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role not in {ROLE_BLOOD_CAMP, ROLE_ADMIN}:
            raise PermissionDenied("Only blood camp staff can mark donor arrival.")

        registration = _get_staff_registration(request.user, pk)
        if registration.status != "registered":
            return _invalid_transition_response(registration.status, ["registered"])

        registration.status = "arrived"
        registration.arrived_at = timezone.now()
        registration.save(update_fields=["status", "arrived_at"])
        _notify_users(
            users=list(User.objects.filter(role=ROLE_DOCTOR, is_active=True)),
            event_type="donor_arrived",
            message=f"{registration.donor.user.username} arrived at {registration.camp.title}.",
            metadata={"registration_id": registration.id, "camp_id": registration.camp_id},
        )
        return Response({"detail": "Donor marked as arrived."}, status=status.HTTP_200_OK)


class SendToScreeningCampRegistrationView(APIView):
    """
    POST /api/v1/donor/camps/registrations/<id>/screening/
    Move arrived donor to doctor screening queue.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role not in {ROLE_BLOOD_CAMP, ROLE_ADMIN}:
            raise PermissionDenied("Only blood camp staff can send donor to screening.")

        registration = _get_staff_registration(request.user, pk)
        if registration.status != "arrived":
            return _invalid_transition_response(registration.status, ["arrived"])

        registration.status = "screening"
        registration.save(update_fields=["status"])
        _notify_users(
            users=list(User.objects.filter(role=ROLE_DOCTOR, is_active=True)),
            event_type="donor_screening",
            message=f"Donor {registration.donor.user.username} is waiting for screening.",
            metadata={"registration_id": registration.id, "camp_id": registration.camp_id},
        )
        return Response({"detail": "Donor moved to doctor screening queue."}, status=status.HTTP_200_OK)


class ApproveCampRegistrationView(APIView):
    """
    POST /api/v1/camps/registrations/<id>/approve/
    Allows doctors to approve a donor after screening.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role not in {ROLE_DOCTOR, ROLE_ADMIN}:
            raise PermissionDenied("Only doctors can approve donor screening.")

        registration = get_object_or_404(CampRegistration, pk=pk)
        if registration.status != "screening":
            return _invalid_transition_response(registration.status, ["screening"])

        registration.status = "approved"
        registration.screened_at = timezone.now()
        registration.screened_by = request.user
        registration.rejection_reason = ""
        registration.save(update_fields=["status", "screened_at", "screened_by", "rejection_reason"])

        DonorAlert.objects.create(
            donor=registration.donor,
            message=(
                f"You are approved to donate at '{registration.camp.title}'. "
                "Please proceed to blood collection."
            ),
            alert_type="camp"
        )
        _notify_users(
            users=[registration.camp.organizer],
            event_type="donor_approved",
            message=f"Donor {registration.donor.user.username} approved and ready for collection.",
            metadata={"registration_id": registration.id, "camp_id": registration.camp_id},
        )
        return Response({"detail": "Donor approved for collection."}, status=status.HTTP_200_OK)


class RejectCampRegistrationView(APIView):
    """
    POST /api/v1/camps/registrations/<id>/reject/
    Payload: {"reason": "Hb below threshold"}
    Allows doctors to reject a donor after screening.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role not in {ROLE_DOCTOR, ROLE_ADMIN}:
            raise PermissionDenied("Only doctors can reject donor screening.")

        reason = (request.data.get("reason") or "").strip()
        if not reason:
            return Response({"detail": "Rejection reason is required."}, status=status.HTTP_400_BAD_REQUEST)

        registration = get_object_or_404(CampRegistration, pk=pk)
        if registration.status != "screening":
            return _invalid_transition_response(registration.status, ["screening"])

        registration.status = "rejected"
        registration.screened_at = timezone.now()
        registration.screened_by = request.user
        registration.rejection_reason = reason
        registration.save(update_fields=["status", "screened_at", "screened_by", "rejection_reason"])

        DonorAlert.objects.create(
            donor=registration.donor,
            message=(
                f"Your donor screening at '{registration.camp.title}' was rejected. "
                f"Reason: {reason}"
            ),
            alert_type="camp"
        )
        _notify_users(
            users=[registration.camp.organizer],
            event_type="donor_rejected",
            message=f"Donor {registration.donor.user.username} rejected. Reason: {reason}",
            metadata={"registration_id": registration.id, "camp_id": registration.camp_id},
        )
        return Response({"detail": "Donor rejected with reason."}, status=status.HTTP_200_OK)


class CompleteCampRegistrationView(APIView):
    """
    POST /api/v1/camps/registrations/<id>/donate/
    Allows blood camp staff to mark an approved donor as donated.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role not in {ROLE_BLOOD_CAMP, ROLE_ADMIN}:
            raise PermissionDenied("Only blood camp staff can complete donation collection.")

        registration = _get_staff_registration(request.user, pk)

        if registration.status != "approved":
            return _invalid_transition_response(registration.status, ["approved"])

        now = timezone.now()

        with transaction.atomic():
            registration.status = "donated"
            registration.collected_at = now
            registration.collected_by = request.user
            registration.save(update_fields=["status", "collected_at", "collected_by"])

            donor = registration.donor
            donor.total_donations += 1
            donor.last_donation_date = now.date()
            donor.save(update_fields=["total_donations", "last_donation_date"])

            DonationHistory.objects.create(
                donor=donor,
                hospital_name=registration.camp.title,
                blood_group=getattr(
                    donor.user,
                    "blood_group",
                    getattr(getattr(donor.user, "profile", None), "blood_group", "Unknown"),
                )
                or "Unknown",
                units=1,
                status="completed",
                donation_date=now.date(),
                notes=f"Donated at {registration.camp.title} ({registration.camp.location})",
            )

            DonorAlert.objects.create(
                donor=donor,
                message=f"Thank you for donating blood at {registration.camp.title}! Your contribution saves lives.",
                alert_type="eligibility",
            )
            # NEW: Auto-create CampBloodCollection for camp→hospital tracking
            blood_group = getattr(
                getattr(donor.user, "profile", None),
                "blood_group",
                "Unknown",
            ) or "Unknown"

            CampBloodCollection.objects.create(
                camp=registration.camp,
                registration=registration,
                donor=donor,
                blood_type=blood_group,
                units=1,
                destination_hospital=registration.camp.destination_hospital,
                status="collected",
            )

            _notify_users(
                users=list(User.objects.filter(role=ROLE_ADMIN, is_active=True)),
                event_type="donor_donated",
                message=f"Donation completed at {registration.camp.title}. Blood collected and ready for dispatch.",
                metadata={"registration_id": registration.id, "camp_id": registration.camp_id},
            )

        return Response({"detail": "Donor marked as donated and blood collection recorded."}, status=status.HTTP_200_OK)


class DonorAfterDonateView(APIView):
    """
    GET /api/v1/donor/camps/donated-history/
    Returns all completed (donated) registrations across the organizer's camps.
    Only accessible to 'bloodcamp' organizers and admins.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in {ROLE_BLOOD_CAMP, ROLE_ADMIN}:
            raise PermissionDenied("Only camp organizers can view donated history.")

        # Get all donated registrations for camps owned by this organizer
        registrations = CampRegistration.objects.filter(
            status="donated",
            camp__organizer=request.user,
        ).select_related("donor__user", "camp").order_by("-collected_at")

        data = []
        for reg in registrations:
            # Safely get blood group from profile
            blood_group = getattr(
                getattr(reg.donor.user, "profile", None),
                "blood_group",
                "Unknown",
            ) or "Unknown"

            data.append({
                "id": reg.id,
                "donor_name": reg.donor.user.username,
                "blood_group": blood_group,
                "camp_title": reg.camp.title,
                "camp_location": reg.camp.location,
                "donated_at": reg.collected_at,
                "status": reg.status,
            })

        return Response(data, status=status.HTTP_200_OK)
