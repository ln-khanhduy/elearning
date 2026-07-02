"""
Quản lý phân công giảng viên cho khóa học.

COURSE_ADMIN và SUPERADMIN có quyền:
- assign_instructor: gán giảng viên cho khóa học
- change_instructor: thay đổi giảng viên
- remove_instructor: gỡ giảng viên khỏi khóa học
- get_assigned_courses: lấy danh sách khóa học được phân công cho instructor
"""

from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.courses.repositories import course_repository
from apps.courses.services.course_permission_service import can_assign_instructor


def assign_instructor(course_id, instructor_id, requesting_user):
    """
    Gán giảng viên cho khóa học.
    - Chỉ COURSE_ADMIN và SUPERADMIN mới được gán.
    - Instructor phải tồn tại và có role INSTRUCTOR.
    """
    course = course_repository.get_by_id(course_id)

    if not can_assign_instructor(course, requesting_user):
        raise PermissionDenied("Bạn không có quyền phân công giảng viên.")

    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        instructor = User.objects.select_related("role").get(id=instructor_id)
    except User.DoesNotExist:
        raise ValidationError({"instructor_id": "Giảng viên không tồn tại."})

    if not instructor.role or instructor.role.code != "INSTRUCTOR":
        raise ValidationError({"instructor_id": "Người dùng không phải là giảng viên."})

    course.assigned_instructor = instructor
    course.save(update_fields=["assigned_instructor", "updated_at"])
    return course


def change_instructor(course_id, instructor_id, requesting_user):
    """
    Thay đổi giảng viên phụ trách khóa học.
    - Chỉ COURSE_ADMIN và SUPERADMIN mới được thay đổi.
    - Dữ liệu khóa học không bị ảnh hưởng.
    """
    return assign_instructor(course_id, instructor_id, requesting_user)


def remove_instructor(course_id, requesting_user):
    """
    Gỡ giảng viên khỏi khóa học.
    - Chỉ COURSE_ADMIN và SUPERADMIN mới được gỡ.
    - Khóa học vẫn tồn tại, chỉ mất người phụ trách.
    """
    course = course_repository.get_by_id(course_id)

    if not can_assign_instructor(course, requesting_user):
        raise PermissionDenied("Bạn không có quyền gỡ giảng viên.")

    course.assigned_instructor = None
    course.save(update_fields=["assigned_instructor", "updated_at"])
    return course


def get_assigned_courses(instructor):
    """
    Lấy danh sách khóa học được phân công cho một giảng viên.
    Chỉ trả về các khóa học đã publish hoặc hidden (không trả draft).
    """
    from apps.courses.models import Course
    return Course.objects.filter(
        assigned_instructor=instructor
    ).exclude(
        status=Course.Status.DRAFT
    ).select_related(
        "category", "created_by"
    ).order_by("-created_at")