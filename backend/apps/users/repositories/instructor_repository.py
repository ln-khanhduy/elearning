from django.utils import timezone
from django.shortcuts import get_object_or_404
from apps.users.models import InstructorProfile, InstructorCertificate


class InstructorRepository:
    """Repository quản lý hồ sơ đăng ký giảng viên."""

    @staticmethod
    def update_last_login(user):
        """Cập nhật thời gian đăng nhập cuối cùng của user."""
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

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
    """Repository quản lý chứng chỉ của giảng viên."""

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
        """Xóa chứng chỉ của hồ sơ giảng viên."""
        certificate = InstructorCertificateRepository.get_certificate_by_id(application, certificate_id)
        certificate.delete()
