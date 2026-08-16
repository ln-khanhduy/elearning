from django.db import models
from django.utils import timezone
from rest_framework.exceptions import NotFound
from apps.enrollments.models import Enrollment, LessonProgress, CourseProgress


def get_by_user(user_id):
    """Lấy danh sách enrollment của một user (kèm course)."""
    return Enrollment.objects.select_related("course", "course__assigned_instructor").filter(
        student_id=user_id
    ).order_by("-created_at")


def get_by_id(enrollment_id):
    """Lấy enrollment theo ID, trả về 404 nếu không tìm thấy."""
    enrollment = Enrollment.objects.select_related("course", "student").filter(id=enrollment_id).first()
    if not enrollment:
        raise NotFound("Không tìm thấy đăng ký khóa học.")
    return enrollment


def get_active_by_user_and_course(user_id, course_id):
    """
    (R2) Kiểm tra user đã đăng ký khóa học và CÒN HẠN chưa.
    - Chỉ trả về enrollment ACTIVE/COMPLETED còn hạn (expires_at > now hoặc expires_at null).
    - Hết hạn/EXPIRED → coi như chưa enroll (trả None).
    """
    now = timezone.now()
    return Enrollment.objects.filter(
        student_id=user_id, course_id=course_id,
        status__in=[Enrollment.Status.ACTIVE, Enrollment.Status.COMPLETED],
    ).filter(
        models.Q(expires_at__isnull=True) | models.Q(expires_at__gt=now)
    ).order_by("-created_at").first()


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
    """
    (R2) Tạo ENROLLMENT MỚI mỗi lần mua (không dùng get_or_create vì đã bỏ
    unique (student, course)). Hàm này giữ tên cũ cho tương thích service hiện tại.
    """
    return Enrollment.objects.create(**(defaults or {}) | {"student": student, "course": course})


def find_active_or_completed(student, course):
    """
    (R2) Kiểm tra user đã enroll course chưa và CÒN HẠN.
    - EXPIRED hoặc expires_at <= now → trả None (cho phép mua lại).
    """
    now = timezone.now()
    return Enrollment.objects.filter(
        student=student,
        course=course,
        status__in=[Enrollment.Status.ACTIVE, Enrollment.Status.COMPLETED],
    ).filter(
        models.Q(expires_at__isnull=True) | models.Q(expires_at__gt=now)
    ).order_by("-created_at").first()


def is_expired(enrollment):
    """
    (R2) Kiểm tra enrollment đã hết hạn chưa.
    - Nếu expires_at null (không giới hạn) → chưa hết hạn.
    - Nếu expires_at <= now → hết hạn.
    """
    if not enrollment:
        return False
    if enrollment.expires_at is None:
        return False
    return enrollment.expires_at <= timezone.now()


def mark_expired(enrollment):
    """(R2) Chuyển enrollment sang trạng thái EXPIRED."""
    if enrollment.status != Enrollment.Status.EXPIRED:
        enrollment.status = Enrollment.Status.EXPIRED
        enrollment.save(update_fields=["status", "updated_at"])
    return enrollment


def mark_completed(enrollment):
    """Đánh dấu enrollment là COMPLETED."""
    enrollment.status = "COMPLETED"
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