from django.db.models import Count, Subquery, OuterRef, Q, Prefetch
from rest_framework.exceptions import NotFound
from apps.courses.models import Course
from apps.lessons.models import Chapter, Lesson
from apps.enrollments.models import Enrollment
from apps.common.cache_utils import cached, invalidate_cache


def _base_queryset():
    """Base queryset with select_related for common FK fields."""
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
    """Annotate chapter_count, lesson_count, student_count."""
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
            filter=Q(enrollments__status=Enrollment.Status.ACTIVE),
        ),
    )


def get_all():
    """Get all courses with counts."""
    return _annotate_counts(
        _base_queryset()
        .exclude(status="ARCHIVED")
        .order_by("-created_at")
    )


def get_published():
    """Get published courses."""
    return _annotate_counts(
        _base_queryset()
        .filter(status=Course.Status.PUBLISHED)
        .order_by("-created_at")
    )


def get_by_id(course_id):
    """Get course detail by ID. Returns 404 if not found."""
    course = _base_queryset().filter(id=course_id).first()
    if not course:
        raise NotFound("Không tìm thấy khóa học.")
    return course


def create(data):
    """Create a new course."""
    invalidate_cache("courses:all")
    invalidate_cache("courses:published")
    return Course.objects.create(**data)


def search(keyword=None, status_value=None, category_id=None, instructor_id=None, assigned_instructor_id=None):
    """
    Search courses by keyword, filter by status and category.
    - keyword: case-insensitive search in title
    - status_value: filter by status
    - category_id: filter by category
    - instructor_id: filter by instructor
    - assigned_instructor_id: filter by assigned instructor
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

    if assigned_instructor_id:
        listcourse = listcourse.filter(assigned_instructor_id=assigned_instructor_id)

    return listcourse


def exists_by_id(course_id):
    """Check if course exists by ID."""
    return Course.objects.filter(id=course_id).exists()


def get_by_instructor(instructor_id):
    """Get courses by instructor with counts."""
    return _annotate_counts(
        _base_queryset()
        .filter(assigned_instructor_id=instructor_id)
        .exclude(status="ARCHIVED")
        .order_by("-created_at")
    )


def count_chapters(course_id):
    """Count chapters of a course."""
    return Chapter.objects.filter(course_id=course_id).count()


def count_lessons(course_id):
    """Count lessons of a course."""
    return Lesson.objects.filter(chapter__course_id=course_id).count()


def count_students(course_id):
    """Count active students of a course."""
    return Enrollment.objects.filter(course_id=course_id, status=Enrollment.Status.ACTIVE).count()