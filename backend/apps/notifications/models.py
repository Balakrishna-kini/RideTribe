from django.db import models
from django.conf import settings


class Notification(models.Model):
    """User notification for ride updates and alerts."""
    NOTIFICATION_TYPES = [
        ('ride_join', 'Ride Join'),
        ('ride_update', 'Ride Update'),
        ('ride_leave', 'Ride Leave'),
        ('alert', 'Alert'),
        ('system', 'System'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='system')
    read = models.BooleanField(default=False)
    ride = models.ForeignKey('rides.Ride', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.notification_type}: {self.message[:50]}"
