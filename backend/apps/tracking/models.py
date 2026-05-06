from django.db import models
from django.conf import settings


class Location(models.Model):
    """Real-time location update for a rider during a ride."""
    ride = models.ForeignKey('rides.Ride', on_delete=models.CASCADE, related_name='locations')
    rider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='locations')
    latitude = models.FloatField()
    longitude = models.FloatField()
    speed = models.FloatField(null=True, blank=True, help_text='Speed in km/h')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.rider.username} @ {self.latitude},{self.longitude}"
