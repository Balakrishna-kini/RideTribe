from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    """Extended user model with rider-specific fields."""
    phone = models.CharField(max_length=20, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    location = models.CharField(max_length=200, blank=True)
    riding_style = models.CharField(max_length=100, blank=True)
    favorite_bike = models.CharField(max_length=200, blank=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.get_full_name() or self.username


class Vehicle(models.Model):
    """User's vehicle (motorcycle, scooter, etc.)."""
    VEHICLE_TYPES = [
        ('motorcycle', 'Motorcycle'),
        ('scooter', 'Scooter'),
        ('car', 'Car'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='vehicles')
    name = models.CharField(max_length=200)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPES, default='motorcycle')
    mileage = models.FloatField(help_text='km per litre')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.user.username})"
