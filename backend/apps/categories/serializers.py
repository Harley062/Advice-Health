from rest_framework import serializers
from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'color')
        read_only_fields = ('id',)

    def validate_name(self, value):
        request = self.context.get('request')
        if request:
            qs = Category.objects.filter(name=value, owner=request.user)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError('You already have a category with this name.')
        return value
