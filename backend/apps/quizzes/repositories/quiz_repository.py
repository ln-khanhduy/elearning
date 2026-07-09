from rest_framework.exceptions import NotFound
from apps.quizzes.models import Quiz, Question, QuestionOption, QuizAttempt, QuizAttemptAnswer


def get_by_id(quiz_id):
    quiz = Quiz.objects.select_related(
        "lesson", "lesson__chapter", "lesson__chapter__course",
        "lesson__chapter__course__assigned_instructor"
    ).filter(id=quiz_id).first()
    if not quiz:
        raise NotFound("Không tìm thấy bài tập.")
    return quiz


def get_by_lesson(lesson_id):
    return Quiz.objects.filter(lesson_id=lesson_id).order_by("created_at")


def get_questions_for_quiz(quiz):
    return Question.objects.filter(quiz=quiz).prefetch_related("options").order_by("order", "id")


def get_options_for_question(question):
    return QuestionOption.objects.filter(question=question).order_by("order", "id")


def get_latest_attempt(quiz, user):
    return QuizAttempt.objects.filter(
        quiz=quiz, student=user,
        status__in=["SUBMITTED", "GRADED"],
    ).order_by("-submitted_at").first()


def get_quiz_by_course(quiz_id, course_id):
    return Quiz.objects.filter(id=quiz_id, lesson__chapter__course_id=course_id).first()


def has_essay_questions(quiz):
    return quiz.questions.filter(question_type="ESSAY").exists()


def has_existing_attempt(quiz, user):
    return QuizAttempt.objects.filter(
        quiz=quiz, student=user, status__in=["SUBMITTED", "GRADED"],
    ).exists()


def get_question_by_id(question_id, quiz):
    return Question.objects.filter(id=question_id, quiz=quiz).first()


def get_correct_option(question):
    return question.options.filter(is_correct=True).first()


def create_quiz_attempt(user, quiz, status="SUBMITTED"):
    from django.utils import timezone
    return QuizAttempt.objects.create(student=user, quiz=quiz, status=status, submitted_at=timezone.now())


def create_attempt_answer(attempt, question, selected_option_id=None, answer_text=None, is_correct=False, score=0):
    return QuizAttemptAnswer.objects.create(
        attempt=attempt, question=question,
        selected_option_id=selected_option_id,
        answer_text=answer_text, is_correct=is_correct, score=score,
    )


def create(data):
    return Quiz.objects.create(**data)


def update(quiz_id, data):
    quiz = get_by_id(quiz_id)
    for key, value in data.items():
        setattr(quiz, key, value)
    quiz.save()
    return quiz


def delete(quiz_id):
    quiz = get_by_id(quiz_id)
    quiz.delete()