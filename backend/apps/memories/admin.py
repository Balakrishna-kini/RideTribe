from django.contrib import admin
from .models import Memory

@admin.register(Memory)
class MemoryAdmin(admin.ModelAdmin):
    list_display = ['caption', 'user', 'ride', 'likes', 'created_at']
