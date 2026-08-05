from rest_framework.exceptions import NotFound
from apps.quizzes.models import Quiz, Question, QuestionOption, QuizAttempt, QuizAttemptAnswer


def get_by_id(quiz_id):
    """Lấy bài kiểm tra theo ID kèm thông tin bài học, chương, khóa học và giảng viên được phân công.

    Trả về lỗi NotFound nếu không tìm thấy.
    """
    quiz = Quiz.objects.select_related(
        "lesson", "lesson__chapter", "lesson__chapter__course",
        "lesson__chapter__course__assigned_instructor"
    ).filter(id=quiz_id).first()
    if not quiz:
        raise NotFound("Không tìm thấy bài tập.")
    return quiz


def get_by_lesson(lesson_id):
    """Lấy danh sách bài kiểm tra của một bài học, sắp xếp theo thời gian tạo."""
    return Quiz.objects.filter(lesson_id=lesson_id).order_by("created_at")


def get_questions_for_quiz(quiz):
    """Lấy danh sách câu hỏi của bài kiểm tra kèm các lựa chọn (prefetch), sắp xếp theo thứ tự."""
    return Question.objects.filter(quiz=quiz).prefetch_related("options").order_by("order", "id")


def get_options_for_question(question):
    """Lấy danh sách lựa chọn của một câu hỏi, sắp xếp theo thứ tự."""
    return QuestionOption.objects.filter(question=question).order_by("order", "id")


def get_latest_attempt(quiz, user):
    """Lấy lượt làm bài mới nhất (SUBMITTED/GRADED) của người dùng cho bài kiểm tra."""
    return QuizAttempt.objects.filter(
        quiz=quiz, student=user,
        status__in=["SUBMITTED", "GRADED"],
    ).order_by("-submitted_at").first()


def get_quiz_by_course(quiz_id, course_id):
    """Lấy bài kiểm tra theo ID thuộc đúng khóa học đã cho, trả về None nếu không tìm thấy."""
    return Quiz.objects.filter(id=quiz_id, lesson__chapter__course_id=course_id).first()


def has_essay_questions(quiz):
    """Kiểm tra bài kiểm tra có chứa câu hỏi tự luận (ESSAY) hay không."""
    return quiz.questions.filter(question_type="ESSAY").exists()


def has_existing_attempt(quiz, user):
    """Kiểm tra người dùng đã có lượt làm bài (SUBMITTED/GRADED) cho bài kiểm tra hay chưa."""
    return QuizAttempt.objects.filter(
        quiz=quiz, student=user, status__in=["SUBMITTED", "GRADED"],
    ).exists()


def get_question_by_id(question_id, quiz):
    """Lấy câu hỏi theo ID thuộc đúng bài kiểm tra đã cho, trả về None nếu không tìm thấy."""
    return Question.objects.filter(id=question_id, quiz=quiz).first()


def get_correct_option(question):
    """Lấy đáp án đúng của câu hỏi."""
    return question.options.filter(is_correct=True).first()


def create_quiz_attempt(user, quiz, status="SUBMITTED"):
    """Tạo mới một lượt làm bài kiểm tra với trạng thái mặc định là SUBMITTED."""
    from django.utils import timezone
    return QuizAttempt.objects.create(student=user, quiz=quiz, status=status, submitted_at=timezone.now())


def create_attempt_answer(attempt, question, selected_option_id=None, answer_text=None, is_correct=False, score=0):
    """Tạo mới một câu trả lời trong lượt làm bài kiểm tra."""
    return QuizAttemptAnswer.objects.create(
        attempt=attempt, question=question,
        selected_option_id=selected_option_id,
        answer_text=answer_text, is_correct=is_correct, score=score,
    )


def create(data):
    """Tạo mới một bài kiểm tra."""
    return Quiz.objects.create(**data)


def update(quiz_id, data):
    """Cập nhật thông tin bài kiểm tra theo ID."""
    quiz = get_by_id(quiz_id)
    for key, value in data.items():
        setattr(quiz, key, value)
    quiz.save()
    return quiz


def count_attempts_in_range(student_id, course_id, start_date, end_date):
    """Đếm số quiz attempt trong khoảng thời gian (dùng cho weekly digest)."""
    from django.utils import timezone
    return QuizAttempt.objects.filter(
        student_id=student_id,
        quiz__lesson__chapter__course_id=course_id,
        submitted_at__gte=start_date,
        submitted_at__lte=end_date,
    ).count()


def delete(quiz_id):
    """Xóa bài kiểm tra theo ID."""
    quiz = get_by_id(quiz_id)
    quiz.delete()
