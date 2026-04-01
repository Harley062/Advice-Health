import requests
from django.core.cache import cache
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

JOKE_CACHE_KEY = 'external_joke'
JOKE_CACHE_TTL = 60 * 5  # 5 minutes


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def random_joke(request):
    cached = cache.get(JOKE_CACHE_KEY)
    if cached:
        return Response(cached)

    try:
        response = requests.get(
            'https://official-joke-api.appspot.com/random_joke',
            timeout=3,
        )
        response.raise_for_status()
        data = response.json()
        joke = {
            'setup': data.get('setup'),
            'punchline': data.get('punchline'),
            'type': data.get('type'),
        }
        cache.set(JOKE_CACHE_KEY, joke, JOKE_CACHE_TTL)
        return Response(joke)
    except requests.RequestException as exc:
        return Response(
            {'detail': 'Não foi possível buscar a piada da API externa.', 'error': str(exc)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
