from rest_framework import serializers
from .models import Location


class LocationSerializer(serializers.ModelSerializer):
    rider_name = serializers.CharField(source='rider.get_full_name', read_only=True)
    is_organizer = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = ['id', 'ride', 'rider', 'rider_name', 'is_organizer', 'latitude', 'longitude', 'speed', 'timestamp']
        read_only_fields = ['id', 'rider', 'timestamp']

    def get_is_organizer(self, obj):
        return obj.ride.organizer_id == obj.rider_id
