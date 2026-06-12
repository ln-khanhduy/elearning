import os
import cloudinary
from django.db import IntegrityError, transaction
from django.http import HttpResponseRedirect
from django.utils import timezone
from rest_framework.exceptions import ValidationError as DRFValidationError
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken

from apps.common.permissions import HasRequiredPermission
from apps.system.services.admin_log_service import AdminLogService
from apps.users.repositories.user_repository import UserRepository, InstructorRepository, InstructorCertificateRepository
from apps.users.utils.cookies import REFRESH_COOKIE_NAME
from apps.users.services.google_oauth_service import GoogleOAuthService



ROLE_HIERARCHY = {
    "SUPERADMIN": 0,
    "COURSE_ADMIN": 1,
    "INSTRUCTOR_MANAGER": 1,
    "USER_MANAGER": 1,
    "FINANCE_ADMIN": 1,
    "INSTRUCTOR": 2,
    "STUDENT": 3,
}


class UserService:
    """Service quản lý người dùng - danh sách, chi tiết, khóa/mở khóa, đổi mật khẩu, cập nhật hồ sơ."""

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
        - Cập nhật trạng thái tài khoản thành LOCKED kèm lý do và thời gian
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

        user.account_status = "LOCKED"
        user.account_status_reason = reason
        user.account_status_changed_at = timezone.now()
        user.account_status_changed_by = admin_user
        user.save()
        return user

    @staticmethod
    def unlock_user(user_id, admin_user):
        """
        Mở khóa tài khoản người dùng.
        - Đặt lại trạng thái tài khoản thành ACTIVE
        - Xóa lý do khóa và cập nhật thời gian/người thực hiện
        """
        user = UserRepository.get_user_by_id(user_id)
        user.account_status = "ACTIVE"
        user.account_status_reason = ""
        user.account_status_changed_at = timezone.now()
        user.account_status_changed_by = admin_user
        user.save()
        return user

    @staticmethod
    def update_profile(user, validated_data):
        """
        Cập nhật thông tin cá nhân của người dùng.
        - Duyệt qua các trường được gửi lên và gán giá trị mới
        - Lưu thay đổi vào database
        """
        for attr, value in validated_data.items():
            setattr(user, attr, value)
        user.save()
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
    """Service quản lý hồ sơ đăng ký giảng viên - nộp đơn, xem hồ sơ, duyệt/từ chối, chứng chỉ, tải file."""
    # TODO: Tách InstructorService thành Application/Certificate/File service khi refactor lớn.

    @staticmethod
    @transaction.atomic
    def apply(user, validated_data):
        """
        Xử lý đăng ký trở thành giảng viên.
        - Kiểm tra tài khoản không bị khóa
        - Kiểm tra user đã liên kết Google Account chưa
        - Nếu user đã có hồ sơ PENDING hoặc APPROVED: báo lỗi
        - Nếu user đã có hồ sơ REJECTED: cập nhật lại hồ sơ cũ thành PENDING
        - Nếu user chưa có hồ sơ: tạo mới (bọc transaction để tránh race condition)
        """
        # Kiểm tra tài khoản không bị khóa
        if user.account_status != "ACTIVE":
            raise DRFValidationError({
                "detail": "Tài khoản của bạn đang bị khóa hoặc tạm ngừng."
            })

        # Kiểm tra user đã liên kết Google Account chưa
        if not user.google_email:
            raise DRFValidationError(
                {"detail": "Vui lòng liên kết Google Account trước khi đăng ký giảng viên."}
            )

        existing = InstructorRepository.get_application_by_user(user)
        if existing:
            if existing.status == "PENDING":
                raise DRFValidationError({"detail": "Bạn đã gửi hồ sơ đăng ký giảng viên và đang chờ xét duyệt."})
            if existing.status == "APPROVED":
                raise DRFValidationError({"detail": "Bạn đã là giảng viên. Không thể gửi lại hồ sơ."})
            # Nếu REJECTED: cập nhật lại hồ sơ cũ
            for attr, value in validated_data.items():
                setattr(existing, attr, value)
            existing.status = "PENDING"
            existing.rejection_reason = None
            existing.reviewed_by = None
            existing.reviewed_at = None
            existing.save()
            return existing

        try:
            profile = InstructorRepository.create_application(user, validated_data)
            return profile
        except IntegrityError:
            raise DRFValidationError({
                "detail": "Bạn đã gửi hồ sơ giảng viên rồi."
            })


    @staticmethod
    def get_my_application(user):
        """Lấy hồ sơ đăng ký giảng viên của user hiện tại (ủy quyền cho Repository truy vấn)."""
        return InstructorRepository.get_application_by_user(user)

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
    def review_application(application_id, admin_user, review_status, rejection_reason=None):
        """
        Xét duyệt hồ sơ đăng ký giảng viên.
        - Kiểm tra hồ sơ đang ở trạng thái PENDING (chưa được xử lý)
        - Nếu DUYỆT: chuyển role user thành INSTRUCTOR, xóa lý do từ chối
        - Nếu TỪ CHỐI: ghi lại lý do từ chối, không thay đổi role
        - Cập nhật người duyệt và thời gian duyệt
        """
        application = InstructorRepository.get_application_by_id(application_id)

        if application.status != "PENDING":
            raise DRFValidationError({"detail": "Hồ sơ này đã được xử lý."})

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
        Kiểm tra quyền truy cập hồ sơ: admin (có permission) hoặc chủ sở hữu.
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
        is_owner = application.user == request_user

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