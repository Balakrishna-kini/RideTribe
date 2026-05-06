from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Ride, RideMember

User = get_user_model()


class RideMemberSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = RideMember
        fields = ['id', 'user_id', 'name', 'joined_at']


class RideSerializer(serializers.ModelSerializer):
    members = RideMemberSerializer(many=True, read_only=True)
    member_count = serializers.IntegerField(read_only=True)
    organizer_name = serializers.CharField(source='organizer.get_full_name', read_only=True)

    class Meta:
        model = Ride
        fields = [
            'id', 'title', 'description', 'start_location', 'end_location',
            'start_lat', 'start_lng', 'end_lat', 'end_lng',
            'date', 'time', 'distance', 'duration_min', 'max_members', 'status',
            'image', 'route_coords', 'organizer', 'organizer_name', 'member_count',
            'members', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'organizer', 'created_at', 'updated_at']


class RideCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ride
        fields = [
            'title', 'description', 'start_location', 'end_location',
            'start_lat', 'start_lng', 'end_lat', 'end_lng',
            'date', 'time', 'distance', 'duration_min', 'max_members', 'image', 'route_coords',
        ]
