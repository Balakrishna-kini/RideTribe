from django.db import models
from django.conf import settings


class Ride(models.Model):
    """A group ride event."""
    STATUS_CHOICES = [
        ('upcoming', 'Upcoming'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_location = models.CharField(max_length=200)
    end_location = models.CharField(max_length=200)
    start_lat = models.FloatField(null=True, blank=True)
    start_lng = models.FloatField(null=True, blank=True)
    end_lat = models.FloatField(null=True, blank=True)
    end_lng = models.FloatField(null=True, blank=True)
    date = models.DateField()
    time = models.TimeField(null=True, blank=True)
    distance = models.FloatField(null=True, blank=True, help_text='Distance in km')
    duration_min = models.IntegerField(null=True, blank=True, help_text='Estimated drive time in minutes')
    max_members = models.IntegerField(default=10)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    image = models.ImageField(upload_to='rides/', blank=True, null=True)
    route_coords = models.JSONField(null=True, blank=True, help_text='JSON array of [lon, lat] coordinates')
    organizer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='organized_rides')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return self.title

    @property
    def member_count(self):
        return self.members.count()


class RideMember(models.Model):
    """Track which users have joined a ride."""
    ride = models.ForeignKey(Ride, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='joined_rides')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['ride', 'user']

    def __str__(self):
        return f"{self.user.username} → {self.ride.title}"
