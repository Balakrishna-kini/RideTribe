from django.db import models
from django.conf import settings


class Memory(models.Model):
    """Photo memory from a ride."""
    ride = models.ForeignKey('rides.Ride', on_delete=models.CASCADE, related_name='memories', null=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='memories')
    image = models.ImageField(upload_to='memories/')
    caption = models.CharField(max_length=500, blank=True)
    likes = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Memories'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.caption[:30]} by {self.user.username}"
