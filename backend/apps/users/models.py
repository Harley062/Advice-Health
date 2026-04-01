from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email


class GameProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='game_profile')
    xp = models.PositiveIntegerField(default=0)
    level = models.PositiveIntegerField(default=1)
    streak_current = models.PositiveIntegerField(default=0)
    streak_best = models.PositiveIntegerField(default=0)
    last_completed_date = models.DateField(null=True, blank=True)
    tasks_completed_total = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f'{self.user.email} - Lv.{self.level} ({self.xp} XP)'

    @property
    def xp_for_next_level(self):
        return self.level * 100

    @property
    def xp_progress(self):
        needed = self.xp_for_next_level
        current_level_xp = self.xp - sum(i * 100 for i in range(1, self.level))
        return min(current_level_xp, needed)


class Badge(models.Model):
    BADGE_TYPES = [
        ('streak_3', '3 Dias Seguidos'),
        ('streak_7', '7 Dias Seguidos'),
        ('streak_30', '30 Dias Seguidos'),
        ('tasks_10', '10 Tarefas Concluídas'),
        ('tasks_50', '50 Tarefas Concluídas'),
        ('tasks_100', '100 Tarefas Concluídas'),
        ('first_task', 'Primeira Tarefa'),
        ('pomodoro_master', 'Mestre Pomodoro'),
        ('time_10h', '10 Horas Rastreadas'),
    ]

    badge_type = models.CharField(max_length=30, choices=BADGE_TYPES, unique=True)
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=300)
    icon = models.CharField(max_length=10, default='🏆')

    def __str__(self):
        return self.name


class UserBadge(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [['user', 'badge']]

    def __str__(self):
        return f'{self.user.email} - {self.badge.name}'


class WeeklyGoal(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='weekly_goals')
    week_start = models.DateField()
    target_count = models.PositiveIntegerField(default=5)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [['user', 'week_start']]
        ordering = ['-week_start']

    def __str__(self):
        return f'{self.user.email} - Semana {self.week_start} ({self.target_count} tarefas)'


class Notification(models.Model):
    TYPE_CHOICES = [
        ('deadline', 'Prazo Próximo'),
        ('overdue', 'Atrasada'),
        ('shared', 'Compartilhada'),
        ('comment', 'Comentário'),
        ('badge', 'Conquista'),
        ('streak', 'Sequência'),
        ('goal', 'Meta Semanal'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.CharField(max_length=500)
    read = models.BooleanField(default=False)
    task = models.ForeignKey(
        'tasks.Task', null=True, blank=True, on_delete=models.SET_NULL,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} - {self.title}'
