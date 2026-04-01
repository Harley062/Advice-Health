from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='task',
            name='completed',
            field=models.BooleanField(default=False, db_index=True),
        ),
        migrations.AlterField(
            model_name='task',
            name='due_date',
            field=models.DateField(blank=True, null=True, db_index=True),
        ),
    ]
