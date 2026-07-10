from django.contrib.auth import authenticate
from rest_framework import serializers
from apps.users.models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer chuyển User model thành JSON trả về client - bao gồm role, full_name, avatar và permissions."""

    role = serializers.CharField(source='role.code')
    full_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'avatar_url', 'date_joined', 'last_login',
            'google_email', 'is_active', 'permissions',
        ]

    def get_full_name(self, obj):
        """Lấy họ tên đầy đủ của user, fallback về first_name nếu không có."""
        return obj.get_full_name() or obj.first_name

    def get_avatar_url(self, obj):
        """Lấy URL ảnh đại diện của user."""
        return obj.avatar_url

    def get_permissions(self, obj):
        """Lấy danh sách permission codes của role user."""
        if obj.role:
            return list(obj.role.permissions.values_list('code', flat=True))
        return []


class LoginSerializer(serializers.Serializer):
    """Serializer kiểm tra payload đăng nhập và xác thực credentials - trả về user nếu hợp lệ."""

    email = serializers.EmailField(required=True, allow_blank=False)
    password = serializers.CharField(write_only=True, required=True, allow_blank=False)

    def validate(self, attrs):
        """Xác thực thông tin đăng nhập: kiểm tra email và password, trả về user nếu hợp lệ."""
        email_value = attrs.get('email', '').strip().lower()
        password = attrs.get('password', '').strip()

        if not email_value:
            raise serializers.ValidationError({'email': 'Email không được để trống.'})
        if not password:
            raise serializers.ValidationError({'password': 'Mật khẩu không được để trống.'})

        # Xác thực bằng email 
        user = authenticate(username=email_value, password=password)
        if user is None:
            raise serializers.ValidationError('Email hoặc mật khẩu không đúng.')
        if not user.is_active:
            raise serializers.ValidationError('Tài khoản đã bị khóa.')
        attrs['user'] = user
        return attrs


class RegisterSendOTPSerializer(serializers.Serializer):
    """Serializer kiểm tra payload gửi OTP đăng ký - validate full_name, email, password và terms."""

    full_name = serializers.CharField(max_length=150, required=True, allow_blank=False)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=6, required=True, allow_blank=False)
    confirm_password = serializers.CharField(write_only=True, min_length=6, required=True, allow_blank=False)
    accepted_terms = serializers.BooleanField(required=True)

    def validate_full_name(self, value):
        """Kiểm tra họ tên không được để trống hoặc chỉ chứa khoảng trắng."""
        if not value or not value.strip():
            raise serializers.ValidationError("Họ và tên không được để trống.")
        return value.strip()

    def validate_email(self, value):
        """Kiểm tra email chưa được sử dụng và chuẩn hóa về chữ thường."""
        email = value.lower().strip()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Email đã được sử dụng.")
        return email

    def validate(self, attrs):
        """Kiểm tra password và confirm_password khớp nhau, và đã đồng ý điều khoản."""
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Mật khẩu xác nhận không khớp."})

        if not attrs.get("accepted_terms"):
            raise serializers.ValidationError({"accepted_terms": "Bạn phải đồng ý với Điều khoản và Chính sách bảo mật."})

        return attrs


class RegisterVerifyOTPSerializer(serializers.Serializer):
    """Serializer kiểm tra payload xác minh OTP đăng ký - validate email và mã OTP 6 chữ số."""

    email = serializers.EmailField(required=True)
    otp = serializers.CharField(max_length=6, min_length=6, required=True, allow_blank=False)

    def validate_email(self, value):
        """Chuẩn hóa email về chữ thường."""
        return value.lower().strip()

    def validate_otp(self, value):
        """Kiểm tra mã OTP phải là 6 chữ số."""
        if not value.isdigit():
            raise serializers.ValidationError("Mã OTP phải là 6 chữ số.")
        return value


class ForgotPasswordSerializer(serializers.Serializer):
    """Serializer kiểm tra payload gửi yêu cầu quên mật khẩu - validate email tồn tại trong hệ thống."""

    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        """Kiểm tra email không trống và có tồn tại trong hệ thống."""
        if not value or not value.strip():
            raise serializers.ValidationError('Email không được để trống.')
        if not User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Không tìm thấy tài khoản với email này.')
        return value.lower()


class VerifyOTPSerializer(serializers.Serializer):
    """Serializer kiểm tra payload xác minh OTP đặt lại mật khẩu - validate email và mã OTP 6 chữ số."""

    email = serializers.EmailField(required=True)
    otp = serializers.CharField(max_length=6, min_length=6, required=True, allow_blank=False)

    def validate_otp(self, value):
        """Kiểm tra mã OTP phải là 6 chữ số."""
        if not value.isdigit():
            raise serializers.ValidationError('Mã OTP phải là 6 chữ số.')
        return value


class ResetPasswordSerializer(serializers.Serializer):
    """Serializer kiểm tra payload đặt lại mật khẩu - validate token, password và confirm_password."""

    token = serializers.CharField(required=True, allow_blank=False)
    password = serializers.CharField(write_only=True, min_length=6, required=True, allow_blank=False)
    confirm_password = serializers.CharField(write_only=True, min_length=6, required=True, allow_blank=False)

    def validate(self, attrs):
        """Kiểm tra password và confirm_password khớp nhau."""
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Mật khẩu xác nhận không khớp.'})
        return attrs


class GoogleLoginSerializer(serializers.Serializer):
    """Serializer nhận id_token từ client khi đăng nhập bằng Google OAuth."""

    id_token = serializers.CharField()


class RegisterResendOTPSerializer(serializers.Serializer):
    """Serializer kiểm tra payload gửi lại OTP đăng ký - validate email chưa được sử dụng."""

    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        """Kiểm tra email chưa được sử dụng và chuẩn hóa về chữ thường."""
        email = value.lower().strip()

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Email đã được sử dụng.")

        return email