import os
import secrets
import string
import cloudinary
from django.db import IntegrityError, transaction
from django.http import HttpResponseRedirect
from django.utils import timezone
from django.utils.crypto import get_random_string
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.exceptions import ValidationError as DRFValidationError
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

from apps.common.permissions import HasRequiredPermission
from apps.users.models import InstructorProfile
from apps.users.repositories import user_repository
from apps.users.repositories import instructor_repository
from apps.users.utils.cookies import REFRESH_COOKIE_NAME
from apps.users.services import google_oauth_service


ROLE_HIERARCHY = {
    "SUPERADMIN": 0,
    "COURSE_ADMIN": 1,
    "INSTRUCTOR_MANAGER": 1,
    "USER_MANAGER": 1,
    "FINANCE_ADMIN": 1,
    "INSTRUCTOR": 2,
    "STUDENT": 2,
}


def _blacklist_user_tokens(user):
    outstanding_tokens = OutstandingToken.objects.filter(user=user)
    for token in outstanding_tokens:
        try:
            refresh = RefreshToken(token.token)
            refresh.blacklist()
        except Exception:
            pass


def get_all_users():
    return user_repository.get_all_users()


def get_user_by_id(user_id):
    return user_repository.get_user_by_id(user_id)


def change_role(user_id, role_id):
    user = user_repository.get_user_by_id(user_id)
    role = user_repository.get_role_by_id(role_id)
    if role.code == "SUPERADMIN":
        raise DRFValidationError({
            "detail": "Không thể gán quyền Super Admin qua API."
        })
    user.role = role
    user.save(update_fields=["role"])
    return user


def lock_user(user_id, admin_user, reason=""):
    user = user_repository.get_user_by_id(user_id)

    if user.id == admin_user.id:
        raise DRFValidationError({"detail": "Bạn không thể tự khóa tài khoản của mình."})

    if user.role and user.role.code == "SUPERADMIN":
        raise DRFValidationError({"detail": "Không thể khóa tài khoản Super Admin."})

    admin_role_code = admin_user.role.code if admin_user.role else "STUDENT"
    target_role_code = user.role.code if user.role else "STUDENT"
    admin_level = ROLE_HIERARCHY.get(admin_role_code, 99)
    target_level = ROLE_HIERARCHY.get(target_role_code, 99)

    if admin_level >= target_level:
        raise DRFValidationError({"detail": "Bạn không có quyền khóa tài khoản này."})

    user.is_active = False
    user.account_status_reason = reason
    user.account_status_changed_at = timezone.now()
    user.account_status_changed_by = admin_user
    user.save(update_fields=["is_active", "account_status_reason", "account_status_changed_at", "account_status_changed_by"])

    _blacklist_user_tokens(user)
    return user


def unlock_user(user_id, admin_user):
    user = user_repository.get_user_by_id(user_id)
    user.is_active = True
    user.account_status_reason = None
    user.account_status_changed_at = None
    user.account_status_changed_by = None
    user.save(update_fields=["is_active", "account_status_reason", "account_status_changed_at", "account_status_changed_by"])
    return user


def update_profile(user, validated_data):
    instructor_profile_fields = {"bank_name", "bank_account_number", "bank_account_name", "bio", "portfolio_link", "cv_file"}
    profile_data = {k: v for k, v in validated_data.items() if k in instructor_profile_fields}
    user_data = {k: v for k, v in validated_data.items() if k not in instructor_profile_fields}

    for attr, value in user_data.items():
        setattr(user, attr, value)
    user.save()

    if profile_data and hasattr(user, 'instructor_profile'):
        instructor_profile = user.instructor_profile
        for attr, value in profile_data.items():
            setattr(instructor_profile, attr, value)
        instructor_profile.save(update_fields=list(profile_data.keys()))

    return user


@transaction.atomic
def link_google_account(user, id_token_value):
    google_info = google_oauth_service.verify_google_token(id_token_value)
    google_email = google_info["email"].lower()

    existing_user = user_repository.get_user_by_google_email(google_email)
    if existing_user and existing_user.id != user.id:
        raise DRFValidationError({"google_email": "Google Account này đã được liên kết với tài khoản khác."})

    try:
        return user_repository.link_google_account(user, google_email)
    except IntegrityError:
        raise DRFValidationError({"google_email": "Google Account này đã được liên kết với tài khoản khác."})


