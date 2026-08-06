from django.db.models import Count, Subquery, OuterRef, Q
from rest_framework.exceptions import NotFound
from apps.courses.models import Course
from apps.lessons.models import Chapter, Lesson
from apps.enrollments.models import Enrollment
from apps.common.cache_utils import invalidate_cache


def _base_queryset():
    """Base queryset với select_related cho các trường khóa ngoại thông dụng."""
    return Course.objects.select_related(
        "created_by", "assigned_instructor", "category"
    ).only(
        "id", "title", "slug", "description", "price", "status",
        "thumbnail", "preview_video_url", "published_at",
        "created_at", "updated_at",
        "created_by__id", "created_by__email", "created_by__first_name", "created_by__last_name",
        "assigned_instructor__id", "assigned_instructor__email",
        "assigned_instructor__first_name", "assigned_instructor__last_name",
        "category__id", "category__name", "category__slug",
    )


def _annotate_counts(qs):
    """Ghi chú chapter_count, lesson_count, student_count."""
    return qs.annotate(
        _chapter_count=Count("chapters", distinct=True),
        _lesson_count=Subquery(
            Lesson.objects.filter(chapter__course=OuterRef("id"))
            .values("chapter__course")
            .annotate(cnt=Count("id"))
            .values("cnt")[:1]
        ),
        _student_count=Count(
            "enrollments",
            filter=Q(enrollments__status__in=[
                Enrollment.Status.ACTIVE,
                Enrollment.Status.COMPLETED,
            ]),
            distinct=True,
        ),
    )


def get_all():
    """Lấy tất cả khóa học kèm số liệu thống kê."""
    return _annotate_counts(
        _base_queryset()
        .exclude(status="ARCHIVED")
        .order_by("-created_at")
    )


def get_published():
    """Lấy các khóa học đã xuất bản."""
    return _annotate_counts(
        _base_queryset()
        .filter(status=Course.Status.PUBLISHED)
        .order_by("-created_at")
    )


def get_by_id(course_id):
    """Lấy chi tiết khóa học theo ID. Trả về 404 nếu không tìm thấy."""
    course = _base_queryset().filter(id=course_id).first()
    if not course:
        raise NotFound("Không tìm thấy khóa học.")
    return course


def get_cartable_by_ids(course_ids):
    """Lấy các khóa học đã xuất bản, có phí (>0) theo danh sách ID (dùng cho thanh toán giỏ hàng)."""
    return Course.objects.filter(
        id__in=course_ids,
        status=Course.Status.PUBLISHED,
        price__gt=0,
    )


def create(data):
    """Tạo mới một khóa học."""
    invalidate_cache("courses:all")
    invalidate_cache("courses:published")
    return Course.objects.create(**data)


def search(keyword=None, status_value=None, category_id=None, instructor_id=None):
    """
    Tìm kiếm khóa học theo từ khóa, lọc theo trạng thái và danh mục.
    - keyword: tìm kiếm không phân biệt hoa thường trong tiêu đề
    - status_value: lọc theo trạng thái
    - category_id: lọc theo danh mục
    - instructor_id: lọc theo giảng viên
    """
    listcourse = get_all()

    if keyword:
        listcourse = listcourse.filter(title__icontains=keyword)

    if status_value:
        listcourse = listcourse.filter(status=status_value)

    if category_id:
        listcourse = listcourse.filter(category_id=category_id)

    if instructor_id:
        listcourse = listcourse.filter(assigned_instructor_id=instructor_id)

    return listcourse


def exists_by_id(course_id):
    """Kiểm tra khóa học có tồn tại theo ID hay không."""
    return Course.objects.filter(id=course_id).exists()


def get_by_instructor(instructor_id):
    """Lấy các khóa học theo giảng viên kèm số liệu thống kê."""
    return _annotate_counts(
        _base_queryset()
        .filter(assigned_instructor_id=instructor_id)
        .exclude(status="ARCHIVED")
        .order_by("-created_at")
    )


def count_chapters(course_id):
    """Đếm số chương của một khóa học."""
    return Chapter.objects.filter(course_id=course_id).count()


def count_lessons(course_id):
    """Đếm số bài học của một khóa học."""
    return Lesson.objects.filter(chapter__course_id=course_id).count()


def count_students(course_id):
    """Đếm số học viên đang hoạt động của một khóa học."""
    return Enrollment.objects.filter(course_id=course_id, status=Enrollment.Status.ACTIVE).count()