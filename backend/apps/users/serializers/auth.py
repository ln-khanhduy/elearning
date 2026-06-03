from django.contrib.auth import authenticate
from rest_framework import serializers
from apps.users.models import User, Role
from apps.users.services.auth_service import AuthService


# Serializer chuyển User model thành định dạng JSON trả về client
class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='role.code')
    full_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = [ 'id', 'username', 'email', 'first_name', 'last_name', 'full_name','role', 'avatar_url',]
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.first_name
    # Lấy URL ảnh đại diện, ưu tiên ảnh upload nếu có, nếu không thì dùng URL từ Google OAuth
    def get_avatar_url(self, obj):
        return obj.avatar_url

# Serializer kiểm tra payload đăng nhập và xác thực credentials
class LoginSerializer(serializers.Serializer):
    login = serializers.CharField(required=True, allow_blank=False)
    password = serializers.CharField(write_only=True, required=True, allow_blank=False)

    # Validate thông tin đăng nhập và trả về user nếu hợp lệ
    def validate(self, attrs):
        login_value = attrs.get('login', '').strip()
        password = attrs.get('password', '').strip()
        
        if not login_value:
            raise serializers.ValidationError({'login': 'Email hoặc tên đăng nhập không được để trống.'})
        if not password:
            raise serializers.ValidationError({'password': 'Mật khẩu không được để trống.'})
        
        user = authenticate(username=login_value, password=password)
        if user is None and '@' in login_value:
            lookup = User.objects.filter(email__iexact=login_value).first()
            if lookup:
                user = authenticate(username=lookup.username, password=password)
        if user is None:
            raise serializers.ValidationError('Email hoặc mật khẩu không đúng.')
        if not user.is_active or user.account_status != 'ACTIVE':
            raise serializers.ValidationError('Tài khoản không hợp lệ hoặc đã bị khóa.')
        attrs['user'] = user
        return attrs

# Serializer kiểm tra payload xác minh OTP khi đăng ký
class RegisterSendOTPSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150, required=True, allow_blank=False)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=6, required=True, allow_blank=False)
    confirm_password = serializers.CharField(write_only=True, min_length=6, required=True, allow_blank=False)
    accepted_terms = serializers.BooleanField(required=True)

    def validate_full_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Họ và tên không được để trống.")
        return value.strip()

    def validate_email(self, value):
        email = value.lower().strip()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Email đã được sử dụng.")
        return email

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({
                "confirm_password": "Mật khẩu xác nhận không khớp."
            })

        if not attrs.get("accepted_terms"):
            raise serializers.ValidationError({
                "accepted_terms": "Bạn phải đồng ý với Điều khoản và Chính sách bảo mật."
            })

        return attrs

# Serializer kiểm tra payload xác minh OTP khi đăng ký
class RegisterVerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(max_length=6, min_length=6, required=True, allow_blank=False)

    def validate_email(self, value):
        return value.lower().strip()

    def validate_otp(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("Mã OTP phải là 6 chữ số.")
        return value

# Serializer dùng để gửi yêu cầu quên mật khẩu
class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Email không được để trống.')
        if not User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Không tìm thấy tài khoản với email này.')
        return value.lower()


# Serializer kiểm tra input xác minh OTP
class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(max_length=6, min_length=6, required=True, allow_blank=False)

    # Validate định dạng OTP phải là 6 chữ số
    def validate_otp(self, value):
        if not value.isdigit():
            raise serializers.ValidationError('Mã OTP phải là 6 chữ số.')
        return value


# Serializer xử lý đổi mật khẩu mới khi có reset token
class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField(required=True, allow_blank=False)
    password = serializers.CharField(write_only=True, min_length=6, required=True, allow_blank=False)
    confirm_password = serializers.CharField(write_only=True, min_length=6, required=True, allow_blank=False)

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Mật khẩu xác nhận không khớp.'})
        return attrs


# Serializer nhận id_token từ client khi dùng Google OAuth
class GoogleLoginSerializer(serializers.Serializer):
    id_token = serializers.CharField()

# Serializer dùng để gửi yêu cầu gửi lại OTP khi đăng ký
class RegisterResendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        email = value.lower().strip()

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Email đã được sử dụng.")

        return email
