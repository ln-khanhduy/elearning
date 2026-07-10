import uuid
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
import logging

from apps.enrollments.repositories import enrollment_repository
from apps.courses.repositories import course_repository
from apps.lessons.repositories import chapter_repository, lesson_repository
from apps.lessons.models import Lesson
from apps.quizzes.repositories import quiz_repository
from apps.certificates.repositories import certificate_repository
from apps.certificates.services import certificate_image_service
from apps.notifications import services as notif_service
from apps.enrollments.serializers.learning_serializer import ChapterLearningSerializer


def get_enrollment_or_404(user, course_id):
    """
    Kiểm tra user có quyền truy cập khóa học không.
    - Instructor (được phân công) luôn được truy cập, không cần enrollment.
    - Các user khác cần enrollment ACTIVE/COMPLETED.
    """
    course = course_repository.get_by_id(course_id)
    if course and course.assigned_instructor_id == user.id:
        return None
    enrollment = enrollment_repository.get_active_by_user_and_course(user.id, course_id)
    if not enrollment:
        raise PermissionDenied("Bạn cần đăng ký khóa học trước khi học.")
    return enrollment


def _build_quiz_data(lesson, user, enrollment):
    """Xây dựng quiz cho lesson."""
    quizzes = quiz_repository.get_by_lesson(lesson.id)
    quiz_list = []
    for quiz in quizzes:
        questions = quiz_repository.get_questions_for_quiz(quiz)
        questions_data = []
        for q in questions:
            options = quiz_repository.get_options_for_question(q)
            options_data = [{"id": opt.id, "text": opt.text, "order": opt.order} for opt in options]
            questions_data.append({
                "id": q.id, "prompt": q.prompt, "points": float(q.points),
                "order": q.order, "question_type": q.question_type, "options": options_data,
            })

        latest_attempt = quiz_repository.get_latest_attempt(quiz, user) if enrollment else None

        quiz_list.append({
            "id": quiz.id, "title": quiz.title, "description": quiz.description,
            "time_limit_minutes": quiz.time_limit_minutes, "passing_score": float(quiz.passing_score),
            "quiz_type": quiz.quiz_type, "questions": questions_data,
            "latest_attempt": {
                "score": float(latest_attempt.score) if latest_attempt else None,
                "max_score": float(sum(float(q.points) for q in questions)) if latest_attempt else None,
                "passed": float(latest_attempt.score) >= float(quiz.passing_score) if latest_attempt else None,
                "status": latest_attempt.status if latest_attempt else None,
            } if latest_attempt else None,
        })
    return quiz_list


def get_learning_curriculum(user, course_id):
    """Lấy toàn bộ curriculum cho learning page."""
    course = course_repository.get_by_id(course_id)
    is_owner = course is not None and course.assigned_instructor_id == user.id

    enrollment = None
    is_enrolled = False
    try:
        enrollment = get_enrollment_or_404(user, course_id)
        is_enrolled = True
    except PermissionDenied:
        pass

    chapters = chapter_repository.get_by_course(course_id)
    chapters_list = list(chapters)

    completed_lesson_ids = set()
    if enrollment:
        chapter_ids = [ch.id for ch in chapters_list]
        completed_lesson_ids = enrollment_repository.get_completed_lesson_ids(enrollment.id, chapter_ids)

    result = []
    for chapter in chapters_list:
        # Instructor thấy tất cả lessons, enrolled student thấy tất cả, non-enrolled chỉ thấy PUBLISHED
        if is_owner or is_enrolled:
            lessons = chapter.lessons.all().order_by("order", "id")
        else:
            lessons = chapter.lessons.filter(status=Lesson.Status.PUBLISHED).order_by("order", "id")

        lessons_data = []
        for lesson in lessons:
            is_completed = lesson.id in completed_lesson_ids
            is_locked = not is_enrolled and not is_owner
            quizzes_data = _build_quiz_data(lesson, user, enrollment)

            lessons_data.append({
                "id": lesson.id, "slug": lesson.slug, "title": lesson.title,
                "description": lesson.description, "content_type": lesson.content_type,
                "video_url": lesson.video_url if not is_locked else None,
                "material_url": lesson.material_file.url if lesson.material_file and not is_locked else None,
                "order": lesson.order, "is_locked": is_locked,
                "completed": is_completed, "is_completed": is_completed, "isCompleted": is_completed,
                "quizzes": quizzes_data,
            })

        result.append({
            "id": chapter.id, "title": chapter.title, "description": chapter.description,
            "order": chapter.order, "lessons": lessons_data,
        })

    total_lessons = sum(len(ch["lessons"]) for ch in result)
    completed_count = sum(1 for ch in result for l in ch["lessons"] if l["completed"])
    progress_percent = round((completed_count / total_lessons * 100) if total_lessons > 0 else 0, 2)

    if not enrollment:
        return {
            "enrollment_id": None, "course_id": course_id, "chapters": result,
            "progress": {"completed_lessons_count": 0, "total_lessons_count": total_lessons, "progress_percent": 0, "last_completed_lesson_id": None},
            "course_completed": False, "certificate": None,
        }

    progress = enrollment_repository.get_or_create_course_progress(enrollment)
    progress.completed_lessons_count = completed_count
    progress.total_lessons_count = total_lessons
    progress.progress_percent = progress_percent
    progress.save()

    course_completed = enrollment.status == "COMPLETED" and progress.progress_percent >= 100
    certificate = None
    if course_completed:
        cert = certificate_repository.get_by_enrollment(enrollment)
        if not cert:
            cert = certificate_repository.create(
                user, course_id, enrollment, _generate_certificate_code(user.id, course_id),
            )
        if not cert.image_url:
            try:
                image_url = certificate_image_service.upload(cert)
                if image_url:
                    cert.image_url = image_url
                    cert.save(update_fields=["image_url"])
            except Exception as e:
                
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to generate certificate image for {cert.id}: {e}")
        certificate = {"id": str(cert.id), "certificate_code": cert.certificate_code, "issued_at": cert.issued_at.isoformat(), "image_url": cert.image_url or ""}

    return {
        "enrollment_id": enrollment.id, "course_id": course_id, "chapters": result,
        "progress": {"completed_lessons_count": completed_count, "total_lessons_count": total_lessons, "progress_percent": progress_percent, "last_completed_lesson_id": progress.last_completed_lesson_id},
        "course_completed": course_completed, "certificate": certificate,
    }


