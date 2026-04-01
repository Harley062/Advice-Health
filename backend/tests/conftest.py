import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user_data():
    return {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'StrongPass123!',
        'password2': 'StrongPass123!',
    }


@pytest.fixture
def user(db, user_data):
    return User.objects.create_user(
        username=user_data['username'],
        email=user_data['email'],
        password=user_data['password'],
    )


@pytest.fixture
def second_user(db):
    return User.objects.create_user(
        username='otheruser',
        email='other@example.com',
        password='StrongPass123!',
    )


@pytest.fixture
def auth_client(api_client, user):
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    return api_client


@pytest.fixture
def second_auth_client(api_client, second_user):
    from rest_framework.test import APIClient
    from rest_framework_simplejwt.tokens import RefreshToken
    client = APIClient()
    refresh = RefreshToken.for_user(second_user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    return client
