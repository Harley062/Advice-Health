from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Task, SubTask, Comment, ActivityLog, TimeEntry, TaskTemplate
from apps.categories.serializers import CategorySerializer

User = get_user_model()


class SubTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubTask
        fields = ('id', 'title', 'completed', 'position')
        read_only_fields = ('id',)


class TaskSerializer(serializers.ModelSerializer):
    category_detail = CategorySerializer(source='category', read_only=True)
    shared_with_emails = serializers.SerializerMethodField()
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    subtasks = SubTaskSerializer(many=True, read_only=True)
    subtask_progress = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = (
            'id', 'title', 'description', 'completed', 'start_date', 'due_date',
            'priority', 'priority_display', 'status', 'status_display',
            'position', 'category', 'category_detail', 'owner',
            'shared_with', 'shared_with_emails',
            'recurrence', 'recurrence_end_date', 'parent_task',
            'subtasks', 'subtask_progress',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'owner', 'completed', 'created_at', 'updated_at')

    def get_shared_with_emails(self, obj):
        return [user.email for user in obj.shared_with.all()]

    def get_subtask_progress(self, obj):
        subtasks = obj.subtasks.all()
        total = len(subtasks)
        if total == 0:
            return None
        done = sum(1 for s in subtasks if s.completed)
        return {'total': total, 'done': done}

    def validate_category(self, category):
        if category is not None:
            request = self.context.get('request')
            if request and category.owner != request.user:
                raise serializers.ValidationError('Esta categoria não pertence a você.')
        return category


class ShareTaskSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, email):
        try:
            self._target_user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('Nenhum usuário encontrado com este e-mail.')
        return email

    @property
    def target_user(self):
        return self._target_user


class CommentSerializer(serializers.ModelSerializer):
    author_email = serializers.CharField(source='author.email', read_only=True)

    class Meta:
        model = Comment
        fields = ('id', 'task', 'author', 'author_email', 'content', 'created_at')
        read_only_fields = ('id', 'task', 'author', 'created_at')


class ActivityLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = ActivityLog
        fields = ('id', 'task', 'user', 'user_email', 'action', 'description', 'task_title', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')


class TimeEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeEntry
        fields = ('id', 'task', 'user', 'started_at', 'ended_at', 'duration_seconds', 'is_pomodoro')
        read_only_fields = ('id', 'user')


class TaskTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskTemplate
        fields = ('id', 'title', 'description', 'priority', 'category', 'subtask_titles', 'created_at')
        read_only_fields = ('id', 'created_at')
