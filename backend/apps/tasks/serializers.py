from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Task
from apps.categories.serializers import CategorySerializer

User = get_user_model()


class TaskSerializer(serializers.ModelSerializer):
    category_detail = CategorySerializer(source='category', read_only=True)
    shared_with_emails = serializers.SerializerMethodField()
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Task
        fields = (
            'id', 'title', 'description', 'completed', 'due_date',
            'priority', 'priority_display', 'status', 'status_display',
            'position', 'category', 'category_detail', 'owner',
            'shared_with', 'shared_with_emails', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'owner', 'completed', 'created_at', 'updated_at')

    def get_shared_with_emails(self, obj):
        return [user.email for user in obj.shared_with.all()]

    def validate_category(self, category):
        if category is not None:
            request = self.context.get('request')
            if request and category.owner != request.user:
                raise serializers.ValidationError('Esta categoria não pertence a você.')
        return category


class ShareTaskSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, email):
        try:
            self._target_user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('Nenhum usuário encontrado com este e-mail.')
        return email

    @property
    def target_user(self):
        return self._target_user
