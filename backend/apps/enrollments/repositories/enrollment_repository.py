from rest_framework.exceptions import NotFound
from apps.enrollments.models import Enrollment, LessonProgress, CourseProgress

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


def get_or_create_for_instructor(user, course_id):
    """Tạo hoặc lấy enrollment cho instructor được phân công."""
    enrollment, _ = Enrollment.objects.get_or_create(
        student=user,
        course_id=course_id,
        defaults={"status": "ACTIVE"}
    )
    return enrollment


def get_or_create_enrollment(student, course, defaults=None):
    """Tìm hoặc tạo enrollment (dùng trong payment)."""
    return Enrollment.objects.get_or_create(
        student=student,
        course=course,
        defaults=defaults or {},
    )


def find_active_or_completed(student, course):
    """Kiểm tra user đã enroll course chưa (ACTIVE hoặc COMPLETED)."""
    return Enrollment.objects.filter(
        student=student,
        course=course,
        status__in=[Enrollment.Status.ACTIVE, Enrollment.Status.COMPLETED]
    ).first()


def mark_completed(enrollment):
    """Đánh dấu enrollment là COMPLETED."""
    from django.utils import timezone
    enrollment.status = "COMPLETED"
    enrollment.completed_at = timezone.now()
    enrollment.save()
    return enrollment


# ====== LESSON PROGRESS ======

def get_completed_lesson_ids(enrollment_id, chapter_ids):
    """Lấy danh sách lesson_id đã hoàn thành."""
    return set(
        LessonProgress.objects.filter(
            enrollment_id=enrollment_id,
            lesson__chapter_id__in=chapter_ids,
            completed=True
        ).values_list("lesson_id", flat=True)
    )


def get_or_create_lesson_progress(enrollment, lesson):
    """Tạo hoặc lấy LessonProgress cho 1 bài học."""
    from django.utils import timezone
    lesson_progress, created = LessonProgress.objects.get_or_create(
        enrollment=enrollment,
        lesson=lesson,
        defaults={"completed": True, "completed_at": timezone.now()},
    )
    return lesson_progress, created


def mark_lesson_progress_complete(lesson_progress):
    """Đánh dấu LessonProgress đã hoàn thành."""
    from django.utils import timezone
    if not lesson_progress.completed:
        lesson_progress.completed = True
        lesson_progress.completed_at = timezone.now()
        lesson_progress.save()


def count_completed_lessons(enrollment_id, chapter_ids):
    """Đếm số lesson đã hoàn thành."""
    return LessonProgress.objects.filter(
        enrollment_id=enrollment_id,
        lesson__chapter_id__in=chapter_ids,
        completed=True
    ).count()


# ====== COURSE PROGRESS ======

def get_or_create_course_progress(enrollment, defaults=None):
    """Tạo hoặc lấy CourseProgress với các giá trị mặc định."""
    progress, _ = CourseProgress.objects.get_or_create(
        enrollment=enrollment,
        defaults=defaults or {},
    )
    return progress


def update_course_progress(progress, completed_count, total, lesson, completed_at=None):
    """Cập nhật CourseProgress."""
    from django.utils import timezone
    progress.completed_lessons_count = completed_count
    progress.total_lessons_count = total
    progress.progress_percent = round(
        (completed_count / total * 100) if total > 0 else 0, 2
    )
    progress.last_completed_lesson = lesson
    progress.last_activity_at = timezone.now()
    if not progress.started_at:
        progress.started_at = timezone.now()
    if completed_count >= total:
        progress.completed_at = timezone.now()
    progress.save()
    return progress