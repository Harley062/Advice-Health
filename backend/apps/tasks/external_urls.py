from django.urls import path
from .external_views import random_joke

urlpatterns = [
    path('joke/', random_joke, name='random-joke'),
]
