"""
Repository extensions for automation features.
Contains additional query methods used by the automation service.
"""

from django.db.models import Count
from django.utils import timezone
from datetime import timedelta

from apps.enrollments.models import Enrollment, CourseProgress, LessonProgress
from apps.lessons.models import Lesson


def get_active_enrollments_with_progress():
    """Lấy tất cả enrollment ACTIVE kèm CourseProgress."""
    return [
        (enrollment, progress)
        for enrollment in Enrollment.objects.select_related(
            'student', 'course'
        ).filter(
            status=Enrollment.Status.ACTIVE
        ).prefetch_related('progress')
        for progress in [getattr(enrollment, 'progress', None)]
        if progress and hasattr(enrollment, 'progress')
    ]


def get_active_enrollments_with_recent_activity(days=30):
    """
    Lấy enrollment ACTIVE có activity trong vòng `days` ngày.
    """
    cutoff = timezone.now() - timedelta(days=days)
    return Enrollment.objects.select_related(
        'student', 'course'
    ).filter(
        status=Enrollment.Status.ACTIVE,
        progress__last_activity_at__gte=cutoff,
    ).distinct()


def get_completed_enrollments():
    """Lấy tất cả enrollment COMPLETED."""
    return Enrollment.objects.select_related(
        'student', 'course'
    ).filter(status=Enrollment.Status.COMPLETED)


def count_lessons_completed_in_range(enrollment_id, start_date, end_date):
    """Đếm số lesson hoàn thành trong khoảng thời gian."""
    return LessonProgress.objects.filter(
        enrollment_id=enrollment_id,
        completed=True,
        completed_at__gte=start_date,
        completed_at__lte=end_date,
    ).count()


def get_total_lessons_for_course(course_id):
    """Đếm tổng số lesson PUBLISHED của một course."""
    return Lesson.objects.filter(
        chapter__course_id=course_id,
        status=Lesson.Status.PUBLISHED,
    ).count()