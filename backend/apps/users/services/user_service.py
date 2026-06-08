from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.users.repositories.user_repository import UserRepository, InstructorRepository


class UserService:
    @staticmethod
    def change_role(user_id, role_id):
        user = UserRepository.get_user_by_id(user_id)
        role = UserRepository.get_role_by_id(role_id)
        user.role = role
        user.save(update_fields=["role"])
        return user

    @staticmethod
    def lock_user(user_id, admin_user, reason=""):
        user = UserRepository.get_user_by_id(user_id)

        if user.id == admin_user.id:
            raise ValidationError({"detail": "Bạn không thể tự khóa tài khoản của mình."})

        if user.role and user.role.code == "SUPERADMIN":
            raise ValidationError({"detail": "Không thể khóa tài khoản Super Admin."})

        user.account_status = "LOCKED"
        user.account_status_reason = reason
        user.account_status_changed_at = timezone.now()
        user.account_status_changed_by = admin_user
        user.save()
        return user

    @staticmethod
    def unlock_user(user_id, admin_user):
        user = UserRepository.get_user_by_id(user_id)
        user.account_status = "ACTIVE"
        user.account_status_reason = ""
        user.account_status_changed_at = timezone.now()
        user.account_status_changed_by = admin_user
        user.save()
        return user

    @staticmethod
    def change_password(user, new_password):
        user.set_password(new_password)
        user.save(update_fields=["password"])
        return user


class InstructorService:
    @staticmethod
    def apply(user, validated_data):
        profile = validated_data
        return profile

    @staticmethod
    def review_application(application_id, admin_user, review_status, rejection_reason=None):
        application = InstructorRepository.get_application_by_id(application_id)

        if application.status != "PENDING":
            raise ValidationError({"detail": "Hồ sơ này đã được xử lý."})

        application.status = review_status
        application.reviewed_by = admin_user
        application.reviewed_at = timezone.now()

        if review_status == "APPROVED":
            instructor_role = UserRepository.get_role_by_code("INSTRUCTOR")
            application.user.role = instructor_role
            application.user.save(update_fields=["role"])
            application.rejection_reason = None
            detail = "Duyệt hồ sơ giảng viên thành công."
        else:
            application.rejection_reason = rejection_reason
            detail = "Từ chối hồ sơ giảng viên thành công."

        application.save()
        return application, detail