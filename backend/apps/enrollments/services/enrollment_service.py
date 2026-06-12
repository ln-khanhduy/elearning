from apps.enrollments.repositories.enrollment_repository import EnrollmentRepository


class EnrollmentService:
    """Service quản lý đăng ký khóa học."""

    @staticmethod
    def get_my_courses(user):
        """Lấy danh sách khóa học đã đăng ký của user hiện tại."""
        return EnrollmentRepository.get_by_user(user.id)

    @staticmethod
    def get_enrollment_detail(enrollment_id):
        """Lấy chi tiết một đăng ký."""
        return EnrollmentRepository.get_by_id(enrollment_id)

    @staticmethod
    def check_enrolled(user, course_id):
        """Kiểm tra user đã đăng ký khóa học chưa."""
        return EnrollmentRepository.get_active_by_user_and_course(user.id, course_id)
