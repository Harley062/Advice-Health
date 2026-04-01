from datetime import timedelta

from django.utils import timezone
from rest_framework import generics, permissions, viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from config.throttling import AuthRateThrottle
from .models import GameProfile, Badge, UserBadge, WeeklyGoal, Notification
from .serializers import (
    RegisterSerializer, UserSerializer, GameProfileSerializer,
    BadgeSerializer, UserBadgeSerializer, WeeklyGoalSerializer,
    NotificationSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)
    throttle_classes = (AuthRateThrottle,)


class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_classes = (AuthRateThrottle,)


class ThrottledTokenRefreshView(TokenRefreshView):
    throttle_classes = (AuthRateThrottle,)


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user


class GameProfileView(generics.RetrieveAPIView):
    serializer_class = GameProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        profile, _ = GameProfile.objects.get_or_create(user=self.request.user)
        return profile


class UserBadgesView(generics.ListAPIView):
    serializer_class = UserBadgeSerializer
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = None

    def get_queryset(self):
        return UserBadge.objects.filter(user=self.request.user).select_related('badge')


class AllBadgesView(generics.ListAPIView):
    serializer_class = BadgeSerializer
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = None
    queryset = Badge.objects.all()


class WeeklyGoalViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    serializer_class = WeeklyGoalSerializer
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = None

    def get_queryset(self):
        return WeeklyGoal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='current')
    def current(self, request):
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        goal = WeeklyGoal.objects.filter(user=request.user, week_start=week_start).first()
        if goal:
            return Response(WeeklyGoalSerializer(goal).data)
        return Response(None)


class NotificationViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = NotificationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)[:50]

    @action(detail=True, methods=['post'], url_path='read')
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.read = True
        notif.save(update_fields=['read'])
        return Response(NotificationSerializer(notif).data)

    @action(detail=False, methods=['post'], url_path='read-all')
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, read=False).update(read=True)
        return Response({'detail': 'Todas as notificações foram lidas.'})

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, read=False).count()
        return Response({'count': count})