def mark_lesson_complete(user, course_id, lesson_id):
    """Đánh dấu bài học đã hoàn thành. Kiểm tra tất cả bài tập đã đạt yêu cầu."""
    enrollment = get_enrollment_or_404(user, course_id)
    lesson = lesson_repository.get_by_id(lesson_id)
    if lesson.chapter.course_id != course_id:
        raise NotFound("Không tìm thấy bài học.")

    # Instructor chỉ xem, không track progress
    if enrollment is None:
        return {
            "lesson_id": lesson_id, "completed": True,
            "completed_lessons_count": 0, "total_lessons_count": 0,
            "progress_percent": 0,
        }

    # Kiểm tra tất cả bài tập đã đạt yêu cầu
    quizzes = quiz_repository.get_by_lesson(lesson.id)
    for quiz in quizzes:
        latest_attempt = quiz_repository.get_latest_attempt(quiz, user)
        if not latest_attempt:
            raise ValidationError("Cần hoàn thành tất cả bài tập trước khi đánh dấu hoàn thành bài học.")
        if latest_attempt.status == "SUBMITTED":
            raise ValidationError("Cần hoàn thành tất cả bài tập trước khi đánh dấu hoàn thành bài học.")
        if float(latest_attempt.score) < float(quiz.passing_score):
            raise ValidationError("Cần hoàn thành tất cả bài tập trước khi đánh dấu hoàn thành bài học.")

    with transaction.atomic():
        lesson_progress, created = enrollment_repository.get_or_create_lesson_progress(enrollment, lesson)
        if not created:
            enrollment_repository.mark_lesson_progress_complete(lesson_progress)

        chapters = chapter_repository.get_by_course(course_id)
        chapter_ids = [ch.id for ch in chapters]
        total = sum(len(lesson_repository.get_by_chapter(ch.id)) for ch in chapters) or Lesson.objects.filter(chapter__course_id=course_id).count()
        completed_count = enrollment_repository.count_completed_lessons(enrollment.id, chapter_ids)
        progress = enrollment_repository.get_or_create_course_progress(enrollment)
        enrollment_repository.update_course_progress(progress, completed_count, total, lesson)

    return {
        "lesson_id": lesson_id, "completed": True,
        "completed_lessons_count": progress.completed_lessons_count,
        "total_lessons_count": progress.total_lessons_count,
        "progress_percent": float(progress.progress_percent),
    }


def complete_course(user, course_id):
    """Hoàn thành khóa học và cấp chứng chỉ."""

    enrollment = get_enrollment_or_404(user, course_id)

    # Instructor không cần complete course
    if enrollment is None:
        return {"course_completed": False, "completed_at": None, "certificate": None}

    progress = enrollment_repository.get_or_create_course_progress(enrollment)
    progress_percent = float(progress.progress_percent)

    if progress_percent < 100:
        raise ValidationError("Bạn cần hoàn thành tất cả bài học trước khi hoàn thành khóa học.")

    if enrollment.status == "COMPLETED":
        certificate = certificate_repository.get_by_enrollment(enrollment)
        if not certificate:
            certificate = certificate_repository.create(
                user, course_id, enrollment, _generate_certificate_code(user.id, course_id),
            )
        if not certificate.image_url:
            try:
                image_url = certificate_image_service.upload(certificate)
                if image_url:
                    certificate.image_url = image_url
                    certificate.save(update_fields=["image_url"])
            except Exception as e:
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to generate certificate image for {certificate.id}: {e}")
        return {"course_completed": True, "completed_at": enrollment.completed_at.isoformat(),
                "certificate": {"id": str(certificate.id), "certificate_code": certificate.certificate_code, "issued_at": certificate.issued_at.isoformat(), "image_url": certificate.image_url or ""}}

    with transaction.atomic():
        enrollment_repository.mark_completed(enrollment)
        progress.completed_at = timezone.now()
        progress.save()
        defaults = {"certificate_code": _generate_certificate_code(user.id, course_id), "pdf_url": "", "image_url": ""}
        certificate, created = certificate_repository.get_or_create(user, course_id, enrollment, defaults)

    if not certificate.image_url:
        try:
            image_url = certificate_image_service.upload(certificate)
            if image_url:
                certificate.image_url = image_url
                certificate.save(update_fields=["image_url"])
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to generate certificate image for {certificate.id}: {e}")

    try:
        course = course_repository.get_by_id(course_id)
        notif_service.notify_course_completed(user, course.title)
    except Exception:
        pass

    return {"course_completed": True, "completed_at": enrollment.completed_at.isoformat(),
            "certificate": {"id": str(certificate.id), "certificate_code": certificate.certificate_code, "issued_at": certificate.issued_at.isoformat(), "image_url": certificate.image_url or ""}}


