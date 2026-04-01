from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import GameProfile, Badge, UserBadge, WeeklyGoal, Notification

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'As senhas não coincidem.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')


class GameProfileSerializer(serializers.ModelSerializer):
    xp_for_next_level = serializers.IntegerField(read_only=True)
    xp_progress = serializers.IntegerField(read_only=True)

    class Meta:
        model = GameProfile
        fields = (
            'xp', 'level', 'streak_current', 'streak_best',
            'last_completed_date', 'tasks_completed_total',
            'xp_for_next_level', 'xp_progress',
        )


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ('id', 'badge_type', 'name', 'description', 'icon')


class UserBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)

    class Meta:
        model = UserBadge
        fields = ('id', 'badge', 'earned_at')


class WeeklyGoalSerializer(serializers.ModelSerializer):
    completed_count = serializers.SerializerMethodField()

    class Meta:
        model = WeeklyGoal
        fields = ('id', 'week_start', 'target_count', 'completed_count', 'created_at')
        read_only_fields = ('id', 'created_at')

    def get_completed_count(self, obj):
        from datetime import timedelta
        from apps.tasks.models import Task
        week_end = obj.week_start + timedelta(days=6)
        return Task.objects.filter(
            owner=obj.user,
            status='done',
            updated_at__date__gte=obj.week_start,
            updated_at__date__lte=week_end,
        ).count()


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'notification_type', 'title', 'message', 'read', 'task', 'created_at')
        read_only_fields = ('id', 'notification_type', 'title', 'message', 'task', 'created_at')
