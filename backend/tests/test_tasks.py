import pytest
from django.urls import reverse
from apps.tasks.models import Task
from apps.categories.models import Category


@pytest.fixture
def category(db, user):
    return Category.objects.create(name='Work', owner=user, color='#FF0000')


@pytest.fixture
def task(db, user):
    return Task.objects.create(title='Test Task', description='Desc', owner=user)


@pytest.fixture
def completed_task(db, user):
    return Task.objects.create(title='Done Task', status='done', owner=user)


@pytest.mark.django_db
class TestTaskCRUD:
    def test_create_task(self, auth_client):
        url = reverse('task-list')
        response = auth_client.post(url, {
            'title': 'New Task',
            'description': 'My description',
        }, format='json')
        assert response.status_code == 201
        assert response.data['title'] == 'New Task'
        assert response.data['completed'] is False
        assert response.data['status'] == 'todo'
        assert response.data['priority'] == 'medium'

    def test_create_task_with_priority_and_status(self, auth_client):
        url = reverse('task-list')
        response = auth_client.post(url, {
            'title': 'Urgent Task',
            'priority': 'urgent',
            'status': 'in_progress',
        }, format='json')
        assert response.status_code == 201
        assert response.data['priority'] == 'urgent'
        assert response.data['priority_display'] == 'Urgente'
        assert response.data['status'] == 'in_progress'
        assert response.data['status_display'] == 'Em Andamento'
        assert response.data['completed'] is False

    def test_create_task_done_syncs_completed(self, auth_client):
        url = reverse('task-list')
        response = auth_client.post(url, {
            'title': 'Done Task',
            'status': 'done',
        }, format='json')
        assert response.status_code == 201
        assert response.data['status'] == 'done'
        assert response.data['completed'] is True

    def test_create_task_unauthenticated(self, api_client):
        url = reverse('task-list')
        response = api_client.post(url, {'title': 'Fail Task'}, format='json')
        assert response.status_code == 401

    def test_list_tasks(self, auth_client, task):
        url = reverse('task-list')
        response = auth_client.get(url)
        assert response.status_code == 200
        assert response.data['count'] == 1

    def test_retrieve_task(self, auth_client, task):
        url = reverse('task-detail', args=[task.id])
        response = auth_client.get(url)
        assert response.status_code == 200
        assert response.data['title'] == task.title

    def test_update_task(self, auth_client, task):
        url = reverse('task-detail', args=[task.id])
        response = auth_client.patch(url, {'title': 'Updated'}, format='json')
        assert response.status_code == 200
        assert response.data['title'] == 'Updated'

    def test_delete_task(self, auth_client, task):
        url = reverse('task-detail', args=[task.id])
        response = auth_client.delete(url)
        assert response.status_code == 204
        assert not Task.objects.filter(id=task.id).exists()

    def test_cannot_edit_others_task(self, second_auth_client, task):
        url = reverse('task-detail', args=[task.id])
        response = second_auth_client.patch(url, {'title': 'Hacked'}, format='json')
        assert response.status_code in (403, 404)

    def test_cannot_delete_others_task(self, second_auth_client, task):
        url = reverse('task-detail', args=[task.id])
        response = second_auth_client.delete(url)
        assert response.status_code in (403, 404)


@pytest.mark.django_db
class TestTaskFiltering:
    def test_filter_completed(self, auth_client, task, completed_task):
        url = reverse('task-list')
        response = auth_client.get(url, {'completed': 'true'})
        assert response.status_code == 200
        assert response.data['count'] == 1
        assert response.data['results'][0]['title'] == 'Done Task'

    def test_filter_not_completed(self, auth_client, task, completed_task):
        url = reverse('task-list')
        response = auth_client.get(url, {'completed': 'false'})
        assert response.status_code == 200
        assert response.data['count'] == 1
        assert response.data['results'][0]['title'] == 'Test Task'

    def test_filter_by_category(self, auth_client, user, category):
        Task.objects.create(title='Cat Task', owner=user, category=category)
        Task.objects.create(title='No Cat Task', owner=user)
        url = reverse('task-list')
        response = auth_client.get(url, {'category': category.id})
        assert response.status_code == 200
        assert response.data['count'] == 1
        assert response.data['results'][0]['title'] == 'Cat Task'

    def test_filter_by_priority(self, auth_client, user):
        Task.objects.create(title='Urgent', owner=user, priority='urgent')
        Task.objects.create(title='Low', owner=user, priority='low')
        url = reverse('task-list')
        response = auth_client.get(url, {'priority': 'urgent'})
        assert response.status_code == 200
        assert response.data['count'] == 1
        assert response.data['results'][0]['title'] == 'Urgent'

    def test_filter_by_status(self, auth_client, user):
        Task.objects.create(title='In Progress', owner=user, status='in_progress')
        Task.objects.create(title='Todo', owner=user, status='todo')
        url = reverse('task-list')
        response = auth_client.get(url, {'status': 'in_progress'})
        assert response.status_code == 200
        assert response.data['count'] == 1
        assert response.data['results'][0]['title'] == 'In Progress'

    def test_filter_due_date_range(self, auth_client, user):
        from datetime import date
        Task.objects.create(title='Past', owner=user, due_date=date(2024, 1, 1))
        Task.objects.create(title='Future', owner=user, due_date=date(2030, 1, 1))
        url = reverse('task-list')
        response = auth_client.get(url, {
            'due_date_from': '2025-01-01',
            'due_date_to': '2031-01-01',
        })
        assert response.status_code == 200
        assert response.data['count'] == 1
        assert response.data['results'][0]['title'] == 'Future'


