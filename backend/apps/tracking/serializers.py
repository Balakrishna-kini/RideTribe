from rest_framework import serializers
from .models import Location


class LocationSerializer(serializers.ModelSerializer):
    rider_name = serializers.SerializerMethodField()
    is_organizer = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = ['id', 'ride', 'rider', 'rider_name', 'is_organizer', 'latitude', 'longitude', 'speed', 'timestamp']
        read_only_fields = ['id', 'rider', 'timestamp']

    def get_rider_name(self, obj):
        full_name = obj.rider.get_full_name()
        if full_name:
            return full_name
        return obj.rider.username

    def get_is_organizer(self, obj):
        return obj.ride.organizer_id == obj.rider_id
