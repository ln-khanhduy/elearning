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
from apps.users.repositories.user_repository import UserRepository
from apps.users.repositories.instructor_repository import InstructorRepository, InstructorCertificateRepository
from apps.users.utils.cookies import REFRESH_COOKIE_NAME
from apps.users.services.google_oauth_service import GoogleOAuthService



ROLE_HIERARCHY = {
    "SUPERADMIN": 0,
    "COURSE_ADMIN": 1,
    "INSTRUCTOR_MANAGER": 1,
    "USER_MANAGER": 1,
    "FINANCE_ADMIN": 1,
    "INSTRUCTOR": 2,
    "STUDENT": 2,
}


class UserService:
    """Service quản lý người dùng - danh sách, chi tiết, khóa/mở khóa, đổi mật khẩu, cập nhật hồ sơ."""

    @staticmethod
    def _blacklist_user_tokens(user):
        """
        Blacklist tất cả refresh token đang hoạt động của user.
        Điều này buộc user phải đăng nhập lại (hoặc bị logout nếu đang online).
        """
        outstanding_tokens = OutstandingToken.objects.filter(user=user)
        for token in outstanding_tokens:
            try:
                refresh = RefreshToken(token.token)
                refresh.blacklist()
            except Exception:
                pass

    @staticmethod
    def get_all_users():
        """Lấy danh sách tất cả người dùng trong hệ thống (ủy quyền cho Repository truy vấn)."""
        return UserRepository.get_all_users()

    @staticmethod
    def get_user_by_id(user_id):
        """Lấy thông tin chi tiết của một người dùng theo ID (ủy quyền cho Repository truy vấn)."""
        return UserRepository.get_user_by_id(user_id)

    @staticmethod
    def change_role(user_id, role_id):
        """
        Thay đổi vai trò (role) của người dùng.
        - Tìm user và role theo ID từ Repository
        - Chặn gán role SUPERADMIN qua API
        - Gán role mới và lưu vào database
        """
        user = UserRepository.get_user_by_id(user_id)
        role = UserRepository.get_role_by_id(role_id)
        if role.code == "SUPERADMIN":
            raise DRFValidationError({
                "detail": "Không thể gán quyền Super Admin qua API."
            })
        user.role = role
        user.save(update_fields=["role"])
        return user

    @staticmethod
    def lock_user(user_id, admin_user, reason=""):
        """
        Khóa tài khoản người dùng.
        - Kiểm tra admin không thể tự khóa chính mình
        - Kiểm tra không thể khóa Super Admin
        - Kiểm tra phân cấp: admin chỉ có thể khóa người có cấp bậc thấp hơn
        - Cập nhật is_active=False kèm lý do, thời gian và người khóa
        - Blacklist tất cả refresh token của user để logout ngay lập tức
        """
        user = UserRepository.get_user_by_id(user_id)

        if user.id == admin_user.id:
            raise DRFValidationError({"detail": "Bạn không thể tự khóa tài khoản của mình."})

        if user.role and user.role.code == "SUPERADMIN":
            raise DRFValidationError({"detail": "Không thể khóa tài khoản Super Admin."})

        # Kiểm tra phân cấp: admin không thể khóa người có cấp bậc cao hơn hoặc ngang hàng
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

        # Blacklist tất cả refresh token để logout user ngay lập tức
        UserService._blacklist_user_tokens(user)

        return user

    @staticmethod
    def unlock_user(user_id, admin_user):
        """
        Mở khóa tài khoản người dùng.
        - Đặt is_active = True
        - Xóa lý do khóa, thời gian và người khóa
        """
        user = UserRepository.get_user_by_id(user_id)
        user.is_active = True
        user.account_status_reason = None
        user.account_status_changed_at = None
        user.account_status_changed_by = None
        user.save(update_fields=["is_active", "account_status_reason", "account_status_changed_at", "account_status_changed_by"])
        return user

    @staticmethod
    def update_profile(user, validated_data):
        """
        Cập nhật thông tin cá nhân của người dùng.
        - Duyệt qua các trường User được gửi lên và gán giá trị mới
        - Nếu user là instructor và có gửi thông tin ngân hàng/hồ sơ, cập nhật InstructorProfile
        - Lưu thay đổi vào database
        """
        # Các trường thuộc InstructorProfile (chỉ instructor mới có)
        instructor_profile_fields = {"bank_name", "bank_account_number", "bank_account_name", "bio", "portfolio_link", "cv_file"}
        profile_data = {k: v for k, v in validated_data.items() if k in instructor_profile_fields}
        user_data = {k: v for k, v in validated_data.items() if k not in instructor_profile_fields}

        # Cập nhật thông tin User
        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()

        # Cập nhật thông tin InstructorProfile nếu user là instructor và có gửi dữ liệu
        if profile_data and hasattr(user, 'instructor_profile'):
            instructor_profile = user.instructor_profile
            for attr, value in profile_data.items():
                setattr(instructor_profile, attr, value)
            instructor_profile.save(update_fields=list(profile_data.keys()))

        return user

    @staticmethod
    @transaction.atomic
    def link_google_account(user, id_token_value):
        """
        Liên kết Google Account với user hiện tại.
        - Xác thực id_token từ Google thông qua GoogleOAuthService
        - Lấy email từ payload Google
        - Kiểm tra google_email chưa được liên kết với user khác
        - Lưu google_email vào user (bọc transaction để tránh race condition)
        """
        google_info = GoogleOAuthService.verify_google_token(id_token_value)
        google_email = google_info["email"].lower()

        existing_user = UserRepository.get_user_by_google_email(google_email)
        if existing_user and existing_user.id != user.id:
            raise DRFValidationError({"google_email": "Google Account này đã được liên kết với tài khoản khác."})

        try:
            return UserRepository.link_google_account(user, google_email)
        except IntegrityError:
            raise DRFValidationError({"google_email": "Google Account này đã được liên kết với tài khoản khác."})

    @staticmethod
    def change_password(user, old_password, new_password):
        """
        Đổi mật khẩu cho người dùng.
        - Kiểm tra mật khẩu cũ có chính xác không
        - Kiểm tra mật khẩu mới không được trùng mật khẩu cũ
        - Validate mật khẩu theo các quy tắc bảo mật (độ dài, độ phức tạp)
        - Mã hóa và lưu mật khẩu mới
        """
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


