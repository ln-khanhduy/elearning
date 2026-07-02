from django.db import transaction as db_transaction
from django.utils import timezone
from apps.courses.models import Course
from apps.lessons.models import Chapter, Lesson
from apps.quizzes.models import Quiz, QuizAttempt, QuizAttemptAnswer, Question
from apps.enrollments.models import CourseProgress, LessonProgress
from apps.certificates.models import CourseCertificate


# ---- Course & Curriculum ----


def get_course_by_id(course_id):
    return Course.objects.filter(id=course_id).first()


def get_chapters_by_course(course_id):
    return Chapter.objects.filter(course_id=course_id).order_by("order", "id")


def get_lessons_by_chapter(chapter):
    return Lesson.objects.filter(chapter=chapter).order_by("order", "id")


def get_lesson_in_course(lesson_id, course_id):
    return Lesson.objects.filter(id=lesson_id, chapter__course_id=course_id).first()


def count_lessons_by_course(course_id):
    total = 0
    chapters = Chapter.objects.filter(course_id=course_id)
    for chapter in chapters:
        total += Lesson.objects.filter(chapter=chapter).count()
    return total


# ---- Progress ----


def get_completed_lesson_ids(enrollment, chapters):
    return set(
        LessonProgress.objects.filter(
            enrollment=enrollment, lesson__chapter__in=chapters, completed=True
        ).values_list("lesson_id", flat=True)
    )


def get_or_create_lesson_progress(enrollment, lesson):
    progress, created = LessonProgress.objects.get_or_create(
        enrollment=enrollment, lesson=lesson,
        defaults={"completed": True, "completed_at": timezone.now()},
    )
    if not created and not progress.completed:
        progress.completed = True
        progress.completed_at = timezone.now()
        progress.save(update_fields=["completed", "completed_at"])
    return progress


def get_or_create_course_progress(enrollment):
    return CourseProgress.objects.get_or_create(enrollment=enrollment)


def update_course_progress(course_progress, **fields):
    for key, value in fields.items():
        setattr(course_progress, key, value)
    course_progress.save()


def count_completed_lessons(enrollment, chapters):
    return LessonProgress.objects.filter(
        enrollment=enrollment, lesson__chapter__in=chapters, completed=True
    ).count()


# ---- Quiz ----


def get_quiz_by_id_in_course(quiz_id, course_id):
    return Quiz.objects.filter(id=quiz_id, lesson__chapter__course_id=course_id).first()


def get_quizzes_by_lesson(lesson):
    return Quiz.objects.filter(lesson=lesson).order_by("created_at")


def get_questions_by_quiz_with_options(quiz):
    return quiz.questions.all().order_by("order", "id")


def has_essay_questions(quiz):
    return quiz.questions.filter(question_type="ESSAY").exists()


def get_existing_essay_attempt(quiz, student):
    return QuizAttempt.objects.filter(
        quiz=quiz, student=student, status__in=["SUBMITTED", "GRADED"],
    ).exists()


def get_latest_quiz_attempt(quiz, student):
    return QuizAttempt.objects.filter(
        quiz=quiz, student=student, status__in=["SUBMITTED", "GRADED"],
    ).order_by("-submitted_at").first()


def get_question_by_id_in_quiz(question_id, quiz):
    return Question.objects.filter(id=question_id, quiz=quiz).first()


def get_correct_option(question):
    return question.options.filter(is_correct=True).first()


def create_quiz_attempt(**kwargs):
    return QuizAttempt.objects.create(**kwargs)


def create_quiz_attempt_answer(**kwargs):
    return QuizAttemptAnswer.objects.create(**kwargs)


def update_quiz_attempt(attempt, **fields):
    for key, value in fields.items():
        setattr(attempt, key, value)
    attempt.save(update_fields=list(fields.keys()))


# ---- Certificate ----


def get_certificate_by_enrollment(enrollment):
    return CourseCertificate.objects.filter(enrollment=enrollment).first()


def create_certificate(**kwargs):
    return CourseCertificate.objects.create(**kwargs)


def get_or_create_certificate(**kwargs):
    return CourseCertificate.objects.get_or_create(**kwargs)


def update_certificate(cert, **fields):
    for key, value in fields.items():
        setattr(cert, key, value)
    cert.save(update_fields=list(fields.keys()))