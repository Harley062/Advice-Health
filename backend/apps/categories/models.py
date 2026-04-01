from django.conf import settings
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='categories')
    color = models.CharField(max_length=7, default='#3B82F6')

    class Meta:
        verbose_name = 'categoria'
        verbose_name_plural = 'categorias'
        ordering = ['name']
        unique_together = [['name', 'owner']]

    def __str__(self):
        return f'{self.name} ({self.owner.email})'
