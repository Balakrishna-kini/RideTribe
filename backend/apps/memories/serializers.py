from rest_framework import serializers
from .models import Memory


class MemorySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = Memory
        fields = ['id', 'ride', 'user', 'user_name', 'image', 'caption', 'likes', 'created_at']
        read_only_fields = ['id', 'user', 'likes', 'created_at']
