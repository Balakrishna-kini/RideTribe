from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    """List notifications for the current user."""
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class MarkReadView(APIView):
    """Mark a notification as read."""
    def patch(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, user=request.user)
            notif.read = True
            notif.save()
            return Response({'message': 'Marked as read'})
        except Notification.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class MarkAllReadView(APIView):
    """Mark all notifications as read for the current user."""
    def post(self, request):
        Notification.objects.filter(user=request.user, read=False).update(read=True)
        return Response({'message': 'All notifications marked as read'})
