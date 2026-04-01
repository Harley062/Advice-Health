from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'status', 'priority', 'completed', 'category', 'due_date', 'created_at')
    list_filter = ('status', 'priority', 'completed', 'category', 'due_date')
    search_fields = ('title', 'description', 'owner__email')
    raw_id_fields = ('owner', 'category')
    filter_horizontal = ('shared_with',)
    ordering = ('position', '-created_at')
    list_select_related = ('owner', 'category')
