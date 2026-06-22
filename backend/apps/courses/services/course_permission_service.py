"""
CoursePermissionService - Quản lý quyền truy cập khóa học theo mô hình mới.

COURSE_ADMIN và SUPERADMIN: toàn quyền CRUD + publish/hide/archive.
INSTRUCTOR: chỉ xem khóa học được phân công.
STUDENT: chỉ xem khóa học public (PUBLISHED).
"""


class CoursePermissionService:
    """
    Service kiểm tra quyền thao tác với khóa học.
    Thay thế hoàn toàn check_course_owner() cũ.
    """

    @staticmethod
    def can_manage_course(course, user):
        """
        Kiểm tra user có quyền quản lý (CRUD) khóa học không.
        COURSE_ADMIN và SUPERADMIN luôn được phép.
        INSTRUCTOR KHÔNG được phép.
        """
        if not user or not user.is_authenticated:
            return False
        if user.role and user.role.code == "SUPERADMIN":
            return True
        if user.role and user.role.code == "COURSE_ADMIN":
            return True
        return False

    @staticmethod
    def can_view_course(course, user):
        """
        Kiểm tra user có quyền xem nội dung khóa học không.
        - COURSE_ADMIN, SUPERADMIN: xem tất cả
        - INSTRUCTOR: chỉ xem khóa học được phân công
        - STUDENT/public: chỉ xem khóa học PUBLISHED
        """
        if not user or not user.is_authenticated:
            return course.status == "PUBLISHED"

        if user.role and user.role.code == "SUPERADMIN":
            return True
        if user.role and user.role.code == "COURSE_ADMIN":
            return True
        if user.role and user.role.code == "INSTRUCTOR":
            return course.assigned_instructor_id == user.id or course.status == "PUBLISHED"
        return course.status == "PUBLISHED"

    @staticmethod
    def can_publish_course(course, user):
        """
        Kiểm tra user có quyền publish/hide/archive khóa học không.
        Chỉ COURSE_ADMIN và SUPERADMIN.
        """
        return CoursePermissionService.can_manage_course(course, user)

    @staticmethod
    def can_assign_instructor(course, user):
        """
        Kiểm tra user có quyền phân công giảng viên không.
        Chỉ COURSE_ADMIN và SUPERADMIN.
        """
        return CoursePermissionService.can_manage_course(course, user)

    @staticmethod
    def can_view_assigned_courses(user):
        """
        Kiểm tra user có quyền xem danh sách khóa học được phân công không.
        INSTRUCTOR, COURSE_ADMIN, SUPERADMIN đều được.
        """
        if not user or not user.is_authenticated:
            return False
        if user.role and user.role.code in ("SUPERADMIN", "COURSE_ADMIN", "INSTRUCTOR"):
            return True
        return False
