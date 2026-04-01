from django.conf import settings
from django.db import models


class Task(models.Model):
    PRIORITY_CHOICES = [
        ('urgent', 'Urgente'),
        ('high', 'Alta'),
        ('medium', 'Média'),
        ('low', 'Baixa'),
    ]

    STATUS_CHOICES = [
        ('todo', 'A Fazer'),
        ('in_progress', 'Em Andamento'),
        ('review', 'Em Revisão'),
        ('done', 'Concluído'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    completed = models.BooleanField(default=False, db_index=True)
    due_date = models.DateField(null=True, blank=True, db_index=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium', db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo', db_index=True)
    position = models.PositiveIntegerField(default=0)
    category = models.ForeignKey(
        'categories.Category',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='tasks',
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_tasks',
    )
    shared_with = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='shared_tasks',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['position', '-created_at']
        verbose_name = 'tarefa'
        verbose_name_plural = 'tarefas'

    def __str__(self):
        return self.title

    def save(self, **kwargs):
        self.completed = self.status == 'done'
        super().save(**kwargs)
