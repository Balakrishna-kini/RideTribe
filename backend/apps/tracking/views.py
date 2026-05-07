from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Location
from .serializers import LocationSerializer
from apps.rides.models import RideMember
import logging

logger = logging.getLogger(__name__)


class UpdateLocationView(APIView):
    """Update rider's current location during a ride."""
    def post(self, request, ride_id):
        logger.info(f"📡 Received tracking update from user {request.user.id} for ride {ride_id}")
        # Check if user is a member of this ride first
        if not RideMember.objects.filter(ride_id=ride_id, user=request.user).exists():
            logger.warning(f"⚠️ User {request.user.id} is not a member of ride {ride_id}")
            return Response({'error': 'You are not a member of this ride.'}, status=status.HTTP_403_FORBIDDEN)
            
        # Delete old location entries for this user and ride
        deleted, _ = Location.objects.filter(ride_id=ride_id, rider=request.user).delete()
        if deleted > 0:
            logger.info(f"🗑️ Deleted {deleted} old location entries for user {request.user.id}")
            
        data = request.data.copy()
        data['ride'] = ride_id
        serializer = LocationSerializer(data=data)
        if serializer.is_valid():
            location = serializer.save(rider=request.user)
            logger.info(f"✅ Saved location for user {request.user.id}: {location.latitude}, {location.longitude}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"❌ Invalid location data: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RideLocationsView(generics.ListAPIView):
    """Get all rider locations for a ride (latest per rider, only active members)."""
    serializer_class = LocationSerializer

    def get_queryset(self):
        ride_id = self.kwargs['ride_id']
        logger.info(f"🔍 Fetching locations for ride {ride_id}")
        from django.db.models import Max
        from django.utils import timezone
        from datetime import timedelta
        
        # Only show locations updated in the last 30 SECONDS to avoid "ghost" riders
        cutoff = timezone.now() - timedelta(seconds=30)
        logger.info(f"⏱️ Cutoff time for active riders: {cutoff}")
        
        # Get only ride members' locations
        ride_member_ids = RideMember.objects.filter(ride_id=ride_id).values_list('user_id', flat=True)
        logger.info(f"👥 Ride {ride_id} has {len(ride_member_ids)} members")
        
        latest_ids = (
            Location.objects
            .filter(ride_id=ride_id, timestamp__gte=cutoff, rider_id__in=ride_member_ids)
            .values('rider')
            .annotate(latest=Max('id'))
            .values_list('latest', flat=True)
        )
        locations = Location.objects.filter(id__in=latest_ids).select_related('rider', 'ride')
        logger.info(f"📍 Found {len(locations)} active riders for ride {ride_id}: {[loc.rider.get_full_name() for loc in locations]}")
        return locations
