import csv
from datetime import timedelta
from io import StringIO

from django.db.models import Q, Count, Sum
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, permissions, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response

from config.permissions import IsOwnerOrReadOnly
from .filters import TaskFilter
from .models import Task, SubTask, Comment, ActivityLog, TimeEntry, TaskTemplate
from .serializers import (
    TaskSerializer, ShareTaskSerializer, SubTaskSerializer,
    CommentSerializer, ActivityLogSerializer, TimeEntrySerializer,
    TaskTemplateSerializer,
)


def log_activity(user, action_type, description, task=None):
    ActivityLog.objects.create(
        user=user,
        action=action_type,
        description=description,
        task=task,
        task_title=task.title if task else '',
    )


def award_xp(user, points, reason_task=None):
    from apps.users.models import GameProfile, Badge, UserBadge, Notification
    profile, _ = GameProfile.objects.get_or_create(user=user)
    profile.xp += points

    old_level = profile.level
    while profile.xp >= sum(i * 100 for i in range(1, profile.level + 1)):
        profile.level += 1

    today = timezone.now().date()
    if reason_task:
        profile.tasks_completed_total += 1
        if profile.last_completed_date == today - timedelta(days=1) or profile.last_completed_date == today:
            if profile.last_completed_date != today:
                profile.streak_current += 1
        else:
            profile.streak_current = 1
        profile.last_completed_date = today
        if profile.streak_current > profile.streak_best:
            profile.streak_best = profile.streak_current

    profile.save()

    if old_level < profile.level:
        Notification.objects.create(
            user=user,
            notification_type='badge',
            title='Level Up!',
            message=f'Parabéns! Você alcançou o nível {profile.level}!',
        )

    badge_checks = {
        'first_task': profile.tasks_completed_total >= 1,
        'tasks_10': profile.tasks_completed_total >= 10,
        'tasks_50': profile.tasks_completed_total >= 50,
        'tasks_100': profile.tasks_completed_total >= 100,
        'streak_3': profile.streak_current >= 3,
        'streak_7': profile.streak_current >= 7,
        'streak_30': profile.streak_current >= 30,
    }
    for badge_type, earned in badge_checks.items():
        if earned:
            badge = Badge.objects.filter(badge_type=badge_type).first()
            if badge and not UserBadge.objects.filter(user=user, badge=badge).exists():
                UserBadge.objects.create(user=user, badge=badge)
                Notification.objects.create(
                    user=user,
                    notification_type='badge',
                    title='Nova Conquista!',
                    message=f'Você desbloqueou: {badge.name}!',
                )


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
        ).distinct().select_related('category', 'owner').prefetch_related('shared_with', 'subtasks')

    def perform_create(self, serializer):
        task = serializer.save(owner=self.request.user)
        log_activity(self.request.user, 'created', f'Criou a tarefa "{task.title}"', task)

    def perform_update(self, serializer):
        task = serializer.save()
        log_activity(self.request.user, 'updated', f'Atualizou a tarefa "{task.title}"', task)

    def perform_destroy(self, instance):
        log_activity(self.request.user, 'deleted', f'Excluiu a tarefa "{instance.title}"')
        instance.delete()

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
        log_activity(request.user, 'shared', f'Compartilhou "{task.title}" com {target_user.email}', task)
        from apps.users.models import Notification
        Notification.objects.create(
            user=target_user,
            notification_type='shared',
            title='Tarefa Compartilhada',
            message=f'{request.user.email} compartilhou "{task.title}" com você.',
            task=task,
        )
        return Response(
            {'detail': f'Tarefa compartilhada com {target_user.email}.'},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'], url_path='toggle')
    def toggle_complete(self, request, pk=None):
        task = self.get_object()
        was_done = task.status == 'done'
        task.status = 'todo' if was_done else 'done'
        task.save(update_fields=['status', 'completed', 'updated_at'])

        if not was_done:
            log_activity(request.user, 'completed', f'Concluiu a tarefa "{task.title}"', task)
            award_xp(request.user, 10, reason_task=task)
        else:
            log_activity(request.user, 'reopened', f'Reabriu a tarefa "{task.title}"', task)

        return Response(self.get_serializer(task).data)

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        qs = self.get_queryset()
        today = timezone.now().date()

        by_status = dict(qs.values_list('status').annotate(c=Count('id')).values_list('status', 'c'))
        for key in ['todo', 'in_progress', 'review', 'done']:
            by_status.setdefault(key, 0)

        by_priority = dict(qs.values_list('priority').annotate(c=Count('id')).values_list('priority', 'c'))
        for key in ['urgent', 'high', 'medium', 'low']:
            by_priority.setdefault(key, 0)

        by_category = list(
            qs.filter(category__isnull=False)
            .values('category__id', 'category__name', 'category__color')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        overdue = list(
            qs.filter(due_date__lt=today, completed=False)
            .order_by('due_date')
            .values('id', 'title', 'due_date', 'priority', 'status')[:10]
        )

        upcoming = list(
            qs.filter(due_date__gte=today, due_date__lte=today + timedelta(days=7), completed=False)
            .order_by('due_date')
            .values('id', 'title', 'due_date', 'priority', 'status')[:10]
        )

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

        # Time tracking stats
        total_time = TimeEntry.objects.filter(
            user=request.user, ended_at__isnull=False
        ).aggregate(total=Sum('duration_seconds'))['total'] or 0

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
            'total_time_seconds': total_time,
        })

    @action(detail=True, methods=['patch'], url_path='move')
    def move(self, request, pk=None):
        task = self.get_object()
        new_status = request.data.get('status')
        new_position = request.data.get('position')
        old_status = task.status

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

        if new_status and new_status != old_status:
            label = dict(Task.STATUS_CHOICES).get(new_status, new_status)
            log_activity(request.user, 'moved', f'Moveu "{task.title}" para {label}', task)
            if new_status == 'done' and old_status != 'done':
                award_xp(request.user, 10, reason_task=task)

        return Response(self.get_serializer(task).data)

    @action(detail=True, methods=['post'], url_path='create-from-recurrence')
    def create_from_recurrence(self, request, pk=None):
        task = self.get_object()
        if task.recurrence == 'none':
            return Response({'detail': 'Tarefa sem recorrência.'}, status=status.HTTP_400_BAD_REQUEST)

        delta = {'daily': timedelta(days=1), 'weekly': timedelta(weeks=1), 'monthly': timedelta(days=30)}
        new_due = (task.due_date or timezone.now().date()) + delta.get(task.recurrence, timedelta(days=1))

        if task.recurrence_end_date and new_due > task.recurrence_end_date:
            return Response({'detail': 'Recorrência encerrada.'}, status=status.HTTP_400_BAD_REQUEST)

        new_task = Task.objects.create(
            title=task.title,
            description=task.description,
            priority=task.priority,
            category=task.category,
            owner=task.owner,
            due_date=new_due,
            start_date=new_due,
            recurrence=task.recurrence,
            recurrence_end_date=task.recurrence_end_date,
            parent_task=task,
        )
        for sub in task.subtasks.all():
            SubTask.objects.create(task=new_task, title=sub.title, position=sub.position)

        log_activity(request.user, 'created', f'Criou recorrência de "{task.title}"', new_task)
        return Response(TaskSerializer(new_task, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='export')
    def export_csv(self, request):
        qs = self.filter_queryset(self.get_queryset())
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['Título', 'Descrição', 'Status', 'Prioridade', 'Categoria', 'Prazo', 'Criada em', 'Concluída'])
        for t in qs[:500]:
            writer.writerow([
                t.title,
                t.description,
                t.get_status_display(),
                t.get_priority_display(),
                t.category.name if t.category else '',
                t.due_date or '',
                t.created_at.strftime('%Y-%m-%d %H:%M'),
                'Sim' if t.completed else 'Não',
            ])
        response = HttpResponse(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="tarefas.csv"'
        return response


class SubTaskViewSet(viewsets.ModelViewSet):
    serializer_class = SubTaskSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return SubTask.objects.filter(task__owner=self.request.user, task_id=self.kwargs['task_pk'])

    def perform_create(self, serializer):
        task = Task.objects.get(pk=self.kwargs['task_pk'], owner=self.request.user)
        serializer.save(task=task)

    @action(detail=True, methods=['post'], url_path='toggle')
    def toggle(self, request, task_pk=None, pk=None):
        subtask = self.get_object()
        subtask.completed = not subtask.completed
        subtask.save(update_fields=['completed'])
        return Response(SubTaskSerializer(subtask).data)


class CommentViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    serializer_class = CommentSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Comment.objects.filter(task_id=self.kwargs['task_pk']).select_related('author')

    def perform_create(self, serializer):
        task = Task.objects.get(pk=self.kwargs['task_pk'])
        comment = serializer.save(author=self.request.user, task=task)
        log_activity(self.request.user, 'commented', f'Comentou em "{task.title}"', task)
        from apps.users.models import Notification
        participants = set(list(task.shared_with.all()) + [task.owner])
        participants.discard(self.request.user)
        for user in participants:
            Notification.objects.create(
                user=user,
                notification_type='comment',
                title='Novo Comentário',
                message=f'{self.request.user.email} comentou em "{task.title}"',
                task=task,
            )


class ActivityLogViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = ActivityLogSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return ActivityLog.objects.filter(user=self.request.user)[:100]


class TimeEntryViewSet(viewsets.ModelViewSet):
    serializer_class = TimeEntrySerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        qs = TimeEntry.objects.filter(user=self.request.user)
        task_id = self.request.query_params.get('task')
        if task_id:
            qs = qs.filter(task_id=task_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='stop')
    def stop(self, request, pk=None):
        entry = self.get_object()
        if entry.ended_at:
            return Response({'detail': 'Já finalizado.'}, status=status.HTTP_400_BAD_REQUEST)
        entry.ended_at = timezone.now()
        entry.duration_seconds = int((entry.ended_at - entry.started_at).total_seconds())
        entry.save(update_fields=['ended_at', 'duration_seconds'])

        if entry.is_pomodoro:
            from apps.users.models import Badge, UserBadge, Notification
            total_pomodoros = TimeEntry.objects.filter(user=request.user, is_pomodoro=True, ended_at__isnull=False).count()
            if total_pomodoros >= 25:
                badge = Badge.objects.filter(badge_type='pomodoro_master').first()
                if badge and not UserBadge.objects.filter(user=request.user, badge=badge).exists():
                    UserBadge.objects.create(user=request.user, badge=badge)
                    Notification.objects.create(
                        user=request.user,
                        notification_type='badge',
                        title='Nova Conquista!',
                        message='Você desbloqueou: Mestre Pomodoro!',
                    )

        award_xp(request.user, 5 if entry.is_pomodoro else 2)
        return Response(TimeEntrySerializer(entry).data)

    @action(detail=False, methods=['get'], url_path='active')
    def active_entry(self, request):
        entry = TimeEntry.objects.filter(user=request.user, ended_at__isnull=True).first()
        if entry:
            return Response(TimeEntrySerializer(entry).data)
        return Response(None)


class TaskTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = TaskTemplateSerializer
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = None

    def get_queryset(self):
        return TaskTemplate.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'], url_path='use')
    def use_template(self, request, pk=None):
        template = self.get_object()
        task = Task.objects.create(
            title=template.title,
            description=template.description,
            priority=template.priority,
            category=template.category,
            owner=request.user,
        )
        for i, title in enumerate(template.subtask_titles or []):
            SubTask.objects.create(task=task, title=title, position=i)
        log_activity(request.user, 'created', f'Criou "{task.title}" a partir do template', task)
        return Response(TaskSerializer(task, context={'request': request}).data, status=status.HTTP_201_CREATED)