def _generate_certificate_code(user_id, course_id):
    today = timezone.now().strftime("%y%m%d")
    random_part = uuid.uuid4().hex[:6].upper()
    return f"CERT-{course_id}-{user_id}-{today}-{random_part}"


def submit_quiz(user, course_id, quiz_id, answers):
    """Nộp bài quiz và chấm điểm tự động."""
    quiz = quiz_repository.get_quiz_by_course(quiz_id, course_id)
    if not quiz:
        raise NotFound("Không tìm thấy bài kiểm tra.")

    if quiz_repository.has_essay_questions(quiz):
        if quiz_repository.has_existing_attempt(quiz, user):
            raise ValidationError("Bài tập tự luận chỉ được làm 1 lần.")

    with transaction.atomic():
        attempt = quiz_repository.create_quiz_attempt(user, quiz)
        total_score = 0
        max_score = 0
        results = []

        for answer_data in answers:
            qid = answer_data.get("question_id")
            selected = answer_data.get("selected_option_id")
            text_answer = answer_data.get("answer_text")
            question = quiz_repository.get_question_by_id(qid, quiz)
            if not question:
                continue

            max_score += float(question.points)
            is_correct = False
            score = 0

            if question.question_type == "MCQ" and selected:
                correct = quiz_repository.get_correct_option(question)
                if correct and correct.id == selected:
                    is_correct = True
                    score = float(question.points)
                quiz_repository.create_attempt_answer(attempt, question, selected_option_id=selected, is_correct=is_correct, score=score)

            elif question.question_type == "FILL_BLANK" and text_answer:
                def normalize(s):
                    import re
                    return re.sub(r'\s+', ' ', s.strip().lower())
                
                # Đếm số blank từ prompt để chia điểm
                blank_count = question.prompt.count("{{") if question.prompt else 1
                points_per_blank = float(question.points) / max(blank_count, 1)
                
                user_ans = normalize(text_answer)
                correct_ans = normalize(question.correct_text_answer or "")
                
                # Tách user answer: frontend gửi dạng "value1|value2" hoặc "value1, value2"
                user_raw_parts = user_ans.split("|")
                if len(user_raw_parts) == 1:
                    user_raw_parts = user_raw_parts[0].split(",")
                user_parts = [normalize(p) for p in user_raw_parts if p]
                
                # Tách correct answer: có thể dùng "," hoặc "|" làm separator
                correct_raw_parts = correct_ans.split("|")
                if len(correct_raw_parts) == 1:
                    correct_raw_parts = correct_raw_parts[0].split(",")
                correct_parts = [normalize(p) for p in correct_raw_parts if p]
                
                # Lấy đúng số phần bằng số blank
                user_parts = user_parts[:blank_count]
                correct_parts = correct_parts[:blank_count]
                
                # Chấm từng blank riêng
                matched_blanks = 0
                for i in range(min(len(user_parts), len(correct_parts))):
                    if user_parts[i] == correct_parts[i]:
                        matched_blanks += 1
                
                if matched_blanks > 0:
                    score = points_per_blank * matched_blanks
                    if matched_blanks >= blank_count:
                        is_correct = True
                
                quiz_repository.create_attempt_answer(attempt, question, answer_text=text_answer, is_correct=is_correct, score=score)

            elif question.question_type == "ESSAY":
                quiz_repository.create_attempt_answer(attempt, question, answer_text=text_answer or "", is_correct=False, score=0)

            total_score += score
            results.append({"question_id": qid, "is_correct": is_correct, "score": score, "max_score": float(question.points)})

        attempt.score = total_score
        if quiz_repository.has_essay_questions(quiz):
            attempt.status = "SUBMITTED"
        else:
            attempt.status = "GRADED"
            attempt.graded_at = timezone.now()
        attempt.save()

    return {
        "attempt_id": attempt.id, "score": total_score, "max_score": max_score,
        "passed": total_score >= float(quiz.passing_score), "passing_score": float(quiz.passing_score),
        "results": results, "status": attempt.status,
    }
