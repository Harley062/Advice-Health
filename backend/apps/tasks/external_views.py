import requests
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def random_joke(request):
    try:
        response = requests.get(
            'https://official-joke-api.appspot.com/random_joke',
            timeout=5,
        )
        response.raise_for_status()
        data = response.json()
        return Response({
            'setup': data.get('setup'),
            'punchline': data.get('punchline'),
            'type': data.get('type'),
        })
    except requests.RequestException as exc:
        return Response(
            {'detail': 'Could not fetch joke from external API.', 'error': str(exc)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
