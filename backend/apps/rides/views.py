from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from .models import Ride, RideMember
from .serializers import RideSerializer, RideCreateSerializer
import urllib.request
import urllib.parse
import json
import math


def haversine_km(lat1, lon1, lat2, lon2):
    """Straight-line distance between two lat/lng points in km."""
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 1)


class DistanceAPIView(APIView):
    """
    Calculate road distance and duration between two locations.
    Uses OpenRouteService Directions API if key is configured, otherwise falls back
    to Nominatim geocoding + Haversine estimation.
    GET /api/rides/distance/?origin=Bangalore&destination=Coorg
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        origin = request.query_params.get('origin', '').strip()
        destination = request.query_params.get('destination', '').strip()

        if not origin or not destination:
            return Response({'error': 'origin and destination are required'},
                            status=status.HTTP_400_BAD_REQUEST)

        api_key = getattr(settings, 'ORS_API_KEY', '')

        if not api_key:
            return Response({'error': 'ORS_API_KEY is not configured in backend.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        api_error = None
        try:
            # Helper to parse coordinates directly if provided as lat,lng
            def parse_coords(text):
                try:
                    parts = text.split(',')
                    if len(parts) == 2:
                        return float(parts[0]), float(parts[1])
                except ValueError:
                    pass
                return None, None

            src_lat, src_lng = parse_coords(origin)
            if src_lat is None:
                # 1. Geocode source
                src_url = f"https://api.openrouteservice.org/geocode/search?api_key={api_key}&text={urllib.parse.quote(origin)}"
                src_req = urllib.request.Request(src_url, headers={'User-Agent': 'RiderTribe/1.0'})
                with urllib.request.urlopen(src_req, timeout=5) as resp:
                    src_geo = json.loads(resp.read().decode('utf-8'))
                
                if not src_geo.get('features'):
                    raise Exception(f'Could not locate origin: {origin}')
                src_lng, src_lat = src_geo['features'][0]['geometry']['coordinates']

            dest_lat, dest_lng = parse_coords(destination)
            if dest_lat is None:
                # 2. Geocode destination
                dest_url = f"https://api.openrouteservice.org/geocode/search?api_key={api_key}&text={urllib.parse.quote(destination)}"
                dest_req = urllib.request.Request(dest_url, headers={'User-Agent': 'RiderTribe/1.0'})
                with urllib.request.urlopen(dest_req, timeout=5) as resp:
                    dest_geo = json.loads(resp.read().decode('utf-8'))
     
                if not dest_geo.get('features'):
                    raise Exception(f'Could not locate destination: {destination}')
                dest_lng, dest_lat = dest_geo['features'][0]['geometry']['coordinates']

            # 3. Directions API
            route_url = f"https://api.openrouteservice.org/v2/directions/driving-car?start={src_lng},{src_lat}&end={dest_lng},{dest_lat}&api_key={api_key}&geometry=true"
            route_req = urllib.request.Request(route_url, headers={'User-Agent': 'RiderTribe/1.0'})
            with urllib.request.urlopen(route_req, timeout=5) as resp:
                route_data = json.loads(resp.read().decode('utf-8'))

            summary = route_data['features'][0]['properties']['summary']
            distance_km = round(summary['distance'] / 1000, 1)
            duration_min = round(summary['duration'] / 60)
            route_coords = route_data['features'][0]['geometry']['coordinates']

            return Response({
                'distance_km': distance_km,
                'duration_min': duration_min,
                'source': 'ors',
                'coords': {'start': [src_lat, src_lng], 'end': [dest_lat, dest_lng]},
                'route_coords': route_coords
            })

        except Exception as e:
            api_error = str(e)
            
            # Fallback to Nominatim geocoding if ORS failed before getting coordinates
            if 'src_lat' not in locals() or 'src_lng' not in locals():
                try:
                    nom_src_url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(origin)}&format=json&limit=1"
                    nom_src_req = urllib.request.Request(nom_src_url, headers={'User-Agent': 'RiderTribe/1.0'})
                    with urllib.request.urlopen(nom_src_req, timeout=5) as resp:
                        src_geo = json.loads(resp.read().decode('utf-8'))
                    if src_geo:
                        src_lat, src_lng = float(src_geo[0]['lat']), float(src_geo[0]['lon'])
                except Exception:
                    pass
            
            if 'dest_lat' not in locals() or 'dest_lng' not in locals():
                try:
                    nom_dest_url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(destination)}&format=json&limit=1"
                    nom_dest_req = urllib.request.Request(nom_dest_url, headers={'User-Agent': 'RiderTribe/1.0'})
                    with urllib.request.urlopen(nom_dest_req, timeout=5) as resp:
                        dest_geo = json.loads(resp.read().decode('utf-8'))
                    if dest_geo:
                        dest_lat, dest_lng = float(dest_geo[0]['lat']), float(dest_geo[0]['lon'])
                except Exception:
                    pass

            # Fallback to Haversine if we have coordinates
            if 'src_lat' in locals() and 'dest_lat' in locals():
                straight_km = haversine_km(src_lat, src_lng, dest_lat, dest_lng)
                road_km = round(straight_km * 1.3, 1)
                return Response({
                    'distance_km': road_km,
                    'duration_min': round(road_km / 50 * 60),
                    'source': 'estimated',
                    'coords': {'start': [src_lat, src_lng], 'end': [dest_lat, dest_lng]},
                    'route_coords': [[src_lng, src_lat], [dest_lng, dest_lat]],
                    'api_error': api_error
                })
            return Response({'error': f'Routing failed: {api_error}. Also failed to fallback to Nominatim.'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)


class RideListCreateView(generics.ListCreateAPIView):
    """List all rides or create a new ride."""

    def get_queryset(self):
        qs = Ride.objects.all()
        status_filter = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(start_location__icontains=search) |
                Q(end_location__icontains=search)
            )
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return RideCreateSerializer
        return RideSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ride = serializer.save(organizer=self.request.user)
        # Auto-add organizer as member
        RideMember.objects.create(ride=ride, user=self.request.user)
        headers = self.get_success_headers(serializer.data)
        return Response(RideSerializer(ride).data, status=status.HTTP_201_CREATED, headers=headers)


class RideDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a ride. Only the organizer can delete."""
    queryset = Ride.objects.all()
    serializer_class = RideSerializer

    def destroy(self, request, *args, **kwargs):
        ride = self.get_object()
        if ride.organizer != request.user:
            return Response({'error': 'Only the ride organizer can delete this ride.'},
                            status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class JoinRideView(APIView):
    """Join a ride."""
    def post(self, request, pk):
        try:
            ride = Ride.objects.get(pk=pk)
        except Ride.DoesNotExist:
            return Response({'error': 'Ride not found'}, status=status.HTTP_404_NOT_FOUND)

        if ride.member_count >= ride.max_members:
            return Response({'error': 'Ride is full'}, status=status.HTTP_400_BAD_REQUEST)

        member, created = RideMember.objects.get_or_create(ride=ride, user=request.user)
        if not created:
            return Response({'error': 'Already a member'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'message': 'Joined successfully',
            'member_count': ride.member_count,
        }, status=status.HTTP_201_CREATED)


class LeaveRideView(APIView):
    """Leave a ride."""
    def post(self, request, pk):
        try:
            member = RideMember.objects.get(ride_id=pk, user=request.user)
            ride = member.ride
            member.delete()
            return Response({
                'message': 'Left ride successfully',
                'member_count': ride.member_count,
            })
        except RideMember.DoesNotExist:
            return Response({'error': 'Not a member'}, status=status.HTTP_400_BAD_REQUEST)
