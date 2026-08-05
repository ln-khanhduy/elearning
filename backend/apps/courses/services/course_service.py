from django.utils import timezone
from django.utils.text import slugify
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.courses.models import Course
from apps.courses.repositories import course_repository
from apps.courses.services.course_permission_service import can_manage_course, can_publish_course


def search_courses(keyword=None, status_value=None, category_id=None, instructor_id=None):
    """Tìm kiếm khóa học theo từ khóa, trạng thái, danh mục và giảng viên."""
    return course_repository.search(keyword, status_value, category_id, instructor_id)


def get_course_detail(course_id):
    """Lấy chi tiết khóa học theo ID."""
    return course_repository.get_by_id(course_id)


def create_course(user, validated_data):
    """Tạo mới một khóa học ở trạng thái nháp (DRAFT).

    - Gán user hiện tại làm người tạo khóa học.
    - Tự sinh slug duy nhất từ tiêu đề (thêm hậu tố -1, -2... nếu trùng).
    - Trạng thái khóa học được đặt mặc định là DRAFT.
    """
    validated_data["created_by"] = user
    base_slug = slugify(validated_data["title"])
    slug = base_slug
    counter = 1
    from apps.courses.models import Course
    while Course.objects.filter(slug=slug).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1
    validated_data["slug"] = slug
    validated_data["status"] = Course.Status.DRAFT
    return course_repository.create(validated_data)


def update_course(course_id, user, validated_data):
    """Cập nhật thông tin khóa học.

    - Kiểm tra quyền quản lý khóa học của user, nếu không có quyền sẽ báo lỗi PermissionDenied.
    - Cập nhật các trường trong validated_data.
    - Tự sinh lại slug từ tiêu đề nếu tiêu đề được thay đổi.
    """
    course = course_repository.get_by_id(course_id)
    if not can_manage_course(course, user):
        raise PermissionDenied("Bạn không có quyền sửa khóa học này.")
    for key, value in validated_data.items():
        setattr(course, key, value)
    if "title" in validated_data:
        course.slug = slugify(validated_data["title"])
    course.save()
    return course


def delete_course(course_id, user):
    """Xóa khóa học.

    - Kiểm tra quyền quản lý khóa học của user, nếu không có quyền sẽ báo lỗi PermissionDenied.
    - Không cho phép xóa khóa học đã xuất bản (PUBLISHED), báo lỗi ValidationError.
    """
    course = course_repository.get_by_id(course_id)
    if not can_manage_course(course, user):
        raise PermissionDenied("Bạn không có quyền xóa khóa học này.")
    if course.status == Course.Status.PUBLISHED:
        raise ValidationError({"status": "Không thể xóa khóa học đã xuất bản. Vui lòng ẩn trước khi xóa."})
    course.delete()


def publish_course(course_id, user):
    """Xuất bản khóa học (chuyển trạng thái sang PUBLISHED).

    - Kiểm tra quyền xuất bản khóa học của user, nếu không có quyền sẽ báo lỗi PermissionDenied.
    - Chỉ khóa học ở trạng thái DRAFT hoặc HIDDEN mới được xuất bản, ngược lại báo lỗi ValidationError.
    - Thiết lập thời gian xuất bản published_at là thời điểm hiện tại.
    """
    course = course_repository.get_by_id(course_id)
    if not can_publish_course(course, user):
        raise PermissionDenied("Bạn không có quyền public khóa học này.")
    if course.status not in [Course.Status.DRAFT, Course.Status.HIDDEN]:
        raise ValidationError({"status": "Chỉ khóa học ở trạng thái DRAFT hoặc HIDDEN mới được public."})
    course.status = Course.Status.PUBLISHED
    course.published_at = timezone.now()
    course.save(update_fields=["status", "published_at", "updated_at"])
    return course


def hide_course(course_id, user):
    """Ẩn khóa học (chuyển trạng thái sang HIDDEN).

    - Kiểm tra quyền xuất bản khóa học của user, nếu không có quyền sẽ báo lỗi PermissionDenied.
    - Chỉ khóa học đã xuất bản (PUBLISHED) mới có thể ẩn, ngược lại báo lỗi ValidationError.
    """
    course = course_repository.get_by_id(course_id)
    if not can_publish_course(course, user):
        raise PermissionDenied("Bạn không có quyền ẩn khóa học này.")
    if course.status != Course.Status.PUBLISHED:
        raise ValidationError({"status": "Chỉ khóa học đã public mới có thể ẩn."})
    course.status = Course.Status.HIDDEN
    course.save(update_fields=["status", "updated_at"])
    return course