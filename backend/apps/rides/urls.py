from django.urls import path
from . import views

urlpatterns = [
    path('', views.RideListCreateView.as_view(), name='ride-list'),
    path('distance/', views.DistanceAPIView.as_view(), name='ride-distance'),
    path('<int:pk>/', views.RideDetailView.as_view(), name='ride-detail'),
    path('<int:pk>/join/', views.JoinRideView.as_view(), name='ride-join'),
    path('<int:pk>/leave/', views.LeaveRideView.as_view(), name='ride-leave'),
]
