from django.urls import path
from .views import random_joke

urlpatterns = [
    path('joke/', random_joke, name='random-joke'),
]
