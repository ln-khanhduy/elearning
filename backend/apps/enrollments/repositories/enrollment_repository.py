from rest_framework.exceptions import NotFound
from apps.enrollments.models import Enrollment

def get_by_user(user_id):
    """Lấy danh sách enrollment của một user (kèm course)."""
    return Enrollment.objects.select_related("course", "course__assigned_instructor").filter(
        student_id=user_id
    ).exclude(status=Enrollment.Status.CANCELLED).order_by("-created_at")
def get_by_id(enrollment_id):
    """Lấy enrollment theo ID, trả về 404 nếu không tìm thấy."""
    enrollment = Enrollment.objects.select_related("course", "student").filter(id=enrollment_id).first()
    if not enrollment:
        raise NotFound("Không tìm thấy đăng ký khóa học.")
    return enrollment
def get_active_by_user_and_course(user_id, course_id):
    """Kiểm tra user đã đăng ký khóa học chưa (ACTIVE hoặc COMPLETED)."""
    return Enrollment.objects.filter(
        student_id=user_id, course_id=course_id,
        status__in=[Enrollment.Status.ACTIVE, Enrollment.Status.COMPLETED]
    ).first()
def create(data):
    """Tạo enrollment mới."""
    return Enrollment.objects.create(**data)
