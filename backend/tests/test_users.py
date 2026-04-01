import pytest
from django.urls import reverse


@pytest.mark.django_db
class TestRegister:
    def test_register_success(self, api_client, user_data):
        url = reverse('auth-register')
        response = api_client.post(url, user_data, format='json')
        assert response.status_code == 201
        assert 'id' in response.data
        assert response.data['email'] == user_data['email']
        assert 'password' not in response.data

    def test_register_password_mismatch(self, api_client, user_data):
        url = reverse('auth-register')
        user_data['password2'] = 'WrongPassword!'
        response = api_client.post(url, user_data, format='json')
        assert response.status_code == 400
        assert 'password' in response.data

    def test_register_duplicate_email(self, api_client, user, user_data):
        url = reverse('auth-register')
        user_data['username'] = 'anotheruser'
        response = api_client.post(url, user_data, format='json')
        assert response.status_code == 400

    def test_register_missing_fields(self, api_client):
        url = reverse('auth-register')
        response = api_client.post(url, {'email': 'bad@test.com'}, format='json')
        assert response.status_code == 400


@pytest.mark.django_db
class TestLogin:
    def test_login_success(self, api_client, user):
        url = reverse('auth-login')
        response = api_client.post(url, {
            'email': user.email,
            'password': 'StrongPass123!',
        }, format='json')
        assert response.status_code == 200
        assert 'access' in response.data
        assert 'refresh' in response.data

    def test_login_wrong_password(self, api_client, user):
        url = reverse('auth-login')
        response = api_client.post(url, {
            'email': user.email,
            'password': 'WrongPassword!',
        }, format='json')
        assert response.status_code == 401

    def test_login_nonexistent_user(self, api_client):
        url = reverse('auth-login')
        response = api_client.post(url, {
            'email': 'nobody@example.com',
            'password': 'SomePassword123!',
        }, format='json')
        assert response.status_code == 401


@pytest.mark.django_db
class TestTokenRefresh:
    def test_refresh_success(self, api_client, user):
        login_url = reverse('auth-login')
        login_resp = api_client.post(login_url, {
            'email': user.email,
            'password': 'StrongPass123!',
        }, format='json')
        refresh_token = login_resp.data['refresh']

        refresh_url = reverse('auth-refresh')
        response = api_client.post(refresh_url, {'refresh': refresh_token}, format='json')
        assert response.status_code == 200
        assert 'access' in response.data

    def test_refresh_invalid_token(self, api_client):
        url = reverse('auth-refresh')
        response = api_client.post(url, {'refresh': 'invalid.token.here'}, format='json')
        assert response.status_code == 401

    def test_me_endpoint(self, auth_client, user):
        url = reverse('auth-me')
        response = auth_client.get(url)
        assert response.status_code == 200
        assert response.data['email'] == user.email

    def test_me_unauthenticated(self, api_client):
        url = reverse('auth-me')
        response = api_client.get(url)
        assert response.status_code == 401
