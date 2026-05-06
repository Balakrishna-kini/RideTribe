from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Memory
from .serializers import MemorySerializer


class MemoryListCreateView(generics.ListCreateAPIView):
    """List memories (optionally filtered by ride) or upload a new one."""
    serializer_class = MemorySerializer

    def get_queryset(self):
        qs = Memory.objects.select_related('user', 'ride').all()
        ride_id = self.request.query_params.get('ride')
        if ride_id:
            qs = qs.filter(ride_id=ride_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MemoryDetailView(generics.RetrieveDestroyAPIView):
    """Get or delete a memory."""
    serializer_class = MemorySerializer
    queryset = Memory.objects.all()


class MemoryLikeView(APIView):
    """Toggle like on a memory."""
    def post(self, request, pk):
        try:
            memory = Memory.objects.get(pk=pk)
            memory.likes += 1
            memory.save(update_fields=['likes'])
            return Response({'likes': memory.likes})
        except Memory.DoesNotExist:
            return Response({'error': 'Memory not found'}, status=status.HTTP_404_NOT_FOUND)
