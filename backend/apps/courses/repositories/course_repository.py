from django.db.models import Count, Subquery, OuterRef, Q
from rest_framework.exceptions import NotFound
from apps.courses.models import Course
from apps.lessons.models import Chapter, Lesson
from apps.enrollments.models import Enrollment


def _annotate_counts(qs):
    """Annotate chapter_count, lesson_count, student_count để tránh N+1 queries."""
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
    """Lấy danh sách tất cả khóa học, kèm thông tin created_by, assigned_instructor, category và các count."""
    return _annotate_counts(
        Course.objects.select_related("created_by", "assigned_instructor", "category")
        .exclude(status="ARCHIVED")
        .order_by("-created_at")
    )

def get_published():
    """Lấy danh sách khóa học đã PUBLIC, kèm thông tin created_by, assigned_instructor, category và các count."""
    return _annotate_counts(
        Course.objects.select_related("created_by", "assigned_instructor", "category")
        .filter(status=Course.Status.PUBLISHED)
        .order_by("-created_at")
    )

def get_by_id(course_id):
    """Lấy chi tiết một khóa học theo ID, kèm thông tin created_by, assigned_instructor và category. Trả về 404 nếu không tìm thấy."""
    course = Course.objects.select_related("created_by", "assigned_instructor", "category").filter(id=course_id).first()
    if not course:
        raise NotFound("Không tìm thấy khóa học.")
    return course

def create(data):
    """Tạo một khóa học mới với dữ liệu đã được validate."""
    return Course.objects.create(**data)

def search(keyword=None, status_value=None, category_id=None, instructor_id=None, assigned_instructor_id=None):
    """
    Tìm kiếm khóa học theo từ khóa (title), lọc theo trạng thái và danh mục.
    - keyword: tìm kiếm không phân biệt hoa thường trong title
    - status_value: lọc theo trạng thái (draft, published, hidden, archived)
    - category_id: lọc theo danh mục
    - instructor_id: lọc theo instructor (cũ - instructor_id)
    - assigned_instructor_id: lọc theo assigned_instructor (mới)
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
    """Kiểm tra khóa học có tồn tại trong hệ thống hay không dựa trên ID."""
    return Course.objects.filter(id=course_id).exists()
def get_by_instructor(instructor_id):
    """Lấy danh sách khóa học của một instructor (dựa trên assigned_instructor), kèm count."""
    return _annotate_counts(
        Course.objects.select_related("created_by", "assigned_instructor", "category")
        .filter(assigned_instructor_id=instructor_id)
        .exclude(status="ARCHIVED")
        .order_by("-created_at")
    )
def count_chapters(course_id):
    """Đếm số chapter (chapter) của một khóa học."""
    return Chapter.objects.filter(course_id=course_id).count()
def count_lessons(course_id):
    """Đếm số lesson của một khóa học."""
    from apps.lessons.models import Lesson
    return Lesson.objects.filter(chapter__course_id=course_id).count()
def count_students(course_id):
    """Đếm số học viên đang active của một khóa học."""
    from apps.enrollments.models import Enrollment
    return Enrollment.objects.filter(course_id=course_id, status=Enrollment.Status.ACTIVE).count()
