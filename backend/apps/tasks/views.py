import requests
from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response

from .filters import TaskFilter
from .models import Task
from .serializers import TaskSerializer, ShareTaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = (permissions.IsAuthenticated,)
    filterset_class = TaskFilter
    ordering_fields = ['created_at', 'due_date', 'title']
    ordering = ['-created_at']
    search_fields = ['title', 'description']

    def get_queryset(self):
        user = self.request.user
        return Task.objects.filter(
            Q(owner=user) | Q(shared_with=user)
        ).distinct().select_related('category', 'owner').prefetch_related('shared_with')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def get_object(self):
        obj = super().get_object()
        if obj.owner != self.request.user and self.request.user not in obj.shared_with.all():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not have permission to access this task.')
        return obj

    def update(self, request, *args, **kwargs):
        obj = self.get_object()
        if obj.owner != request.user:
            return Response(
                {'detail': 'Only the owner can edit this task.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        if obj.owner != request.user:
            return Response(
                {'detail': 'Only the owner can delete this task.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='share')
    def share(self, request, pk=None):
        task = self.get_object()
        if task.owner != request.user:
            return Response(
                {'detail': 'Only the owner can share this task.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = ShareTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target_user = serializer.target_user
        if target_user == request.user:
            return Response(
                {'detail': 'You cannot share a task with yourself.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        task.shared_with.add(target_user)
        return Response(
            {'detail': f'Task shared with {target_user.email}.'},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'], url_path='toggle')
    def toggle_complete(self, request, pk=None):
        task = self.get_object()
        task.completed = not task.completed
        task.save(update_fields=['completed', 'updated_at'])
        serializer = self.get_serializer(task)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def random_joke(request):
    try:
        response = requests.get(
            'https://official-joke-api.appspot.com/random_joke',
            timeout=5
        )
        response.raise_for_status()
        data = response.json()
        return Response({
            'setup': data.get('setup'),
            'punchline': data.get('punchline'),
            'type': data.get('type'),
        })
    except requests.RequestException as exc:
        return Response(
            {'detail': 'Could not fetch joke from external API.', 'error': str(exc)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
