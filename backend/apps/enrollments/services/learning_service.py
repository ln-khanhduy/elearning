import uuid
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from apps.enrollments.models import Enrollment, LessonProgress, CourseProgress
from apps.enrollments.repositories import enrollment_repository
from apps.lessons.models import Lesson, Chapter
from apps.quizzes.models import Quiz, QuizAttempt, QuizAttemptAnswer, Question
from apps.certificates.models import CourseCertificate
from apps.certificates.services import certificate_image_service
def get_enrollment_or_404(user, course_id):
    """
    Kiểm tra user có quyền truy cập khóa học không.
    - Instructor (chủ sở hữu) luôn được truy cập.
    - Các user khác cần enrollment ACTIVE/COMPLETED.
    Trả về enrollment nếu có, raise exception nếu không.
    """
    from apps.courses.models import Course
    course = Course.objects.filter(id=course_id).first()
    if course and course.assigned_instructor_id == user.id:
        # Instructor được phân công: tạo/tìm enrollment ảo để tracking progress
        enrollment, _ = Enrollment.objects.get_or_create(
            student=user,
            course_id=course_id,
            defaults={"status": "ACTIVE"}
        )
        return enrollment
    enrollment = enrollment_repository.get_active_by_user_and_course(user.id, course_id)
    if not enrollment:
        raise PermissionDenied("Bạn cần đăng ký khóa học trước khi học.")
    return enrollment
