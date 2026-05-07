from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Location
from .serializers import LocationSerializer
from apps.rides.models import RideMember


class UpdateLocationView(APIView):
    """Update rider's current location during a ride."""
    def post(self, request, ride_id):
        # Check if user is a member of this ride first
        if not RideMember.objects.filter(ride_id=ride_id, user=request.user).exists():
            return Response({'error': 'You are not a member of this ride.'}, status=status.HTTP_403_FORBIDDEN)
            
        data = request.data.copy()
        data['ride'] = ride_id
        serializer = LocationSerializer(data=data)
        if serializer.is_valid():
            serializer.save(rider=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RideLocationsView(generics.ListAPIView):
    """Get all rider locations for a ride (latest per rider, only active members)."""
    serializer_class = LocationSerializer

    def get_queryset(self):
        ride_id = self.kwargs['ride_id']
        from django.db.models import Max
        from django.utils import timezone
        from datetime import timedelta
        
        # Only show locations updated in the last 2 minutes to avoid "ghost" riders
        cutoff = timezone.now() - timedelta(minutes=2)
        
        # Get only ride members' locations
        ride_member_ids = RideMember.objects.filter(ride_id=ride_id).values_list('user_id', flat=True)
        
        latest_ids = (
            Location.objects
            .filter(ride_id=ride_id, timestamp__gte=cutoff, rider_id__in=ride_member_ids)
            .values('rider')
            .annotate(latest=Max('id'))
            .values_list('latest', flat=True)
        )
        return Location.objects.filter(id__in=latest_ids).select_related('rider', 'ride')
