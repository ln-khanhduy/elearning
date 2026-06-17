from django.utils import timezone
from django.shortcuts import get_object_or_404
from apps.users.models import User, Role, InstructorProfile, InstructorCertificate



class UserRepository:
    @staticmethod
    def get_all_users():
        """Lấy danh sách tất cả người dùng, kèm thông tin role, sắp xếp theo ngày tham gia mới nhất."""
        return User.objects.select_related("role").all().order_by("-date_joined")

    @staticmethod
    def get_user_by_id(user_id):
        """Lấy thông tin chi tiết của một người dùng theo ID, kèm thông tin role. Trả về 404 nếu không tìm thấy."""
        return get_object_or_404(User.objects.select_related("role"), id=user_id)

    @staticmethod
    def get_role_by_id(role_id):
        """Lấy thông tin role theo ID. Trả về 404 nếu không tìm thấy."""
        return get_object_or_404(Role, id=role_id)

    @staticmethod
    def get_role_by_code(code):
        """Lấy thông tin role theo mã code (VD: 'STUDENT', 'INSTRUCTOR'). Trả về 404 nếu không tìm thấy."""
        return get_object_or_404(Role, code=code)

    @staticmethod
    def get_user_by_google_email(google_email):
        """Lấy user theo google_email. Trả về None nếu không tìm thấy."""
        # Dùng exact lookup vì google_email đã được lower-case trước khi lưu
        return User.objects.filter(google_email=google_email.lower()).first()

    @staticmethod
    def link_google_account(user, google_email):
        """Liên kết Google Account với user. Lưu google_email vào user."""
        user.google_email = google_email
        user.save(update_fields=["google_email"])
        return user

    @staticmethod
    def update_last_login(user):
        """Cập nhật thời gian đăng nhập cuối cùng của user."""
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])


class InstructorRepository:
    @staticmethod
    def get_all_applications(status_filter=None):
        """
        Lấy danh sách tất cả hồ sơ đăng ký giảng viên.
        Có thể lọc theo trạng thái (PENDING, APPROVED, REJECTED) nếu truyền tham số status_filter.
        Kết quả sắp xếp theo thời gian nộp đơn mới nhất.
        """
        qs = InstructorProfile.objects.select_related("user", "user__role", "reviewed_by").all().order_by("-applied_at")
        if status_filter:
            qs = qs.filter(status=status_filter.upper())
        return qs

    @staticmethod
    def get_application_by_id(application_id):
        """Lấy chi tiết một hồ sơ đăng ký giảng viên theo ID, kèm thông tin user và người duyệt. Trả về 404 nếu không tìm thấy."""
        return get_object_or_404(InstructorProfile.objects.select_related("user", "user__role", "reviewed_by"), id=application_id)

    @staticmethod
    def get_application_by_user(user):
        """
        Lấy hồ sơ đăng ký giảng viên của một user cụ thể.
        Trả về None nếu user chưa từng gửi hồ sơ đăng ký.
        """
        try:
            return InstructorProfile.objects.select_related("user", "user__role", "reviewed_by").get(user=user)
        except InstructorProfile.DoesNotExist:
            return None

    @staticmethod
    def create_application(user, validated_data):
        """Tạo một hồ sơ đăng ký giảng viên mới với trạng thái PENDING cho user."""
        return InstructorProfile.objects.create(user=user, status="PENDING", **validated_data)


class InstructorCertificateRepository:
    @staticmethod
    def create_certificate(application, title, file):
        """Tạo chứng chỉ mới cho hồ sơ giảng viên."""
        return InstructorCertificate.objects.create(
            instructor_profile=application,
            title=title,
            file=file,
        )

    @staticmethod
    def get_certificates_by_application(application):
        """Lấy danh sách chứng chỉ của hồ sơ giảng viên, sắp xếp theo thời gian upload mới nhất."""
        return InstructorCertificate.objects.filter(instructor_profile=application).order_by("-uploaded_at")

    @staticmethod
    def get_certificate_by_id(application, certificate_id):
        """Lấy chứng chỉ theo ID, kiểm tra thuộc hồ sơ. Trả về 404 nếu không tìm thấy."""
        return get_object_or_404(
            InstructorCertificate,
            id=certificate_id,
            instructor_profile=application,
        )

    @staticmethod
    def delete_certificate(application, certificate_id):

        """Xóa chứng chỉ của hồ sơ giảng viên. Trả về 404 nếu không tìm thấy."""
        certificate = get_object_or_404(
            InstructorCertificate,
            id=certificate_id,
            instructor_profile=application,
        )
        certificate.file.delete()  # Xóa file trên Cloudinary
        certificate.delete()


