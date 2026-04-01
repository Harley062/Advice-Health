from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, ThrottledTokenObtainPairView, ThrottledTokenRefreshView,
    MeView, GameProfileView, UserBadgesView, AllBadgesView,
    WeeklyGoalViewSet, NotificationViewSet,
)

router = DefaultRouter()
router.register('goals', WeeklyGoalViewSet, basename='weekly-goal')
router.register('notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', ThrottledTokenObtainPairView.as_view(), name='auth-login'),
    path('refresh/', ThrottledTokenRefreshView.as_view(), name='auth-refresh'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('game-profile/', GameProfileView.as_view(), name='game-profile'),
    path('badges/', UserBadgesView.as_view(), name='user-badges'),
    path('badges/all/', AllBadgesView.as_view(), name='all-badges'),
    path('', include(router.urls)),
]
