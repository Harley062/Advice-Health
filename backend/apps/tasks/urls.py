from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TaskViewSet, SubTaskViewSet, CommentViewSet,
    ActivityLogViewSet, TimeEntryViewSet, TaskTemplateViewSet,
)

router = DefaultRouter()
router.register('templates', TaskTemplateViewSet, basename='task-template')
router.register('activity', ActivityLogViewSet, basename='activity-log')
router.register('time-entries', TimeEntryViewSet, basename='time-entry')
router.register('', TaskViewSet, basename='task')

subtask_router = DefaultRouter()
subtask_router.register('subtasks', SubTaskViewSet, basename='subtask')

comment_router = DefaultRouter()
comment_router.register('comments', CommentViewSet, basename='comment')

urlpatterns = [
    path('', include(router.urls)),
    path('<int:task_pk>/', include(subtask_router.urls)),
    path('<int:task_pk>/', include(comment_router.urls)),
]