@pytest.mark.django_db
class TestTaskPagination:
    def test_pagination(self, auth_client, user):
        for i in range(15):
            Task.objects.create(title=f'Task {i}', owner=user)
        url = reverse('task-list')
        response = auth_client.get(url)
        assert response.status_code == 200
        assert response.data['count'] == 15
        assert len(response.data['results']) == 10
        assert response.data['next'] is not None

    def test_pagination_second_page(self, auth_client, user):
        for i in range(15):
            Task.objects.create(title=f'Task {i}', owner=user)
        url = reverse('task-list')
        response = auth_client.get(url, {'page': 2})
        assert response.status_code == 200
        assert len(response.data['results']) == 5
        assert response.data['previous'] is not None


@pytest.mark.django_db
class TestTaskSharing:
    def test_share_task(self, auth_client, task, second_user):
        url = reverse('task-share', args=[task.id])
        response = auth_client.post(url, {'email': second_user.email}, format='json')
        assert response.status_code == 200
        task.refresh_from_db()
        assert second_user in task.shared_with.all()

    def test_shared_user_can_see_task(self, auth_client, second_auth_client, task, second_user):
        share_url = reverse('task-share', args=[task.id])
        auth_client.post(share_url, {'email': second_user.email}, format='json')

        list_url = reverse('task-list')
        response = second_auth_client.get(list_url)
        assert response.status_code == 200
        task_ids = [t['id'] for t in response.data['results']]
        assert task.id in task_ids

    def test_share_with_nonexistent_user(self, auth_client, task):
        url = reverse('task-share', args=[task.id])
        response = auth_client.post(url, {'email': 'nobody@example.com'}, format='json')
        assert response.status_code == 400

    def test_share_with_self(self, auth_client, task, user):
        url = reverse('task-share', args=[task.id])
        response = auth_client.post(url, {'email': user.email}, format='json')
        assert response.status_code == 400

    def test_non_owner_cannot_share(self, second_auth_client, task, second_user):
        task.shared_with.add(second_user)
        url = reverse('task-share', args=[task.id])
        response = second_auth_client.post(url, {'email': 'other@example.com'}, format='json')
        assert response.status_code == 403


@pytest.mark.django_db
class TestTaskToggle:
    def test_toggle_complete(self, auth_client, task):
        assert task.completed is False
        assert task.status == 'todo'
        url = reverse('task-toggle-complete', args=[task.id])
        response = auth_client.post(url)
        assert response.status_code == 200
        assert response.data['completed'] is True
        assert response.data['status'] == 'done'

    def test_toggle_back_to_incomplete(self, auth_client, completed_task):
        assert completed_task.completed is True
        url = reverse('task-toggle-complete', args=[completed_task.id])
        response = auth_client.post(url)
        assert response.status_code == 200
        assert response.data['completed'] is False
        assert response.data['status'] == 'todo'


@pytest.mark.django_db
class TestTaskMove:
    def test_move_task_status(self, auth_client, task):
        url = reverse('task-move', args=[task.id])
        response = auth_client.patch(url, {'status': 'in_progress'}, format='json')
        assert response.status_code == 200
        assert response.data['status'] == 'in_progress'
        assert response.data['completed'] is False

    def test_move_task_to_done(self, auth_client, task):
        url = reverse('task-move', args=[task.id])
        response = auth_client.patch(url, {'status': 'done'}, format='json')
        assert response.status_code == 200
        assert response.data['status'] == 'done'
        assert response.data['completed'] is True

    def test_move_task_invalid_status(self, auth_client, task):
        url = reverse('task-move', args=[task.id])
        response = auth_client.patch(url, {'status': 'invalid'}, format='json')
        assert response.status_code == 400

    def test_move_task_position(self, auth_client, task):
        url = reverse('task-move', args=[task.id])
        response = auth_client.patch(url, {'status': 'todo', 'position': 5}, format='json')
        assert response.status_code == 200
        assert response.data['position'] == 5