def get_learning_curriculum(user, course_id):
    """
    Lấy toàn bộ curriculum cho learning page.
    - Nếu user đã enroll: trả về full curriculum + progress + completed status
    - Nếu user chưa enroll: tất cả lessons bị khóa (không có nội dung)
    """
    from apps.courses.models import Course
    course = Course.objects.filter(id=course_id).first()
    is_owner = course is not None and course.assigned_instructor_id == user.id

    # Kiểm tra enrollment
    enrollment = None
    is_enrolled = False
    try:
        enrollment = get_enrollment_or_404(user, course_id)
        is_enrolled = True
    except PermissionDenied:
        # User chưa enroll - tất cả lessons đều bị khóa
        pass

    chapters = Chapter.objects.filter(course_id=course_id).order_by("order", "id")

    # Nếu đã enroll, lấy completed lesson IDs
    completed_lesson_ids = set()
    if enrollment:
        completed_lesson_ids = set(
            LessonProgress.objects.filter(
                enrollment=enrollment,
                lesson__chapter__in=chapters,
                completed=True
            ).values_list("lesson_id", flat=True)
        )

    result = []
    for chapter in chapters:
        lessons = Lesson.objects.filter(
            chapter=chapter
        ).order_by("order", "id")

        lessons_data = []
        for lesson in lessons:
            is_completed = lesson.id in completed_lesson_ids

            # Nếu chưa enroll và không phải owner → khóa
            is_locked = not is_enrolled and not is_owner

            lesson_data = {
                "id": lesson.id,
                "slug": lesson.slug,
                "title": lesson.title,
                "description": lesson.description,
                "content_type": lesson.content_type,
                "video_url": lesson.video_url if not is_locked else None,
                "material_url": lesson.material_file.url if lesson.material_file and not is_locked else None,
                "order": lesson.order,
                "is_locked": is_locked,
                "completed": is_completed,
                "is_completed": is_completed,
                "isCompleted": is_completed,
                "quizzes": [],
            }

            # Lấy quizzes cho lesson (không filter status, giống view cũ)
            quizzes = Quiz.objects.filter(lesson=lesson).order_by("created_at")
            quiz_list = []
            for quiz in quizzes:
                questions = quiz.questions.all().order_by("order", "id")
                questions_data = []
                for q in questions:
                    options = q.options.all().order_by("order", "id")
                    options_data = [
                        {"id": opt.id, "text": opt.text, "order": opt.order}
                        for opt in options
                    ]
                    questions_data.append({
                        "id": q.id,
                        "prompt": q.prompt,
                        "points": float(q.points),
                        "order": q.order,
                        "question_type": q.question_type,
                        "options": options_data,
                    })

                # Lấy kết quả bài làm gần nhất của học viên (nếu có)
                latest_attempt = None
                if enrollment:
                    latest_attempt = QuizAttempt.objects.filter(
                        quiz=quiz,
                        student=user,
                        status__in=["SUBMITTED", "GRADED"],
                    ).order_by("-submitted_at").first()

                quiz_list.append({
                    "id": quiz.id,
                    "title": quiz.title,
                    "description": quiz.description,
                    "time_limit_minutes": quiz.time_limit_minutes,
                    "passing_score": float(quiz.passing_score),
                    "quiz_type": quiz.quiz_type,
                    "questions": questions_data,
                    "latest_attempt": {
                        "score": float(latest_attempt.score) if latest_attempt else None,
                        "max_score": float(sum(float(q.points) for q in questions)) if latest_attempt else None,
                        "passed": float(latest_attempt.score) >= float(quiz.passing_score) if latest_attempt else None,
                        "status": latest_attempt.status if latest_attempt else None,
                    } if latest_attempt else None,
                })

            lesson_data["quizzes"] = quiz_list
            lessons_data.append(lesson_data)

        result.append({
            "id": chapter.id,
            "title": chapter.title,
            "description": chapter.description,
            "order": chapter.order,
            "lessons": lessons_data,
        })

    # Tính progress
    total_lessons = sum(len(ch["lessons"]) for ch in result)
    completed_count = sum(
        1 for ch in result for l in ch["lessons"] if l["completed"]
    )
    progress_percent = round((completed_count / total_lessons * 100) if total_lessons > 0 else 0, 2)

    # Nếu chưa enroll, không có progress/certificate
    if not enrollment:
        return {
            "enrollment_id": None,
            "course_id": course_id,
            "chapters": result,
            "progress": {
                "completed_lessons_count": 0,
                "total_lessons_count": total_lessons,
                "progress_percent": 0,
                "last_completed_lesson_id": None,
            },
            "course_completed": False,
            "certificate": None,
        }

    # Lấy course progress
    progress, created = CourseProgress.objects.get_or_create(enrollment=enrollment)

    # Cập nhật CourseProgress để đồng bộ dữ liệu
    progress.completed_lessons_count = completed_count
    progress.total_lessons_count = total_lessons
    progress.progress_percent = progress_percent
    progress.save()

    # Kiểm tra trạng thái completed course và certificate
    # Chỉ coi là completed nếu enrollment.status là COMPLETED VÀ progress >= 100%
    course_completed = enrollment.status == "COMPLETED" and progress.progress_percent >= 100
    certificate = None
    if course_completed:
        cert = CourseCertificate.objects.filter(enrollment=enrollment).first()
        if not cert:
            # Tạo certificate nếu chưa có (do bug trước đó)
            cert = CourseCertificate.objects.create(
                student=user,
                course_id=course_id,
                enrollment=enrollment,
                certificate_code=_generate_certificate_code(user.id, course_id),
                pdf_url="",
                image_url="",
            )
        # Generate ảnh chứng chỉ nếu chưa có
        if not cert.image_url:
            try:
                image_url = certificate_image_service.upload(cert)
                if image_url:
                    cert.image_url = image_url
                    cert.save(update_fields=["image_url"])
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to generate certificate image for {cert.id}: {e}")
        certificate = {
            "id": str(cert.id),
            "certificate_code": cert.certificate_code,
            "issued_at": cert.issued_at.isoformat(),
            "image_url": cert.image_url or "",
        }

    return {
        "enrollment_id": enrollment.id,
        "course_id": course_id,
        "chapters": result,
        "progress": {
            "completed_lessons_count": completed_count,
            "total_lessons_count": total_lessons,
            "progress_percent": progress_percent,
            "last_completed_lesson_id": progress.last_completed_lesson_id,
        },
        "course_completed": course_completed,
        "certificate": certificate,
    }
