import pytest
from django.urls import reverse
from apps.categories.models import Category


@pytest.fixture
def category(db, user):
    return Category.objects.create(name='Work', owner=user, color='#FF0000')


@pytest.mark.django_db
class TestCategoryCRUD:
    def test_list_own_categories(self, auth_client, category):
        url = reverse('category-list')
        response = auth_client.get(url)
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Work'

    def test_create_category(self, auth_client):
        url = reverse('category-list')
        response = auth_client.post(url, {'name': 'Personal', 'color': '#00FF00'}, format='json')
        assert response.status_code == 201
        assert response.data['name'] == 'Personal'

    def test_create_category_unauthenticated(self, api_client):
        url = reverse('category-list')
        response = api_client.post(url, {'name': 'Personal'}, format='json')
        assert response.status_code == 401

    def test_update_category(self, auth_client, category):
        url = reverse('category-detail', args=[category.id])
        response = auth_client.patch(url, {'name': 'Updated'}, format='json')
        assert response.status_code == 200
        assert response.data['name'] == 'Updated'

    def test_delete_category(self, auth_client, category):
        url = reverse('category-detail', args=[category.id])
        response = auth_client.delete(url)
        assert response.status_code == 204
        assert not Category.objects.filter(id=category.id).exists()

    def test_cannot_see_other_users_categories(self, second_auth_client, category):
        url = reverse('category-list')
        response = second_auth_client.get(url)
        assert response.status_code == 200
        assert len(response.data) == 0

    def test_cannot_update_other_users_category(self, second_auth_client, category):
        url = reverse('category-detail', args=[category.id])
        response = second_auth_client.patch(url, {'name': 'Hacked'}, format='json')
        assert response.status_code == 404

    def test_cannot_delete_other_users_category(self, second_auth_client, category):
        url = reverse('category-detail', args=[category.id])
        response = second_auth_client.delete(url)
        assert response.status_code == 404

    def test_duplicate_category_name_same_user(self, auth_client, category):
        url = reverse('category-list')
        response = auth_client.post(url, {'name': 'Work', 'color': '#0000FF'}, format='json')
        assert response.status_code == 400

    def test_same_name_different_users(self, auth_client, second_auth_client, category):
        url = reverse('category-list')
        response = second_auth_client.post(url, {'name': 'Work', 'color': '#0000FF'}, format='json')
        assert response.status_code == 201
