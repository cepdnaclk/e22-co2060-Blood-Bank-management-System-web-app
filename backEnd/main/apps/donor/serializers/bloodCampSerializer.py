from rest_framework import serializers

from ..models.bloodCamp import BloodCamp
from ..models.campRegistration import CampRegistration


class BloodCampSerializer(serializers.ModelSerializer):
    """Serializer for Blood Camps. Read-only for donors, read-write for organizers."""

    organizer_name = serializers.CharField(source="organizer.username", read_only=True)
    destination_hospital_name = serializers.CharField(source="destination_hospital.hosName", read_only=True, default=None)

    class Meta:
        model = BloodCamp
        fields = [
            "id",
            "organizer_name",
            "title",
            "date",
            "start_time",
            "end_time",
            "location",
            "description",
            "status",
            "destination_hospital",
            "destination_hospital_name",
            "total_collected_units",
            "created_at",
        ]
        read_only_fields = ["id", "organizer", "organizer_name", "destination_hospital_name", "total_collected_units", "created_at"]


class CampRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for Camp Registrations. Read-only for donors, read-write (status/time) for organizers."""

    donor_name = serializers.SerializerMethodField()
    donor_blood_group = serializers.SerializerMethodField()
    donor_phone = serializers.SerializerMethodField()
    camp_title = serializers.CharField(source="camp.title", read_only=True)

    class Meta:
        model = CampRegistration
        fields = [
            "id",
            "donor",
            "donor_name",
            "donor_blood_group",
            "donor_phone",
            "camp",
            "camp_title",
            "status",
            "appointment_time",
            "arrived_at",
            "screened_at",
            "screened_by",
            "rejection_reason",
            "collected_at",
            "collected_by",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "donor",
            "camp",
            "arrived_at",
            "screened_at",
            "screened_by",
            "rejection_reason",
            "collected_at",
            "collected_by",
            "created_at",
        ]

    def _profile(self, obj):
        return getattr(obj.donor.user, "profile", None)

    def get_donor_name(self, obj):
        profile = self._profile(obj)
        return getattr(profile, "fullName", obj.donor.user.username)

    def get_donor_blood_group(self, obj):
        profile = self._profile(obj)
        return getattr(profile, "blood_group", None)

    def get_donor_phone(self, obj):
        profile = self._profile(obj)
        val = getattr(profile, "phoneNumber", None)
        return str(val) if val else None
