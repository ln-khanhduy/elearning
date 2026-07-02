from apps.enrollments.repositories import enrollment_repository
def get_my_courses(user):
    """Lấy danh sách khóa học đã đăng ký của user hiện tại."""
    return enrollment_repository.get_by_user(user.id)
def get_enrollment_detail(enrollment_id):
    """Lấy chi tiết một đăng ký."""
    return enrollment_repository.get_by_id(enrollment_id)
def check_enrolled(user, course_id):
    """Kiểm tra user đã đăng ký khóa học chưa."""
    return enrollment_repository.get_active_by_user_and_course(user.id, course_id)
