from rest_framework import serializers
from .models import Location


class LocationSerializer(serializers.ModelSerializer):
    rider_name = serializers.CharField(source='rider.get_full_name', read_only=True)

    class Meta:
        model = Location
        fields = ['id', 'ride', 'rider', 'rider_name', 'latitude', 'longitude', 'speed', 'timestamp']
        read_only_fields = ['id', 'rider', 'timestamp']
