from django.shortcuts import get_object_or_404
from apps.users.models import User, Role, InstructorProfile


class UserRepository:
    @staticmethod
    def get_all_users():
        return User.objects.select_related("role").all().order_by("-date_joined")

    @staticmethod
    def get_user_by_id(user_id):
        return get_object_or_404(User.objects.select_related("role"), id=user_id)

    @staticmethod
    def get_role_by_id(role_id):
        return get_object_or_404(Role, id=role_id)

    @staticmethod
    def get_role_by_code(code):
        return get_object_or_404(Role, code=code)


class InstructorRepository:
    @staticmethod
    def get_all_applications():
        return InstructorProfile.objects.select_related("user", "user__role", "reviewed_by").all().order_by("-applied_at")

    @staticmethod
    def get_application_by_id(application_id):
        return get_object_or_404(InstructorProfile.objects.select_related("user", "user__role", "reviewed_by"), id=application_id)