def mark_lesson_complete(user, course_id, lesson_id):
    """
    Đánh dấu bài học đã hoàn thành.
    - Kiểm tra enrollment
    - Tạo/cập nhật LessonProgress
    - Cập nhật CourseProgress
    """
    enrollment = get_enrollment_or_404(user, course_id)

    # Kiểm tra lesson tồn tại và thuộc khóa học
    lesson = Lesson.objects.filter(id=lesson_id, chapter__course_id=course_id).first()
    if not lesson:
        raise NotFound("Không tìm thấy bài học.")

    with transaction.atomic():
        # Tạo hoặc cập nhật LessonProgress
        lesson_progress, created = LessonProgress.objects.get_or_create(
            enrollment=enrollment,
            lesson=lesson,
            defaults={"completed": True, "completed_at": timezone.now()},
        )
        if not created and not lesson_progress.completed:
            lesson_progress.completed = True
            lesson_progress.completed_at = timezone.now()
            lesson_progress.save()

        # Cập nhật CourseProgress
        course_progress, _ = CourseProgress.objects.get_or_create(enrollment=enrollment)

        # Đếm total lessons: dùng chapters (giống logic get_learning_curriculum)
        chapters = Chapter.objects.filter(course_id=course_id).order_by("order", "id")
        total = 0
        for chapter in chapters:
            total += Lesson.objects.filter(
                chapter=chapter
            ).count()

        # Đếm completed lessons: chỉ tính lesson đã hoàn thành thuộc course này
        completed_count = LessonProgress.objects.filter(
            enrollment=enrollment,
            lesson__chapter__in=chapters,
            completed=True
        ).count()

        course_progress.completed_lessons_count = completed_count
        course_progress.total_lessons_count = total
        course_progress.progress_percent = round(
            (completed_count / total * 100) if total > 0 else 0, 2
        )
        course_progress.last_completed_lesson = lesson
        course_progress.last_activity_at = timezone.now()

        if not course_progress.started_at:
            course_progress.started_at = timezone.now()

        if course_progress.completed_lessons_count >= total:
            course_progress.completed_at = timezone.now()

        course_progress.save()

    return {
        "lesson_id": lesson_id,
        "completed": True,
        "completed_lessons_count": course_progress.completed_lessons_count,
        "total_lessons_count": course_progress.total_lessons_count,
        "progress_percent": float(course_progress.progress_percent),
    }
def complete_course(user, course_id):
    """
    Hoàn thành khóa học và cấp chứng chỉ.
    - Kiểm tra enrollment
    - Kiểm tra progress >= 100%
    - Đánh dấu enrollment là COMPLETED
    - Tạo Certificate nếu chưa có
    """
    enrollment = get_enrollment_or_404(user, course_id)

    # Lấy course progress
    course_progress, _ = CourseProgress.objects.get_or_create(enrollment=enrollment)
    progress_percent = float(course_progress.progress_percent)

    if progress_percent < 100:
        raise ValidationError("Bạn cần hoàn thành tất cả bài học trước khi hoàn thành khóa học.")

    # Nếu đã completed rồi thì trả về luôn (tạo certificate nếu chưa có + generate ảnh)
    if enrollment.status == "COMPLETED":
        certificate = CourseCertificate.objects.filter(enrollment=enrollment).first()
        if not certificate:
            # Tạo certificate nếu chưa có (do bug trước đó)
            certificate = CourseCertificate.objects.create(
                student=user,
                course_id=course_id,
                enrollment=enrollment,
                certificate_code=_generate_certificate_code(user.id, course_id),
                pdf_url="",
                image_url="",
            )
        if not certificate.image_url:
            try:
                image_url = certificate_image_service.upload(certificate)
                if image_url:
                    certificate.image_url = image_url
                    certificate.save(update_fields=["image_url"])
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to generate certificate image for {certificate.id}: {e}")
        return {
            "course_completed": True,
            "completed_at": enrollment.completed_at.isoformat(),
            "certificate": {
                "id": str(certificate.id),
                "certificate_code": certificate.certificate_code,
                "issued_at": certificate.issued_at.isoformat(),
                "image_url": certificate.image_url or "",
            },
        }

    with transaction.atomic():
        # Đánh dấu enrollment là COMPLETED
        enrollment.status = "COMPLETED"
        enrollment.completed_at = timezone.now()
        enrollment.save()

        # Cập nhật CourseProgress
        course_progress.completed_at = timezone.now()
        course_progress.save()

        # Tạo certificate nếu chưa có
        certificate, created = CourseCertificate.objects.get_or_create(
            student=user,
            course_id=course_id,
            enrollment=enrollment,
            defaults={
                "certificate_code": _generate_certificate_code(user.id, course_id),
                "pdf_url": "",
                "image_url": "",
            }
        )

    # Sau transaction: generate ảnh chứng chỉ và upload lên Cloudinary
    if not certificate.image_url:
        try:
            image_url = certificate_image_service.upload(certificate)
            if image_url:
                certificate.image_url = image_url
                certificate.save(update_fields=["image_url"])
        except Exception as e:
            # Không throw lỗi nếu generate ảnh thất bại
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to generate certificate image for {certificate.id}: {e}")

    return {
        "course_completed": True,
        "completed_at": enrollment.completed_at.isoformat(),
        "certificate": {
            "id": str(certificate.id),
            "certificate_code": certificate.certificate_code,
            "issued_at": certificate.issued_at.isoformat(),
            "image_url": certificate.image_url or "",
        },
    }
