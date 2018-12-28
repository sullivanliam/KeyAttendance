from rest_framework import serializers
from .models import Students, AttendanceItems
from rest_framework_jwt.settings import api_settings
from django.contrib.auth.models import User

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        fields = (
            'first_name',
            'last_name',
            'id',
            'first_attendance',
            'number_visits',
        )
        model = Students

class AttendanceItemSerializer(serializers.ModelSerializer):
    class Meta:
        fields = (
            'student_id',
            'date',
            'time',
            'activity_id',
            'id',
        )
        model = AttendanceItems

class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ('username', 'is_staff')

class UserSerializerCreate(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True)

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        if password is not None:
            instance.set_password(password)
        instance.save()
        return instance

    class Meta:
        model = User
        fields = ('username', 'password', 'is_staff')