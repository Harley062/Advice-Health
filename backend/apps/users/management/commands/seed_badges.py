from django.core.management.base import BaseCommand
from apps.users.models import Badge


BADGES = [
    ('first_task', 'Primeira Tarefa', 'Concluiu sua primeira tarefa!', '🎯'),
    ('tasks_10', '10 Tarefas', 'Concluiu 10 tarefas!', '⭐'),
    ('tasks_50', '50 Tarefas', 'Concluiu 50 tarefas!', '🌟'),
    ('tasks_100', 'Centurião', 'Concluiu 100 tarefas!', '💯'),
    ('streak_3', 'Consistente', '3 dias seguidos concluindo tarefas!', '🔥'),
    ('streak_7', 'Imparável', '7 dias seguidos concluindo tarefas!', '💪'),
    ('streak_30', 'Lenda', '30 dias seguidos concluindo tarefas!', '🏆'),
    ('pomodoro_master', 'Mestre Pomodoro', 'Completou 25 sessões pomodoro!', '🍅'),
    ('time_10h', 'Dedicado', 'Rastreou 10 horas de trabalho!', '⏱️'),
]


class Command(BaseCommand):
    help = 'Cria os badges padrão do sistema de gamificação'

    def handle(self, *args, **options):
        for badge_type, name, description, icon in BADGES:
            Badge.objects.update_or_create(
                badge_type=badge_type,
                defaults={'name': name, 'description': description, 'icon': icon},
            )
        self.stdout.write(self.style.SUCCESS(f'{len(BADGES)} badges criados/atualizados.'))
