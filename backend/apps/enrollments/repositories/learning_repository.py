from django.utils import timezone
from apps.courses.models import Course
from apps.lessons.models import Chapter, Lesson
from apps.quizzes.models import Quiz, QuizAttempt, QuizAttemptAnswer, Question
from apps.enrollments.models import CourseProgress, LessonProgress
from apps.certificates.models import CourseCertificate


# ---- Khóa học & Curriculum ----


def get_course_by_id(course_id):
    """Lấy khóa học theo ID, trả về None nếu không tìm thấy."""
    return Course.objects.filter(id=course_id).first()


def get_chapters_by_course(course_id):
    """Lấy danh sách chương của khóa học, sắp xếp theo thứ tự (order) rồi ID."""
    return Chapter.objects.filter(course_id=course_id).order_by("order", "id")


def get_lessons_by_chapter(chapter):
    """Lấy danh sách bài học của một chương, sắp xếp theo thứ tự (order) rồi ID."""
    return Lesson.objects.filter(chapter=chapter).order_by("order", "id")


def get_lesson_in_course(lesson_id, course_id):
    """Lấy bài học theo ID thuộc đúng khóa học đã cho, trả về None nếu không tìm thấy."""
    return Lesson.objects.filter(id=lesson_id, chapter__course_id=course_id).first()


def count_lessons_by_course(course_id):
    """Đếm tổng số bài học của một khóa học."""
    total = 0
    chapters = Chapter.objects.filter(course_id=course_id)
    for chapter in chapters:
        total += Lesson.objects.filter(chapter=chapter).count()
    return total


# ---- Tiến độ học tập ----


def get_completed_lesson_ids(enrollment, chapters):
    """Lấy tập hợp ID của các bài học đã hoàn thành của học viên trong các chương đã cho."""
    return set(
        LessonProgress.objects.filter(
            enrollment=enrollment, lesson__chapter__in=chapters, completed=True
        ).values_list("lesson_id", flat=True)
    )


def get_or_create_lesson_progress(enrollment, lesson):
    """Lấy hoặc tạo mới tiến độ bài học, đồng thời đánh dấu bài học là đã hoàn thành.

    Nếu bản ghi đã tồn tại nhưng chưa hoàn thành, cập nhật trạng thái thành
    hoàn thành kèm thời gian hoàn thành là hiện tại.
    """
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
    """Lấy hoặc tạo mới tiến độ khóa học của một học viên."""
    return CourseProgress.objects.get_or_create(enrollment=enrollment)


def update_course_progress(course_progress, **fields):
    """Cập nhật các trường của tiến độ khóa học và lưu lại."""
    for key, value in fields.items():
        setattr(course_progress, key, value)
    course_progress.save()


def count_completed_lessons(enrollment, chapters):
    """Đếm số bài học đã hoàn thành của học viên trong các chương đã cho."""
    return LessonProgress.objects.filter(
        enrollment=enrollment, lesson__chapter__in=chapters, completed=True
    ).count()


# ---- Bài kiểm tra (Quiz) ----


def get_quiz_by_id_in_course(quiz_id, course_id):
    """Lấy bài kiểm tra theo ID thuộc đúng khóa học đã cho, trả về None nếu không tìm thấy."""
    return Quiz.objects.filter(id=quiz_id, lesson__chapter__course_id=course_id).first()


def get_quizzes_by_lesson(lesson):
    """Lấy danh sách bài kiểm tra của một bài học, sắp xếp theo thời gian tạo."""
    return Quiz.objects.filter(lesson=lesson).order_by("created_at")


def get_questions_by_quiz_with_options(quiz):
    """Lấy danh sách câu hỏi của bài kiểm tra, sắp xếp theo thứ tự (order) rồi ID."""
    return quiz.questions.all().order_by("order", "id")


def has_essay_questions(quiz):
    """Kiểm tra bài kiểm tra có chứa câu hỏi tự luận (ESSAY) hay không."""
    return quiz.questions.filter(question_type="ESSAY").exists()


def get_existing_essay_attempt(quiz, student):
    """Kiểm tra học viên đã có lượt làm bài (SUBMITTED/GRADED) cho bài kiểm tra tự luận hay chưa."""
    return QuizAttempt.objects.filter(
        quiz=quiz, student=student, status__in=["SUBMITTED", "GRADED"],
    ).exists()


def get_latest_quiz_attempt(quiz, student):
    """Lấy lượt làm bài mới nhất (SUBMITTED/GRADED) của học viên cho bài kiểm tra."""
    return QuizAttempt.objects.filter(
        quiz=quiz, student=student, status__in=["SUBMITTED", "GRADED"],
    ).order_by("-submitted_at").first()


def get_question_by_id_in_quiz(question_id, quiz):
    """Lấy câu hỏi theo ID thuộc đúng bài kiểm tra đã cho, trả về None nếu không tìm thấy."""
    return Question.objects.filter(id=question_id, quiz=quiz).first()


def get_correct_option(question):
    """Lấy đáp án đúng của câu hỏi."""
    return question.options.filter(is_correct=True).first()


def create_quiz_attempt(**kwargs):
    """Tạo mới một lượt làm bài kiểm tra."""
    return QuizAttempt.objects.create(**kwargs)


def create_quiz_attempt_answer(**kwargs):
    """Tạo mới một câu trả lời trong lượt làm bài kiểm tra."""
    return QuizAttemptAnswer.objects.create(**kwargs)


def update_quiz_attempt(attempt, **fields):
    """Cập nhật các trường của lượt làm bài kiểm tra và lưu lại."""
    for key, value in fields.items():
        setattr(attempt, key, value)
    attempt.save(update_fields=list(fields.keys()))


# ---- Chứng chỉ ----


def get_certificate_by_enrollment(enrollment):
    """Lấy chứng chỉ theo lượt đăng ký khóa học, trả về None nếu không có."""
    return CourseCertificate.objects.filter(enrollment=enrollment).first()


def create_certificate(**kwargs):
    """Tạo mới một chứng chỉ."""
    return CourseCertificate.objects.create(**kwargs)


def get_or_create_certificate(**kwargs):
    """Lấy chứng chỉ đã tồn tại hoặc tạo mới nếu chưa có."""
    return CourseCertificate.objects.get_or_create(**kwargs)


def update_certificate(cert, **fields):
    """Cập nhật các trường của chứng chỉ và lưu lại."""
    for key, value in fields.items():
        setattr(cert, key, value)
    cert.save(update_fields=list(fields.keys()))