def change_password(user, old_password, new_password):
    if not user.check_password(old_password):
        raise DRFValidationError({"old_password": "Mật khẩu cũ không đúng."})

    if old_password == new_password:
        raise DRFValidationError({"new_password": "Mật khẩu mới không được trùng mật khẩu cũ."})

    try:
        validate_password(new_password, user)
    except DjangoValidationError as errors:
        raise DRFValidationError({"new_password": list(errors.messages)})

    user.set_password(new_password)
    user.save(update_fields=["password"])
    return user


def _generate_random_password(length=12):
    alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return get_random_string(length=length, allowed_chars=alphabet)


def _send_account_created_email(profile, password):
    subject = "Tài khoản giảng viên LMS Learn của bạn đã được kích hoạt"
    message = (
        f"Xin chào {profile.name},\n\n"
        f"Hồ sơ đăng ký giảng viên của bạn đã được phê duyệt!\n\n"
        f"Thông tin tài khoản của bạn:\n"
        f"  - Email đăng nhập: {profile.email}\n"
        f"  - Mật khẩu tạm thời: {password}\n\n"
        f"Hướng dẫn đăng nhập:\n"
        f"  1. Truy cập trang đăng nhập: {settings.FRONTEND_URL}/login\n"
        f"  2. Nhập email và mật khẩu tạm thời ở trên\n"
        f"  3. Sau khi đăng nhập thành công, vui lòng đổi mật khẩu ngay\n"
        f"  4. Bắt đầu tạo khóa học và chia sẻ kiến thức!\n\n"
        f"Lưu ý: Vui lòng đổi mật khẩu sau lần đăng nhập đầu tiên để bảo vệ tài khoản.\n\n"
        f"Trân trọng,\n"
        f"LMS Learn"
    )
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [profile.email], fail_silently=False)


def _send_application_rejected_email(profile):
    subject = "Hồ sơ đăng ký giảng viên LMS Learn chưa được phê duyệt"
    message = (
        f"Xin chào {profile.name},\n\n"
        f"Hồ sơ đăng ký giảng viên của bạn hiện chưa được phê duyệt.\n\n"
        f"Lý do: {profile.rejection_reason}\n\n"
        f"Bạn có thể chỉnh sửa lại hồ sơ và nộp lại sau.\n"
        f"Truy cập: {settings.FRONTEND_URL}/instructor/apply\n\n"
        f"Trân trọng,\n"
        f"LMS Learn"
    )
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [profile.email], fail_silently=False)


@transaction.atomic
def apply(validated_data):
    email = validated_data.get("email", "").lower().strip()

    existing_user = user_repository.get_user_by_email(email)
    if existing_user:
        raise DRFValidationError({
            "detail": "Email này đã có tài khoản trong hệ thống."
        })

    existing = instructor_repository.get_application_by_email(email)
    if existing:
        if existing.status == InstructorProfile.Status.PENDING:
            raise DRFValidationError({"detail": "Bạn đã gửi hồ sơ đăng ký và đang chờ xét duyệt."})
        if existing.status == InstructorProfile.Status.APPROVED:
            raise DRFValidationError({"detail": "Hồ sơ của bạn đã được duyệt."})
        for attr, value in validated_data.items():
            setattr(existing, attr, value)
        existing.status = InstructorProfile.Status.PENDING
        existing.rejection_reason = None
        existing.reviewed_by = None
        existing.reviewed_at = None
        existing.save()
        return existing

    try:
        profile = instructor_repository.create_application(validated_data)
        return profile
    except IntegrityError:
        raise DRFValidationError({
            "detail": "Đã có lỗi xảy ra khi gửi hồ sơ. Vui lòng thử lại."
        })


def get_application_by_email(email):
    return instructor_repository.get_application_by_email(email)


def get_all_applications(status_filter=None):
    return instructor_repository.get_all_applications(status_filter)


def get_application_detail(application_id):
    return instructor_repository.get_application_by_id(application_id)


