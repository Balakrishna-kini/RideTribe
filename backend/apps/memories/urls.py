from django.urls import path
from . import views

urlpatterns = [
    path('', views.MemoryListCreateView.as_view(), name='memory-list'),
    path('<int:pk>/', views.MemoryDetailView.as_view(), name='memory-detail'),
    path('<int:pk>/like/', views.MemoryLikeView.as_view(), name='memory-like'),
]
