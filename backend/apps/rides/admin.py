from django.contrib import admin
from .models import Ride, RideMember

@admin.register(Ride)
class RideAdmin(admin.ModelAdmin):
    list_display = ['title', 'organizer', 'date', 'status', 'member_count']
    list_filter = ['status', 'date']
    search_fields = ['title', 'start_location', 'end_location']

@admin.register(RideMember)
class RideMemberAdmin(admin.ModelAdmin):
    list_display = ['ride', 'user', 'joined_at']