@transaction.atomic
def review_application(application_id, admin_user, review_status, rejection_reason=None):
    application = instructor_repository.get_application_by_id(application_id)

    if application.status != InstructorProfile.Status.PENDING:
        raise DRFValidationError({"detail": "Hồ sơ này đã được xử lý."})

    application.status = review_status
    application.reviewed_by = admin_user
    application.reviewed_at = timezone.now()

    if review_status == InstructorProfile.Status.APPROVED:
        instructor_role = user_repository.get_role_by_code("INSTRUCTOR")
        password = _generate_random_password()

        name_parts = application.name.strip().split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        user = user_repository.create_user(
            email=application.email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=instructor_role,
            phone=application.contact_phone or "",
        )

        application.user = user
        application.rejection_reason = None
        application.save()

        _send_account_created_email(application, password)
        detail = "Duyệt hồ sơ giảng viên thành công."
    else:
        application.rejection_reason = rejection_reason
        application.save()

        _send_application_rejected_email(application)
        detail = "Từ chối hồ sơ giảng viên thành công."

    return application, detail


def add_certificate(application, title, file):
    return instructor_repository.create_certificate(application, title, file)


def get_certificates(application):
    return instructor_repository.get_certificates_by_application(application)


def delete_certificate(application, certificate_id):
    instructor_repository.delete_certificate(application, certificate_id)


def get_certificate_by_id(application, certificate_id):
    return instructor_repository.get_certificate_by_id(application, certificate_id)


def _authenticate_request(request):
    try:
        jwt_auth = JWTAuthentication()
        result = jwt_auth.authenticate(request)
        if result is not None:
            return result[0]
    except Exception:
        pass

    refresh_token_value = request.COOKIES.get(REFRESH_COOKIE_NAME)
    if refresh_token_value:
        try:
            refresh = RefreshToken(refresh_token_value)
            access_token_str = str(refresh.access_token)
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(access_token_str)
            return jwt_auth.get_user(validated_token)
        except Exception:
            pass

    return None


def check_application_access(application, request_user, permission_code="user.instructor.view"):
    class TempView:
        required_permission = permission_code
        permission_classes = []

    perm_checker = HasRequiredPermission()
    temp_view = TempView()

    class FakeRequest:
        user = request_user
        method = "GET"

    is_admin = perm_checker.has_permission(FakeRequest(), temp_view)
    is_owner = request_user.is_authenticated and request_user.email == application.email
    return is_admin or is_owner


def _get_signed_url(file_field):
    public_id = file_field.name
    ext = os.path.splitext(public_id)[1].lower()
    image_exts = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'}
    video_exts = {'.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv', '.wmv'}

    if ext in image_exts:
        resource_type = 'image'
    elif ext in video_exts:
        resource_type = 'video'
    else:
        resource_type = 'raw'

    signed_url = cloudinary.utils.cloudinary_url(
        public_id,
        resource_type=resource_type,
        type='upload',
        sign_url=True,
        secure=True
    )[0]

    return signed_url


def download_file_from_cloudinary(file_field, default_filename="file"):
    filename = file_field.name.split('/')[-1] or default_filename
    signed_url = _get_signed_url(file_field)
    response = HttpResponseRedirect(signed_url)
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


def preview_file_from_cloudinary(file_field, default_filename="file"):
    signed_url = _get_signed_url(file_field)
    return HttpResponseRedirect(signed_url)


def upload_certificates(application, titles, files):
    certificates = []
    errors = []

    for i, file in enumerate(files):
        if not file:
            continue
        title = titles[i].strip() if i < len(titles) else ""
        if not title:
            # Dùng tên file làm title mặc định
            title = file.name.rsplit(".", 1)[0] if "." in file.name else file.name

        try:
            certificate = instructor_repository.create_certificate(application, title, file)
            certificates.append(certificate)
        except Exception as e:
            errors.append(f"Lỗi khi tải file '{file.name}': {str(e)}")

    return certificates, errors


def process_upload_request(application, request):
    titles = request.data.getlist("titles[]") or [request.data.get("title", "")]
    files = request.FILES.getlist("files[]") or ([request.FILES.get("file")] if request.FILES.get("file") else [])
    # Filter out None values
    files = [f for f in files if f]

    if not files:
        raise DRFValidationError({"detail": "Vui lòng chọn file chứng chỉ."})

    if len(titles) != len(files):
        if len(titles) == 1 and len(files) > 1:
            titles = titles * len(files)
        else:
            raise DRFValidationError({"detail": "Số lượng tên chứng chỉ và file không khớp."})

    return upload_certificates(application, titles, files)