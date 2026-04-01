from datetime import timedelta

from django.db.models import Q, Count, Case, When, IntegerField
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from config.permissions import IsOwnerOrReadOnly
from .filters import TaskFilter
from .models import Task
from .serializers import TaskSerializer, ShareTaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrReadOnly)
    filterset_class = TaskFilter
    ordering_fields = ['created_at', 'due_date', 'title', 'priority', 'position']
    ordering = ['position', '-created_at']
    search_fields = ['title', 'description']

    def get_queryset(self):
        user = self.request.user
        return Task.objects.filter(
            Q(owner=user) | Q(shared_with=user)
        ).distinct().select_related('category', 'owner').prefetch_related('shared_with')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'], url_path='share')
    def share(self, request, pk=None):
        task = self.get_object()
        if task.owner != request.user:
            return Response(
                {'detail': 'Apenas o proprietário pode compartilhar esta tarefa.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = ShareTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target_user = serializer.target_user
        if target_user == request.user:
            return Response(
                {'detail': 'Você não pode compartilhar uma tarefa consigo mesmo.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        task.shared_with.add(target_user)
        return Response(
            {'detail': f'Tarefa compartilhada com {target_user.email}.'},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'], url_path='toggle')
    def toggle_complete(self, request, pk=None):
        task = self.get_object()
        task.status = 'todo' if task.status == 'done' else 'done'
        task.save(update_fields=['status', 'completed', 'updated_at'])
        return Response(self.get_serializer(task).data)

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        qs = self.get_queryset()
        today = timezone.now().date()

        # Counts by status
        by_status = dict(qs.values_list('status').annotate(c=Count('id')).values_list('status', 'c'))
        for key in ['todo', 'in_progress', 'review', 'done']:
            by_status.setdefault(key, 0)

        # Counts by priority
        by_priority = dict(qs.values_list('priority').annotate(c=Count('id')).values_list('priority', 'c'))
        for key in ['urgent', 'high', 'medium', 'low']:
            by_priority.setdefault(key, 0)

        # Counts by category
        by_category = list(
            qs.filter(category__isnull=False)
            .values('category__id', 'category__name', 'category__color')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        # Overdue tasks
        overdue = list(
            qs.filter(due_date__lt=today, completed=False)
            .order_by('due_date')
            .values('id', 'title', 'due_date', 'priority', 'status')[:10]
        )

        # Upcoming deadlines (next 7 days)
        upcoming = list(
            qs.filter(due_date__gte=today, due_date__lte=today + timedelta(days=7), completed=False)
            .order_by('due_date')
            .values('id', 'title', 'due_date', 'priority', 'status')[:10]
        )

        # Weekly trend (last 8 weeks): created vs completed
        weekly_trend = []
        for i in range(7, -1, -1):
            week_start = today - timedelta(days=today.weekday()) - timedelta(weeks=i)
            week_end = week_start + timedelta(days=6)
            created = qs.filter(created_at__date__gte=week_start, created_at__date__lte=week_end).count()
            completed = qs.filter(
                status='done', updated_at__date__gte=week_start, updated_at__date__lte=week_end
            ).count()
            weekly_trend.append({
                'week': week_start.strftime('%d/%m'),
                'created': created,
                'completed': completed,
            })

        total = qs.count()
        done = by_status.get('done', 0)

        return Response({
            'total': total,
            'completed': done,
            'active': total - done,
            'overdue_count': len(overdue),
            'completion_rate': round((done / total) * 100, 1) if total > 0 else 0,
            'by_status': by_status,
            'by_priority': by_priority,
            'by_category': by_category,
            'overdue': overdue,
            'upcoming': upcoming,
            'weekly_trend': weekly_trend,
        })

    @action(detail=True, methods=['patch'], url_path='move')
    def move(self, request, pk=None):
        task = self.get_object()
        new_status = request.data.get('status')
        new_position = request.data.get('position')

        valid_statuses = [c[0] for c in Task.STATUS_CHOICES]
        if new_status and new_status not in valid_statuses:
            return Response(
                {'detail': 'Status inválido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_status:
            task.status = new_status
        if new_position is not None:
            task.position = int(new_position)

        task.save(update_fields=['status', 'completed', 'position', 'updated_at'])
        return Response(self.get_serializer(task).data)
