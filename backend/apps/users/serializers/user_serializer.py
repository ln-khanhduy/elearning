from rest_framework import serializers

from apps.users.models import User, Role, InstructorProfile, InstructorCertificate


class RoleSerializer(serializers.ModelSerializer):
    """Serializer cho model Role - chuyển đổi dữ liệu role (id, code, name) giữa JSON và Python object."""

    class Meta:
        model = Role
        fields = ["id", "code", "name"]


class UserListSerializer(serializers.ModelSerializer):
    """Serializer cho danh sách người dùng - bao gồm thông tin role dạng lồng (nested)."""

    role = RoleSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "username", "first_name", "last_name", "phone", "avatar_url", "account_status", "role"]


class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer cho chi tiết người dùng - bao gồm thông tin role, trạng thái và thời gian."""

    role = RoleSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "username", "first_name", "last_name",
            "phone", "avatar_url", "account_status", "account_status_reason",
            "date_joined", "last_login", "role",
        ]


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Serializer cho cập nhật thông tin cá nhân - chỉ cho phép cập nhật tên, số điện thoại và avatar."""

    class Meta:
        model = User
        fields = ["first_name", "last_name", "phone", "avatar"]


class ChangeUserRoleSerializer(serializers.Serializer):
    """Serializer cho thay đổi role - nhận role_id và kiểm tra role_id có tồn tại trong hệ thống."""

    role_id = serializers.IntegerField()


class LockUnlockUserSerializer(serializers.Serializer):
    """Serializer cho khóa/mở khóa tài khoản - nhận lý do khóa (không bắt buộc)."""

    reason = serializers.CharField(required=False, allow_blank=True)


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer cho đổi mật khẩu - nhận mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu mới."""

    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        """Kiểm tra mật khẩu mới và xác nhận mật khẩu phải khớp nhau, đồng thời đảm bảo độ dài tối thiểu 6 ký tự."""
        new_password = attrs["new_password"]
        confirm_password = attrs["confirm_password"]

        if new_password != confirm_password:
            raise serializers.ValidationError({"confirm_password": "Mật khẩu xác nhận không khớp."})

        if len(new_password) < 6:
            raise serializers.ValidationError({"new_password": "Mật khẩu mới phải có ít nhất 6 ký tự."})

        return attrs


class InstructorApplySerializer(serializers.ModelSerializer):
    """Serializer cho đăng ký giảng viên - nhận thông tin chuyên môn, CV, thông tin ngân hàng và xác nhận điều khoản."""

    portfolio_link = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='')
    contact_phone = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='')
    bio = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='')

    class Meta:
        model = InstructorProfile
        fields = [
            "bio", "portfolio_link", "cv_file", "contact_phone",
            "bank_name", "bank_account_number", "bank_account_name",
            "is_terms_accepted",
        ]

    def validate_is_terms_accepted(self, value):
        """Kiểm tra người dùng đã đồng ý với điều khoản hợp tác giảng viên hay chưa."""
        # Chấp nhận cả boolean True và string "true" (từ FormData)
        if value is True or value == "true":
            return True
        raise serializers.ValidationError("Bạn phải đồng ý điều khoản.")


class InstructorCertificateSerializer(serializers.ModelSerializer):
    """Serializer cho chứng chỉ giảng viên - bao gồm id, title, file_url và thời gian upload."""

    file_url = serializers.SerializerMethodField()

    class Meta:
        model = InstructorCertificate
        fields = ["id", "title", "file", "file_url", "uploaded_at"]
        read_only_fields = ["id", "file_url", "uploaded_at"]

    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None


class InstructorApplicationSerializer(serializers.ModelSerializer):
    """Serializer cho hồ sơ đăng ký giảng viên - bao gồm thông tin user, trạng thái duyệt và thời gian."""

    user = UserDetailSerializer(read_only=True)
    certificates = InstructorCertificateSerializer(many=True, read_only=True)

    class Meta:
        model = InstructorProfile
        fields = [
            "id", "user", "bio", "portfolio_link", "cv_file", "contact_phone",
            "bank_name", "bank_account_number", "bank_account_name",
            "is_terms_accepted", "status", "rejection_reason",
            "reviewed_by", "reviewed_at", "applied_at", "created_at", "updated_at",
            "certificates",
        ]


class InstructorReviewSerializer(serializers.Serializer):
    """Serializer cho xét duyệt hồ sơ giảng viên - nhận trạng thái duyệt/từ chối và lý do từ chối (bắt buộc nếu từ chối)."""

    status = serializers.ChoiceField(choices=["APPROVED", "REJECTED"])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        """Kiểm tra nếu từ chối thì bắt buộc phải nhập lý do từ chối."""
        if attrs["status"] == "REJECTED" and not attrs.get("rejection_reason"):
            raise serializers.ValidationError({"rejection_reason": "Vui lòng nhập lý do từ chối."})
        return attrs
