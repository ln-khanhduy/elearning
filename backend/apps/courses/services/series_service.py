"""- Quản lý phiên bản khóa học (Course Series)"""
from django.db.models import Max
from django.utils.text import slugify
from rest_framework.exceptions import NotFound, PermissionDenied

from apps.courses.models import Course, CourseSeries, CourseSeriesItem, CourseAccessPlan
from apps.courses.services.course_permission_service import can_manage_course


def _get_series(series_id):
    series = CourseSeries.objects.filter(id=series_id).first()
    if not series:
        raise NotFound("Không tìm thấy phiên bản khóa học.")
    return series


def list_series(user):
    """Danh sách các phiên bản khóa học (Course Series) đang hoạt động."""
    return CourseSeries.objects.filter(status=CourseSeries.Status.ACTIVE).order_by("name")


def create_series(user, name):
    """Tạo phiên bản mới (gom phiên bản khóa học)."""
    slug = slugify(name)
    counter = 1
    while CourseSeries.objects.filter(slug=slug).exists():
        slug = f"{slugify(name)}-{counter}"
        counter += 1
    return CourseSeries.objects.create(name=name, slug=slug)


def create_version(user, series_id, course):
    """Tạo phiên bản mới từ khóa có sẵn - clone thông tin cơ bản + nối vào series."""
    series = _get_series(series_id)
    if not can_manage_course(course, user):
        raise PermissionDenied("Bạn không có quyền tạo phiên bản khóa học.")

    # Clone thông tin cơ bản của khóa học cũ sang khóa học mới (tạo slug mới)
    base_slug = slugify(course.title)
    slug = base_slug
    counter = 2
    while Course.objects.filter(slug=slug).exists():
        slug = f"{base_slug}-v{counter}"
        counter += 1

    new_course = Course.objects.create(
        title=course.title,
        slug=slug,
        description=course.description,
        category=course.category,
        thumbnail=course.thumbnail,
        preview_video_url=course.preview_video_url,
        status=Course.Status.DRAFT,
        created_by=user,
        assigned_instructor=course.assigned_instructor,
    )

    # Clone các gói dịch vụ của khóa học cũ - giá riêng điều chỉnh sau
    for p in CourseAccessPlan.objects.filter(course=course):
        CourseAccessPlan.objects.create(
            course=new_course,
            name=p.name,
            duration_days=p.duration_days,
            price=p.price,
        )

    # Nối khóa học mới vào series, tạo version mới (V1, V2, ...)
    last_order = CourseSeriesItem.objects.filter(series=series).aggregate(max_order=Max("order"))["max_order"] or 0
    CourseSeriesItem.objects.create(
        series=series,
        course=new_course,
        version=f"V{last_order + 2}",
        order=last_order + 1,
    )

    return new_course


def publish_and_hide_old(user, course_id):
    """Publish khóa mới + tự động HIDDEN các khóa cũ trong cùng series (BR-4.2)."""
    from apps.courses.services.course_service import publish_course

    course = publish_course(course_id, user)

    # Tìm series chứa khóa học này
    item = CourseSeriesItem.objects.filter(course=course).first()
    if item:
        old_items = CourseSeriesItem.objects.filter(series=item.series).exclude(course=course)
        for old in old_items:
            if old.course.status == Course.Status.PUBLISHED:
                old.course.status = Course.Status.HIDDEN
                old.course.save(update_fields=["status", "updated_at"])
    return course
