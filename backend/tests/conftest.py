import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .factories import UserFactory


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
def user(db):
    return UserFactory(username='testuser', email='test@example.com')


@pytest.fixture
def second_user(db):
    return UserFactory(username='otheruser', email='other@example.com')


def _authenticated_client(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    return client


@pytest.fixture
def auth_client(user):
    return _authenticated_client(user)


@pytest.fixture
def second_auth_client(second_user):
    return _authenticated_client(second_user)
