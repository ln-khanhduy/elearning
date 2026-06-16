from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from apps.enrollments.models import Enrollment, LessonProgress, CourseProgress
from apps.enrollments.repositories.enrollment_repository import EnrollmentRepository
from apps.lessons.models import Lesson, Chapter
from apps.quizzes.models import Quiz, QuizAttempt, QuizAttemptAnswer, Question


class LearningService:
    """Service quản lý học tập - curriculum, progress, quiz."""

    @staticmethod
    def get_enrollment_or_404(user, course_id):
        """
        Kiểm tra user đã enroll khóa học chưa.
        Trả về enrollment nếu có, raise exception nếu không.
        """
        enrollment = EnrollmentRepository.get_active_by_user_and_course(user.id, course_id)
        if not enrollment:
            raise PermissionDenied("Bạn cần đăng ký khóa học trước khi học.")
        return enrollment

    @staticmethod
    def get_learning_curriculum(user, course_id):
        """
        Lấy toàn bộ curriculum cho learning page.
        - Kiểm tra enrollment
        - Lấy chapters + lessons + quizzes
        - Gắn trạng thái completed cho từng lesson
        """
        enrollment = LearningService.get_enrollment_or_404(user, course_id)

        chapters = Chapter.objects.filter(course_id=course_id).order_by("order", "id")
        completed_lesson_ids = set(
            LessonProgress.objects.filter(
                enrollment=enrollment, completed=True
            ).values_list("lesson_id", flat=True)
        )

        result = []
        for chapter in chapters:
            lessons = Lesson.objects.filter(
                chapter=chapter, status="PUBLISHED"
            ).order_by("order", "id")

            lessons_data = []
            for lesson in lessons:
                lesson_data = {
                    "id": lesson.id,
                    "slug": lesson.slug,
                    "title": lesson.title,
                    "description": lesson.description,
                    "content_type": lesson.content_type,
                    "video_url": lesson.video_url,
                    "material_url": lesson.material_file.url if lesson.material_file else None,
                    "order": lesson.order,
                    "is_free": lesson.is_free,
                    "completed": lesson.id in completed_lesson_ids,
                    "quizzes": [],
                }

                # Lấy quizzes cho lesson
                quizzes = Quiz.objects.filter(lesson=lesson, status="ACTIVE").order_by("-created_at")
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

                    lessons_data[-1]["quizzes"].append({
                        "id": quiz.id,
                        "title": quiz.title,
                        "description": quiz.description,
                        "time_limit_minutes": quiz.time_limit_minutes,
                        "passing_score": float(quiz.passing_score),
                        "questions": questions_data,
                    })

                lessons_data.append(lesson_data)

            result.append({
                "id": chapter.id,
                "title": chapter.title,
                "description": chapter.description,
                "order": chapter.order,
                "lessons": lessons_data,
            })

        # Lấy course progress
        progress, created = CourseProgress.objects.get_or_create(enrollment=enrollment)
        total_lessons = sum(len(ch["lessons"]) for ch in result)
        completed_count = sum(
            1 for ch in result for l in ch["lessons"] if l["completed"]
        )

        return {
            "enrollment_id": enrollment.id,
            "course_id": course_id,
            "chapters": result,
            "progress": {
                "completed_lessons_count": completed_count,
                "total_lessons_count": total_lessons,
                "progress_percent": round((completed_count / total_lessons * 100) if total_lessons > 0 else 0, 2),
                "last_completed_lesson_id": progress.last_completed_lesson_id,
            },
        }

    @staticmethod
    def mark_lesson_complete(user, course_id, lesson_id):
        """
        Đánh dấu bài học đã hoàn thành.
        - Kiểm tra enrollment
        - Tạo/cập nhật LessonProgress
        - Cập nhật CourseProgress
        """
        enrollment = LearningService.get_enrollment_or_404(user, course_id)

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
            course_progress.completed_lessons_count = LessonProgress.objects.filter(
                enrollment=enrollment, completed=True
            ).count()

            total = Lesson.objects.filter(
                chapter__course_id=course_id, status="PUBLISHED"
            ).count()
            course_progress.total_lessons_count = total
            course_progress.progress_percent = round(
                (course_progress.completed_lessons_count / total * 100) if total > 0 else 0, 2
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

    @staticmethod
    def submit_quiz(user, course_id, quiz_id, answers):
        """
        Nộp bài quiz và chấm điểm tự động (MCQ).
        - Kiểm tra enrollment
        - Tạo QuizAttempt
        - Chấm MCQ tự động
        - Trả về kết quả
        """
        enrollment = LearningService.get_enrollment_or_404(user, course_id)

        quiz = Quiz.objects.filter(id=quiz_id, lesson__chapter__course_id=course_id).first()
        if not quiz:
            raise NotFound("Không tìm thấy bài kiểm tra.")

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
        }
