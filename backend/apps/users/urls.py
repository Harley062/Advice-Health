from django.urls import path

from .views import RegisterView, ThrottledTokenObtainPairView, ThrottledTokenRefreshView, MeView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', ThrottledTokenObtainPairView.as_view(), name='auth-login'),
    path('refresh/', ThrottledTokenRefreshView.as_view(), name='auth-refresh'),
    path('me/', MeView.as_view(), name='auth-me'),
]
