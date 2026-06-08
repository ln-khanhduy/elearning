from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password

from apps.users.models import User, Role, InstructorCertificate, InstructorProfile


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "code", "name"]


class UserListSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)

    class Meta:
        model = User
        fields = [ "id", "email","username", "first_name","last_name","phone","avatar_url","account_status","role",]


class UserDetailSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id","email","username","first_name","last_name", "phone", "avatar_url","account_status", "account_status_reason", "date_joined", "last_login", "role", ]


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [ "first_name","last_name", "phone", "avatar",]


class ChangeUserRoleSerializer(serializers.Serializer):
    role_id = serializers.IntegerField()

    def validate_role_id(self, value):
        if not Role.objects.filter(id=value).exists():
            raise serializers.ValidationError("Role không tồn tại.")
        return value


class LockUnlockUserSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = self.context["request"].user

        old_password = attrs["old_password"]
        new_password = attrs["new_password"]
        confirm_password = attrs["confirm_password"]

        if not user.check_password(old_password):
            raise serializers.ValidationError({"old_password": "Mật khẩu cũ không đúng."})

        if new_password != confirm_password:
            raise serializers.ValidationError({"confirm_password": "Mật khẩu xác nhận không khớp." })

        if old_password == new_password:
            raise serializers.ValidationError({"new_password": "Mật khẩu mới không được trùng mật khẩu cũ."})
        if len(new_password) < 6:
            raise serializers.ValidationError({"new_password": "Mật khẩu mới phải có ít nhất 6 ký tự."})
        validate_password(new_password, user)

        return attrs
    
class InstructorApplySerializer(serializers.ModelSerializer):
    class Meta:
        model = InstructorProfile
        fields = ["bio","portfolio_link", "cv_file","contact_phone","bank_name","bank_account_number","bank_account_name","is_terms_accepted",]

    def validate_is_terms_accepted(self, value):
        if value is not True:
            raise serializers.ValidationError("Bạn phải đồng ý điều khoản.")
        return value

    def validate(self, attrs):
        user = self.context["request"].user

        if hasattr(user, "instructor_profile"):
            raise serializers.ValidationError("Bạn đã gửi hồ sơ đăng ký giảng viên.")

        return attrs


class InstructorApplicationSerializer(serializers.ModelSerializer):
    user = UserDetailSerializer(read_only=True)

    class Meta:
        model = InstructorProfile
        fields = ["id","user","bio","portfolio_link","cv_file","contact_phone","bank_name","bank_account_number", "bank_account_name","is_terms_accepted","status",
            "rejection_reason","reviewed_by","reviewed_at","applied_at","created_at","updated_at",]


class InstructorReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["APPROVED", "REJECTED"])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs["status"] == "REJECTED" and not attrs.get("rejection_reason"):
            raise serializers.ValidationError({"rejection_reason": "Vui lòng nhập lý do từ chối."})
        return attrs