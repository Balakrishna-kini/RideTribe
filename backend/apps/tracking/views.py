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
        from apps.rides.models import Ride
        logger.info(f"📡 Tracking Update: User {request.user.id} -> Ride {ride_id}")
        
        # Check if user is a member OR the organizer
        try:
            ride = Ride.objects.get(id=ride_id)
            is_member = RideMember.objects.filter(ride=ride, user=request.user).exists()
            is_organizer = ride.organizer == request.user
            
            if not (is_member or is_organizer):
                logger.warning(f"⚠️ Access Denied: User {request.user.id} is not part of ride {ride_id}")
                return Response({'error': 'You are not part of this ride.'}, status=status.HTTP_403_FORBIDDEN)
        except Ride.DoesNotExist:
            return Response({'error': 'Ride not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        lat = request.data.get('latitude')
        lng = request.data.get('longitude')
        speed = request.data.get('speed', 0)
        
        if lat is None or lng is None:
            return Response({'error': 'latitude and longitude are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure we don't have duplicates before update_or_create to avoid MultipleObjectsReturned
        Location.objects.filter(ride_id=ride_id, rider=request.user).exclude(
            id=Location.objects.filter(ride_id=ride_id, rider=request.user).values_list('id', flat=True).first()
        ).delete()

        location, created = Location.objects.update_or_create(
            ride_id=ride_id,
            rider=request.user,
            defaults={
                'latitude': lat,
                'longitude': lng,
                'speed': speed
            }
        )
        
        # Force timestamp update since update_or_create doesn't trigger auto_now_add update
        from django.utils import timezone
        location.timestamp = timezone.now()
        location.save()
        
        logger.info(f"✅ Location Sync: {request.user.username} is at {lat}, {lng} (Created: {created})")
        return Response({'status': 'success', 'created': created}, status=status.HTTP_200_OK)


class RideLocationsView(generics.ListAPIView):
    """Get all rider locations for a ride (latest per rider, only active members)."""
    serializer_class = LocationSerializer

    def get_queryset(self):
        ride_id = self.kwargs['ride_id']
        logger.info(f"🔍 Fetching locations for ride {ride_id}")
        from django.db.models import Max
        from django.utils import timezone
        from datetime import timedelta
        
        # Only show locations updated in the last 2 MINUTES to avoid "ghost" riders
        cutoff = timezone.now() - timedelta(minutes=2)
        logger.info(f"⏱️ Cutoff time for active riders: {cutoff}")
        
        # Get ride members AND organizer
        try:
            from apps.rides.models import Ride
            ride = Ride.objects.get(id=ride_id)
            ride_member_ids = list(RideMember.objects.filter(ride=ride).values_list('user_id', flat=True))
            ride_member_ids.append(ride.organizer_id)
            logger.info(f"👥 Tracking IDs for Ride {ride_id}: {ride_member_ids}")
        except Ride.DoesNotExist:
            return Location.objects.none()
        
        latest_ids = (
            Location.objects
            .filter(ride_id=ride_id, timestamp__gte=cutoff, rider_id__in=ride_member_ids)
            .values('rider')
            .annotate(latest=Max('id'))
            .values_list('latest', flat=True)
        )
        locations = Location.objects.filter(id__in=latest_ids).select_related('rider', 'ride')
        logger.info(f"📍 Sync Status: Found {len(locations)} active riders out of {len(ride_member_ids)} possible.")
        return locations
