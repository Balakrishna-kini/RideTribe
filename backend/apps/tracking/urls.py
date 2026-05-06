from django.urls import path
from . import views

urlpatterns = [
    path('<int:ride_id>/', views.RideLocationsView.as_view(), name='ride-locations'),
    path('<int:ride_id>/update/', views.UpdateLocationView.as_view(), name='update-location'),
]
