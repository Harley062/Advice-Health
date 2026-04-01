from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0002_add_indexes'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='priority',
            field=models.CharField(
                choices=[('urgent', 'Urgente'), ('high', 'Alta'), ('medium', 'Média'), ('low', 'Baixa')],
                db_index=True,
                default='medium',
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='task',
            name='status',
            field=models.CharField(
                choices=[('todo', 'A Fazer'), ('in_progress', 'Em Andamento'), ('review', 'Em Revisão'), ('done', 'Concluído')],
                db_index=True,
                default='todo',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='task',
            name='position',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AlterModelOptions(
            name='task',
            options={
                'ordering': ['position', '-created_at'],
                'verbose_name': 'tarefa',
                'verbose_name_plural': 'tarefas',
            },
        ),
    ]
