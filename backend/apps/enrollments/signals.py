"""
Signals cho tự động hóa enrollments bổ sung xử lý tự động sau các sự kiện.
"""

import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.enrollments.models import LessonProgress, CourseProgress
from apps.notifications.services import automation_service

logger = logging.getLogger(__name__)


@receiver(post_save, sender=LessonProgress)
def on_lesson_progress_saved(sender, instance, created, **kwargs):
    """
    Khi LessonProgress được save, kiểm tra:
    1. Nếu đã hoàn thành tất cả bài học → tự động complete course + cấp certificate
    2. Nếu đạt milestone → gửi notification chúc mừng
    
    Đây là cốt lõi của tự động hóa: biến việc học viên phải tự nhấn nút 
    "Hoàn thành khóa học" thành tự động hoàn toàn.
    """
    if not instance.completed:
        return

    enrollment = instance.enrollment
    if not enrollment:
        return

    course = enrollment.course if hasattr(enrollment, 'course') else None
    
    # Lấy hoặc tạo CourseProgress
    from apps.enrollments.repositories import enrollment_repository
    
    try:
        progress = enrollment_repository.get_or_create_course_progress(enrollment)
        old_progress = float(progress.progress_percent)
        
        # Tính lại progress dựa trên lesson_progress hiện tại
        chapters = course.chapters.all() if course else []
        chapter_ids = [ch.id for ch in chapters]
        total = sum(ch.lessons.count() for ch in chapters) if course else 0
        completed_count = enrollment_repository.count_completed_lessons(enrollment.id, chapter_ids)
        
        if total > 0:
            new_progress_pct = round((completed_count / total * 100), 2)
            progress.completed_lessons_count = completed_count
            progress.total_lessons_count = total
            progress.progress_percent = new_progress_pct
            progress.last_activity_at = instance.completed_at
            if not progress.started_at:
                progress.started_at = instance.completed_at
            progress.save()
            
            course_title = course.title if course else 'Khóa học'
            
            # 1. Kiểm tra milestone
            from apps.notifications.services.automation_service import check_and_celebrate_milestone
            check_and_celebrate_milestone(enrollment, progress, course_title, old_progress)
            
            # 2. Tự động hoàn thành khóa học nếu đạt 100%
            if completed_count >= total and enrollment.status != 'COMPLETED':
                from apps.notifications.services.automation_service import auto_complete_course
                result = auto_complete_course(enrollment, progress)
                if result:
                    logger.info(
                        f"🎉 Tự động hoàn thành khóa học cho user {enrollment.student_id}: "
                        f"course={course_title}, certificate={result.get('certificate_code')}"
                    )
                    
    except Exception as e:
        logger.error(f"Lỗi xử lý automation signal: {e}")


@receiver(post_save, sender=CourseProgress)
def on_course_progress_saved(sender, instance, **kwargs):
    """
    Khi CourseProgress được update, cập nhật last_activity_at 
    để phục vụ tính năng nhắc nhở học viên vắng mặt.
    """
    try:
        enrollment = instance.enrollment
        if enrollment and enrollment.status == 'ACTIVE':
            if instance.last_activity_at:
                enrollment.save(update_fields=['updated_at'])
    except Exception as e:
        logger.error(f"Lỗi update activity tracking: {e}")