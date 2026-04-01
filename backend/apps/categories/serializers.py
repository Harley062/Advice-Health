import re

from rest_framework import serializers
from .models import Category

HEX_COLOR_RE = re.compile(r'^#[0-9A-Fa-f]{6}$')


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

    def validate_color(self, value):
        if not HEX_COLOR_RE.match(value):
            raise serializers.ValidationError('Color must be a valid hex code (e.g. #FF5733).')
        return value
