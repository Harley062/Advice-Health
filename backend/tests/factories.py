import factory
from django.contrib.auth import get_user_model
from apps.categories.models import Category
from apps.tasks.models import Task

User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        skip_postgeneration_save = True

    username = factory.Sequence(lambda n: f'user{n}')
    email = factory.Sequence(lambda n: f'user{n}@example.com')

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        self.set_password(extracted or 'StrongPass123!')
        if create:
            self.save()


class CategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Category

    name = factory.Sequence(lambda n: f'Category {n}')
    owner = factory.SubFactory(UserFactory)
    color = '#3B82F6'


class TaskFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Task

    title = factory.Sequence(lambda n: f'Task {n}')
    description = factory.Faker('sentence')
    completed = False
    owner = factory.SubFactory(UserFactory)
