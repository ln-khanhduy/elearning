from rest_framework.exceptions import NotFound
from apps.enrollments.models import Enrollment


class EnrollmentRepository:
    """Repository quản lý truy vấn Enrollment."""

    @staticmethod
    def get_by_user(user_id):
        """Lấy danh sách enrollment của một user (kèm course)."""
        return Enrollment.objects.select_related("course", "course__instructor").filter(
            student_id=user_id
        ).exclude(status="CANCELLED").order_by("-created_at")

    @staticmethod
    def get_by_id(enrollment_id):
        """Lấy enrollment theo ID, trả về 404 nếu không tìm thấy."""
        enrollment = Enrollment.objects.select_related("course", "student").filter(id=enrollment_id).first()
        if not enrollment:
            raise NotFound("Không tìm thấy đăng ký khóa học.")
        return enrollment

    @staticmethod
    def get_active_by_user_and_course(user_id, course_id):
        """Kiểm tra user đã đăng ký khóa học chưa (ACTIVE hoặc COMPLETED)."""
        return Enrollment.objects.filter(
            student_id=user_id, course_id=course_id,
            status__in=["ACTIVE", "COMPLETED"]
        ).first()


    @staticmethod
    def create(data):
        """Tạo enrollment mới."""
        return Enrollment.objects.create(**data)
