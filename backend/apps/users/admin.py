from django.contrib import admin
from .models import CustomUser, Vehicle

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'location']
    search_fields = ['username', 'email', 'first_name']

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'vehicle_type', 'mileage']