class InstructorService:
    """Service quản lý hồ sơ đăng ký giảng viên - nộp đơn, duyệt/từ chối, chứng chỉ, tải file."""

    @staticmethod
    def _generate_random_password(length=12):
        """Tạo mật khẩu ngẫu nhiên an toàn, không chứa ký tự dễ nhầm lẫn (0, O, I, l, 1)."""
        alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        return get_random_string(length=length, allowed_chars=alphabet)

    @staticmethod
    def _send_account_created_email(profile, password):
        """
        Gửi email thông báo tài khoản giảng viên đã được tạo.
        Bao gồm email đăng nhập, mật khẩu tạm thời, hướng dẫn đăng nhập
        và khuyến nghị đổi mật khẩu sau lần đăng nhập đầu tiên.
        """
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

    @staticmethod
    def _send_application_rejected_email(profile):
        """
        Gửi email thông báo hồ sơ giảng viên bị từ chối.
        Bao gồm lý do từ chối và hướng dẫn nộp lại hồ sơ sau khi chỉnh sửa.
        """
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

    @staticmethod
    @transaction.atomic
    def apply(validated_data):
        """
        Xử lý đăng ký trở thành giảng viên (public - không cần đăng nhập).
        - Kiểm tra email đã có tài khoản User chưa
        - Tìm InstructorProfile theo email (email là unique)
            - Nếu chưa có: tạo mới (user=None, status=PENDING)
            - Nếu status == PENDING: báo lỗi
            - Nếu status == APPROVED: báo lỗi
            - Nếu status == REJECTED: cập nhật lại thành PENDING
        - Không tạo User, không tạo JWT, không đăng nhập
        """
        email = validated_data.get("email", "").lower().strip()

        # Kiểm tra email đã có tài khoản User chưa
        existing_user = UserRepository.get_user_by_email(email)
        if existing_user:
            raise DRFValidationError({
                "detail": "Email này đã có tài khoản trong hệ thống."
            })

        # Tìm InstructorProfile theo email (email là unique)
        existing = InstructorRepository.get_application_by_email(email)
        if existing:
            if existing.status == InstructorProfile.Status.PENDING:
                raise DRFValidationError({"detail": "Bạn đã gửi hồ sơ đăng ký và đang chờ xét duyệt."})
            if existing.status == InstructorProfile.Status.APPROVED:
                raise DRFValidationError({"detail": "Hồ sơ của bạn đã được duyệt."})
            # Nếu REJECTED: cập nhật lại hồ sơ cũ thành PENDING
            for attr, value in validated_data.items():
                setattr(existing, attr, value)
            existing.status = InstructorProfile.Status.PENDING
            existing.rejection_reason = None
            existing.reviewed_by = None
            existing.reviewed_at = None
            existing.save()
            return existing

        try:
            profile = InstructorRepository.create_application(validated_data)
            return profile
        except IntegrityError:
            raise DRFValidationError({
                "detail": "Đã có lỗi xảy ra khi gửi hồ sơ. Vui lòng thử lại."
            })

    @staticmethod
    def get_application_by_email(email):
        """Lấy hồ sơ đăng ký giảng viên theo email."""
        return InstructorRepository.get_application_by_email(email)

    @staticmethod
    def get_all_applications(status_filter=None):
        """
        Lấy danh sách tất cả hồ sơ đăng ký giảng viên.
        Có thể lọc theo trạng thái nếu được chỉ định (ủy quyền cho Repository truy vấn).
        """
        return InstructorRepository.get_all_applications(status_filter)

    @staticmethod
    def get_application_detail(application_id):
        """Lấy chi tiết một hồ sơ đăng ký giảng viên theo ID (ủy quyền cho Repository truy vấn)."""
        return InstructorRepository.get_application_by_id(application_id)

    @staticmethod
    @transaction.atomic
    def review_application(application_id, admin_user, review_status, rejection_reason=None):
        """
        Xét duyệt hồ sơ đăng ký giảng viên.
        - Kiểm tra hồ sơ đang ở trạng thái PENDING (chưa được xử lý)
        - Nếu DUYỆT: tạo User mới với role INSTRUCTOR, gửi email thông tin tài khoản
        - Nếu TỪ CHỐI: ghi lại lý do từ chối, không thay đổi role
        - Cập nhật người duyệt và thời gian duyệt
        """
        application = InstructorRepository.get_application_by_id(application_id)

        if application.status != InstructorProfile.Status.PENDING:
            raise DRFValidationError({"detail": "Hồ sơ này đã được xử lý."})

        application.status = review_status
        application.reviewed_by = admin_user
        application.reviewed_at = timezone.now()

        if review_status == InstructorProfile.Status.APPROVED:
            # Tạo User mới với role INSTRUCTOR
            instructor_role = UserRepository.get_role_by_code("INSTRUCTOR")
            password = InstructorService._generate_random_password()

            # Parse name thành first_name và last_name
            name_parts = application.name.strip().split(" ", 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ""

            user = UserRepository.create_user(
                email=application.email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role=instructor_role,
                phone=application.contact_phone or "",
            )

            # Gán user cho profile
            application.user = user
            application.rejection_reason = None
            application.save()

            # Gửi email thông tin tài khoản
            InstructorService._send_account_created_email(application, password)

            detail = "Duyệt hồ sơ giảng viên thành công."
        else:
            application.rejection_reason = rejection_reason
            application.save()

            # Gửi email thông báo từ chối
            InstructorService._send_application_rejected_email(application)

            detail = "Từ chối hồ sơ giảng viên thành công."

        return application, detail

    @staticmethod
    def add_certificate(application, title, file):
        """Thêm chứng chỉ mới cho hồ sơ giảng viên."""
        return InstructorCertificateRepository.create_certificate(application, title, file)

    @staticmethod
    def get_certificates(application):
        """Lấy danh sách chứng chỉ của hồ sơ giảng viên."""
        return InstructorCertificateRepository.get_certificates_by_application(application)

    @staticmethod
    def delete_certificate(application, certificate_id):
        """Xóa chứng chỉ của hồ sơ giảng viên."""
        InstructorCertificateRepository.delete_certificate(application, certificate_id)

    @staticmethod
    def get_certificate_by_id(application, certificate_id):
        """Lấy chi tiết một chứng chỉ theo ID."""
        return InstructorCertificateRepository.get_certificate_by_id(application, certificate_id)

    @staticmethod
    def _authenticate_request(request):
        """
        Xác thực user từ request: ưu tiên Authorization header, fallback refresh token cookie.
        Trả về user nếu xác thực thành công, None nếu thất bại.
        """
        # Thử xác thực bằng Authorization header (JWT access token)
        try:
            jwt_auth = JWTAuthentication()
            result = jwt_auth.authenticate(request)
            if result is not None:
                return result[0]
        except Exception:
            pass

        # Fallback: xác thực bằng refresh token từ cookie
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

    @staticmethod
    def check_application_access(application, request_user, permission_code="user.instructor.view"):
        """
        Kiểm tra quyền truy cập hồ sơ: admin (có permission) hoặc chủ sở hữu (theo email).
        Trả về True nếu có quyền, False nếu không.
        """
        # Tạo một view tạm để kiểm tra permission
        class TempView:
            required_permission = permission_code
            permission_classes = []

        perm_checker = HasRequiredPermission()
        temp_view = TempView()

        # Kiểm tra permission bằng cách tạo request ảo
        class FakeRequest:
            user = request_user
            method = "GET"

        is_admin = perm_checker.has_permission(FakeRequest(), temp_view)
        # Kiểm tra chủ sở hữu bằng email (vì application.user có thể null)
        is_owner = request_user.is_authenticated and request_user.email == application.email

        return is_admin or is_owner

    @staticmethod
    def _get_signed_url(file_field):
        """
        Tạo signed URL từ Cloudinary cho file đã upload.
        Dùng type='authenticated' và sign_url=True để tạo URL có chữ ký.
        Tự động xác định resource_type dựa trên extension file.
        """
        public_id = file_field.name

        # Xác định resource_type dựa trên extension
        ext = os.path.splitext(public_id)[1].lower()
        image_exts = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'}
        video_exts = {'.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv', '.wmv'}

        if ext in image_exts:
            resource_type = 'image'
        elif ext in video_exts:
            resource_type = 'video'
        else:
            resource_type = 'raw'

        # Tạo signed URL với type='upload' (file được upload với type này)
        # và sign_url=True để tạo URL có chữ ký (cần thiết nếu tài khoản Cloudinary bật chế độ private)
        signed_url = cloudinary.utils.cloudinary_url(
            public_id,
            resource_type=resource_type,
            type='upload',
            sign_url=True,
            secure=True
        )[0]

        return signed_url

    @staticmethod
    def download_file_from_cloudinary(file_field, default_filename="file"):
        """
        Tải file từ Cloudinary và trả về HttpResponse dạng download.
        - file_field: FileField (có .name)
        - default_filename: tên file mặc định
        Trả về HttpResponse với Content-Disposition: attachment
        """
        filename = file_field.name.split('/')[-1] or default_filename
        signed_url = InstructorService._get_signed_url(file_field)

        # Redirect đến signed URL trên Cloudinary
        response = HttpResponseRedirect(signed_url)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @staticmethod
    def preview_file_from_cloudinary(file_field, default_filename="file"):
        """
        Xem trước file từ Cloudinary và trả về response redirect đến signed URL.
        - file_field: FileField (có .name)
        - default_filename: tên file mặc định
        Trả về redirect đến signed URL trên Cloudinary
        """
        signed_url = InstructorService._get_signed_url(file_field)
        return HttpResponseRedirect(signed_url)

    @staticmethod
    def upload_certificates(application, titles, files):
        """
        Upload nhiều chứng chỉ cùng lúc.
        - titles: list các tên chứng chỉ
        - files: list các file
        Trả về (certificates, errors)
        """
        certificates = []
        errors = []

        for i, file in enumerate(files):
            if not file:
                continue
            title = titles[i].strip() if i < len(titles) else ""
            if not title:
                errors.append(f"Thiếu tên cho file thứ {i + 1}")
                continue

            try:
                certificate = InstructorCertificateRepository.create_certificate(application, title, file)
                certificates.append(certificate)
            except Exception as e:
                errors.append(f"Lỗi khi tải file '{file.name}': {str(e)}")

        return certificates, errors

    @staticmethod
    def process_upload_request(application, request):
        """
        Xử lý request upload chứng chỉ: parse titles/files từ request.data.
        - Hỗ trợ upload 1 file: title="Tên", file=@file.pdf
        - Hỗ trợ upload nhiều file: titles[]="Tên1", files[]=@file1.pdf, ...
        Trả về (certificates, errors) hoặc raise ValidationError.
        """
        titles = request.data.getlist("titles[]") or [request.data.get("title", "")]
        files = request.FILES.getlist("files[]") or ([request.FILES.get("file")] if request.FILES.get("file") else [])

        if not files or not any(files):
            raise DRFValidationError({"detail": "Vui lòng chọn file chứng chỉ."})

        # Đảm bảo số lượng titles và files khớp nhau
        if len(titles) != len(files):
            if len(titles) == 1 and len(files) > 1:
                titles = titles * len(files)
            else:
                raise DRFValidationError({"detail": "Số lượng tên chứng chỉ và file không khớp."})

        return InstructorService.upload_certificates(application, titles, files)
