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
        fields = ["id", "email", "first_name", "last_name", "phone", "avatar_url", "role"]


class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer cho chi tiết người dùng - bao gồm thông tin role, trạng thái, thời gian và danh sách permissions."""

    role = RoleSerializer(read_only=True)
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name",
            "phone", "avatar_url", "is_active",
            "account_status_reason", "account_status_changed_at", "account_status_changed_by",
            "date_joined", "last_login", "role", "google_email",
            "permissions",
        ]

    def get_permissions(self, obj):
        if obj.role:
            return list(obj.role.permissions.values_list('code', flat=True))
        return []


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Serializer cho cập nhật thông tin cá nhân - tên, số điện thoại, avatar và thông tin ngân hàng (cho instructor)."""

    # Thông tin ngân hàng (chỉ instructor mới gửi)
    bank_name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    bank_account_number = serializers.CharField(required=False, allow_blank=True, max_length=50)
    bank_account_name = serializers.CharField(required=False, allow_blank=True, max_length=100)

    # Thông tin hồ sơ giảng viên (chỉ instructor mới gửi)
    bio = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    portfolio_link = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    cv_file = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            "first_name", "last_name", "phone", "avatar",
            "bank_name", "bank_account_number", "bank_account_name",
            "bio", "portfolio_link", "cv_file",
        ]

    def validate_bank_account_number(self, value):
        """Kiểm tra số tài khoản ngân hàng chỉ chứa chữ số nếu có giá trị."""
        if value and not value.isdigit():
            raise serializers.ValidationError("Số tài khoản chỉ được chứa chữ số.")
        return value

    def validate_bank_name(self, value):
        """Kiểm tra tên ngân hàng không vượt quá 100 ký tự."""
        if value and len(value) > 100:
            raise serializers.ValidationError("Tên ngân hàng không được vượt quá 100 ký tự.")
        return value

    def validate_bank_account_name(self, value):
        """Kiểm tra tên chủ tài khoản không vượt quá 100 ký tự."""
        if value and len(value) > 100:
            raise serializers.ValidationError("Tên chủ tài khoản không được vượt quá 100 ký tự.")
        return value


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
    """Serializer cho đăng ký giảng viên (public - không cần đăng nhập)."""

    name = serializers.CharField(required=True, max_length=50)
    email = serializers.EmailField(required=True, max_length=50)
    cv_file = serializers.FileField(required=True)
    portfolio_link = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='')
    contact_phone = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='')
    bio = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='')
    certificates = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        allow_empty=True,
        write_only=True,
    )

    class Meta:
        model = InstructorProfile
        fields = [
            "name", "email", "bio", "portfolio_link", "cv_file", "contact_phone",
            "bank_name", "bank_account_number", "bank_account_name",
            "is_terms_accepted", "certificates",
        ]

    def validate_bank_account_number(self, value):
        """Kiểm tra số tài khoản ngân hàng chỉ chứa chữ số và có độ dài hợp lệ."""
        if not value.isdigit():
            raise serializers.ValidationError("Số tài khoản ngân hàng chỉ được chứa chữ số.")
        if len(value) < 6 or len(value) > 30:
            raise serializers.ValidationError("Số tài khoản ngân hàng phải từ 6 đến 30 chữ số.")
        return value

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
        fields = ["id", "title", "file_url", "uploaded_at"]
        read_only_fields = ["id", "file_url", "uploaded_at"]

    def get_file_url(self, obj):
        if obj.file:
            try:
                return obj.file.url
            except Exception:
                return None
        return None


class InstructorApplicationSerializer(serializers.ModelSerializer):
    """Serializer cho hồ sơ đăng ký giảng viên - bao gồm thông tin người dùng (nếu đã được duyệt), trạng thái duyệt và thời gian."""

    user = UserDetailSerializer(read_only=True)
    certificates = InstructorCertificateSerializer(many=True, read_only=True)
    reviewed_by_id = serializers.SerializerMethodField()
    reviewed_by_email = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = InstructorProfile
        fields = [
            "id", "user", "name", "email", "bio", "portfolio_link", "cv_file", "contact_phone",
            "bank_name", "bank_account_number", "bank_account_name",
            "is_terms_accepted", "status", "rejection_reason",
            "reviewed_by", "reviewed_by_id", "reviewed_by_email", "reviewed_by_name",
            "reviewed_at", "applied_at", "created_at", "updated_at",
            "certificates",
        ]

    def get_reviewed_by_id(self, obj):
        return obj.reviewed_by.id if obj.reviewed_by else None

    def get_reviewed_by_email(self, obj):
        return obj.reviewed_by.email if obj.reviewed_by else None

    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return obj.reviewed_by.get_full_name() or obj.reviewed_by.first_name
        return None


class LinkGoogleSerializer(serializers.Serializer):
    """Serializer cho liên kết Google Account - nhận id_token từ Google."""

    id_token = serializers.CharField(
        write_only=True,
        allow_blank=False,
        trim_whitespace=True,
    )


class InstructorReviewSerializer(serializers.Serializer):
    """Serializer cho xét duyệt hồ sơ giảng viên - nhận trạng thái duyệt/từ chối và lý do từ chối (bắt buộc nếu từ chối)."""

    status = serializers.ChoiceField(choices=["APPROVED", "REJECTED"])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        """Kiểm tra nếu từ chối thì bắt buộc phải nhập lý do từ chối."""
        if attrs["status"] == "REJECTED" and not attrs.get("rejection_reason"):
            raise serializers.ValidationError({"rejection_reason": "Vui lòng nhập lý do từ chối."})
        return attrs
