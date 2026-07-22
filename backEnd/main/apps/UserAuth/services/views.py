from decimal import Decimal, InvalidOperation

from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from ..models import Profile
from ..models.hospital import Hospital
from ..serializer.payload.payload import MyTokenObtainPairSerializer
from ..serializer.request.register import RegisterSerializer
from ..serializer.response.serializer import ProfileSerializer, UserSerializer, HospitalSerializer

User = get_user_model()


def _parse_place_id(value):
    try:
        return int(value), None
    except (TypeError, ValueError):
        return None, Response({"error": "place_id must be a valid integer"}, status=400)


def _parse_decimal(value, field_name):
    if value is None or value == "":
        return None, None
    try:
        return Decimal(str(value)), None
    except (InvalidOperation, ValueError):
        return None, Response(
            {"error": f"{field_name} must be a valid number"},
            status=400,
        )


def _update_hospital_if_changed(hospital, latitude, longitude, address):
    changed = False

    if latitude is not None and hospital.latitude != latitude:
        hospital.latitude = latitude
        changed = True
    if longitude is not None and hospital.longitude != longitude:
        hospital.longitude = longitude
        changed = True
    if address and hospital.address != address:
        hospital.address = address
        changed = True

    if changed:
        hospital.save()


class MyTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT Token view that returns user data along with tokens
    """

    serializer_class = MyTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):

    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens for the newly registered user
        refresh = RefreshToken.for_user(user)

        if user.role not in ["donor", "bloodcamp"]:
            return Response(
                {
                    "error":"invalid "
                },status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role,
                },
                "message": "User registered successfully",
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            },
            status=status.HTTP_201_CREATED,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """
    Get current authenticated user's profile
    GET /api/auth/profile/
    """
    user = request.user
    try:
        profile = user.profile
        user_data = UserSerializer(user).data
        profile_data = ProfileSerializer(profile).data

        return Response(
            {"user": user_data, "profile": profile_data}, status=status.HTTP_200_OK
        )
    except Profile.DoesNotExist:
        return Response(
            {"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    user = request.user
    try:
        profile = user.profile
        serializer = ProfileSerializer(profile, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Profile updated successfully", "profile": serializer.data},
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Profile.DoesNotExist:
        return Response(
            {"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):

    refresh_token = request.data.get("refresh")

    if not refresh_token:
        return Response({"error": "Refresh token required"}, status=400)

    try:
        token = RefreshToken(refresh_token)
        token.blacklist()

        return Response({"message": "Logout successful"})

    except Exception:
        return Response({"error": "Invalid token"}, status=400)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    """
    Get basic user information
    GET /api/auth/user/
    """
    user = request.user
    serializer = UserSerializer(user)

    return Response(
        {"user": serializer.data, "message": "User data retrieved successfully"},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def resolve_hospital(request):
    placeId = request.data.get("placeId") or request.data.get("place_id")
    name = request.data.get("name")
    lat = request.data.get("lat")
    lon = request.data.get("lon")
    address = request.data.get("address", "")

    if not placeId or not name:
        return Response({"error": "place_id and name are required"}, status=400)

    placeId, error = _parse_place_id(placeId)
    if error:
        return error

    latitude, error = _parse_decimal(lat, "lat")
    if error:
        return error

    longitude, error = _parse_decimal(lon, "lon")
    if error:
        return error

    hospital, created = Hospital.objects.get_or_create(
        osm_place_id=placeId,
        defaults={
            "hosName": name[:30],
            "latitude": latitude,
            "longitude": longitude,
            "address": address,
        },
    )

    if not created:
        _update_hospital_if_changed(hospital, latitude, longitude, address)

    return Response({"id": hospital.id, "name": hospital.hosName}, status=200)


class HospitalManagementView(generics.ListCreateAPIView):
    """
    GET /api/v1/auth/hospitals/
    POST /api/v1/auth/hospitals/
    Allow Admins to list and create hospitals manually.
    """
    queryset = Hospital.objects.all().order_by('-id')
    serializer_class = HospitalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Allow all authenticated users to GET (so organizers can see the list in dropdowns)
        # But if you want it strict to Admin for GET, check here.
        return super().get_queryset()

    def perform_create(self, serializer):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only System Administrators can register hospitals manually.")
        serializer.save()