def _generate_certificate_code(user_id, course_id):
    """Tạo mã chứng chỉ duy nhất dạng CERT-COURSEID-USERID-YYYYMMDD-RANDOM."""
    today = timezone.now().strftime("%Y%m%d")
    random_part = uuid.uuid4().hex[:4].upper()
    return f"CERT-{course_id}-{user_id}-{today}-{random_part}"
def submit_quiz(user, course_id, quiz_id, answers):
    """
    Nộp bài quiz và chấm điểm tự động (MCQ).
    - Kiểm tra enrollment
    - Tạo QuizAttempt
    - Chấm MCQ tự động
    - Trả về kết quả
    """
    quiz = Quiz.objects.filter(id=quiz_id, lesson__chapter__course_id=course_id).first()
    if not quiz:
        raise NotFound("Không tìm thấy bài kiểm tra.")

    # Kiểm tra nếu quiz có câu hỏi tự luận (ESSAY) - chỉ được làm 1 lần
    has_essay = quiz.questions.filter(question_type="ESSAY").exists()
    if has_essay:
        existing_attempt = QuizAttempt.objects.filter(
            quiz=quiz,
            student=user,
            status__in=["SUBMITTED", "GRADED"],
        ).exists()
        if existing_attempt:
            raise ValidationError("Bài tập tự luận chỉ được làm 1 lần.")

    with transaction.atomic():
        attempt = QuizAttempt.objects.create(
            student=user,
            quiz=quiz,
            status="SUBMITTED",
            submitted_at=timezone.now(),
        )

        total_score = 0
        max_score = 0
        results = []

        for answer_data in answers:
            question_id = answer_data.get("question_id")
            selected_option_id = answer_data.get("selected_option_id")
            answer_text = answer_data.get("answer_text")

            question = Question.objects.filter(id=question_id, quiz=quiz).first()
            if not question:
                continue

            max_score += float(question.points)
            is_correct = False
            score = 0

            if question.question_type == "MCQ" and selected_option_id:
                correct_option = question.options.filter(is_correct=True).first()
                if correct_option and correct_option.id == selected_option_id:
                    is_correct = True
                    score = float(question.points)

                QuizAttemptAnswer.objects.create(
                    attempt=attempt,
                    question=question,
                    selected_option_id=selected_option_id,
                    is_correct=is_correct,
                    score=score,
                )

            elif question.question_type == "FILL_BLANK" and answer_text:
                correct_answer = (question.correct_text_answer or "").strip().lower()
                if answer_text.strip().lower() == correct_answer:
                    is_correct = True
                    score = float(question.points)

                QuizAttemptAnswer.objects.create(
                    attempt=attempt,
                    question=question,
                    answer_text=answer_text,
                    is_correct=is_correct,
                    score=score,
                )

            elif question.question_type == "ESSAY":
                QuizAttemptAnswer.objects.create(
                    attempt=attempt,
                    question=question,
                    answer_text=answer_text or "",
                    is_correct=False,
                    score=0,
                )

            total_score += score
            results.append({
                "question_id": question_id,
                "is_correct": is_correct,
                "score": score,
                "max_score": float(question.points),
            })

        # Cập nhật điểm
        attempt.score = total_score

        # Nếu quiz có câu hỏi ESSAY, giữ trạng thái SUBMITTED (chờ giảng viên chấm)
        has_essay = quiz.questions.filter(question_type="ESSAY").exists()
        if has_essay:
            attempt.status = "SUBMITTED"
        else:
            attempt.status = "GRADED"
            attempt.graded_at = timezone.now()

        attempt.save()

    return {
        "attempt_id": attempt.id,
        "score": total_score,
        "max_score": max_score,
        "passed": total_score >= float(quiz.passing_score),
        "passing_score": float(quiz.passing_score),
        "results": results,
        "status": attempt.status,
    }
