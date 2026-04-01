import django_filters
from .models import Task


class TaskFilter(django_filters.FilterSet):
    completed = django_filters.BooleanFilter(field_name='completed')
    category = django_filters.NumberFilter(field_name='category__id')
    due_date_from = django_filters.DateFilter(field_name='due_date', lookup_expr='gte')
    due_date_to = django_filters.DateFilter(field_name='due_date', lookup_expr='lte')
    priority = django_filters.CharFilter(field_name='priority')
    status = django_filters.CharFilter(field_name='status')

    class Meta:
        model = Task
        fields = ['completed', 'category', 'due_date_from', 'due_date_to', 'priority', 'status']
