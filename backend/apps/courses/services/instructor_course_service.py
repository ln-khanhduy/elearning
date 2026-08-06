"""
InstructorCourseService - Service cho các tính năng của instructor trong khóa học.
Bao gồm: chấm bài tự luận, gửi thông báo, Q&A, báo cáo học tập.
"""

from django.utils import timezone
from django.db.models import Avg
from apps.quizzes.models import QuizAttemptAnswer, Question, QuizAttempt
from apps.enrollments.models import Enrollment, CourseProgress
from apps.notifications.models import Notification
from apps.courses.models import CourseQuestion
from apps.courses.repositories.qa_repository import (
    get_questions_queryset,
    filter_by_status,
    filter_by_lesson,
    order_by_newest,
    paginate,
    get_question_by_id,
    create_answer,
    update_question_status,
    create_notification,
    count_questions,
)


def get_essay_submissions(course_id):
    """Lấy danh sách bài làm tự luận (ESSAY) của một khóa học.

    Trả về danh sách các dict chứa thông tin: answer_id, tên học viên,
    tiêu đề bài kiểm tra, nội dung câu hỏi, bài làm, điểm số, trạng thái
    và thời gian nộp bài.
    """
    answers = QuizAttemptAnswer.objects.filter(
        question__question_type=Question.QuestionType.ESSAY,
        attempt__quiz__lesson__chapter__course_id=course_id,
    ).select_related('attempt', 'attempt__student', 'question', 'attempt__quiz').order_by('-attempt__started_at')
    data = []
    for ans in answers:
        question_points = float(ans.question.points) if ans.question.points else 10
        max_score = max(question_points, 10)
        data.append({
            "answer_id": ans.id,
            "student_name": ans.attempt.student.get_full_name() or ans.attempt.student.email,
            "quiz_title": ans.attempt.quiz.title,
            "question_prompt": ans.question.prompt,
            "answer_text": ans.answer_text or "",
            "score": float(ans.score) if ans.score else 0,
            "max_score": max_score,
            "status": ans.status,
            "submitted_at": ans.attempt.started_at,
        })
    return data


def grade_essay(course_id, answer_id, score):
    """Chấm điểm một bài tự luận.

    - Chỉ chấm được câu trả lời tự luận thuộc khóa học đã cho.
    - Điểm phải nằm trong khoảng từ 0 đến max_score (tối thiểu 10, hoặc
      theo số điểm của câu hỏi nếu cao hơn 10).
    - Sau khi chấm, cập nhật điểm tổng của lượt làm bài. Nếu tất cả câu
      tự luận đã được chấm, đánh dấu lượt làm bài là GRADED.
    - Trả về tuple (success, message) với success là True/False.
    """
    try:
        answer = QuizAttemptAnswer.objects.get(
            id=answer_id, question__question_type=Question.QuestionType.ESSAY,
            attempt__quiz__lesson__chapter__course_id=course_id,
        )
    except QuizAttemptAnswer.DoesNotExist:
        return False, "Không tìm thấy câu trả lời."
    question_points = float(answer.question.points) if answer.question.points else 10
    max_score = max(question_points, 10)
    score = float(score)
    if score < 0 or score > max_score:
        return False, f"Điểm phải từ 0 đến {max_score}."
    answer.score = score
    answer.is_correct = score > 0
    answer.status = QuizAttemptAnswer.Status.GRADED
    answer.graded_at = timezone.now()
    answer.save()
    attempt = answer.attempt
    total_score = sum(float(a.score) for a in attempt.answers.all())
    attempt.score = total_score
    all_graded = not attempt.answers.filter(
        question__question_type=Question.QuestionType.ESSAY,
        status=QuizAttemptAnswer.Status.SUBMITTED,
    ).exists()
    if all_graded:
        attempt.status = QuizAttempt.Status.GRADED
        attempt.graded_at = timezone.now()
    attempt.save()
    return True, "Chấm điểm thành công."


def send_notification(course_id, title, body):
    """Gửi thông báo đến tất cả học viên đang hoạt động (ACTIVE) của khóa học.

    Tạo thông báo loại COURSE qua kênh IN_APP với trạng thái SENT cho từng
    học viên và dùng bulk_create để tạo hàng loạt. Trả về số lượng thông báo đã gửi.
    """
    from apps.courses.models import Course
    course = Course.objects.filter(id=course_id).values_list("title", flat=True).first()
    notif_title = f"{course or 'Khóa học'} - {title}"

    enrollments = Enrollment.objects.filter(
        course_id=course_id,
        status__in=[Enrollment.Status.ACTIVE, Enrollment.Status.COMPLETED],
    ).select_related('student')
    notifications = []
    for enrollment in enrollments:
        notifications.append(Notification(
            recipient=enrollment.student, title=notif_title, body=body,
            notification_type=Notification.Type.COURSE, channel=Notification.Channel.IN_APP,
            link=f"/courses/{course_id}/learn", send_status=Notification.SendStatus.SENT,
        ))
    if notifications:
        Notification.objects.bulk_create(notifications)
    return len(notifications)


def get_questions(course_id, status=None, lesson_id=None, page=1, page_size=20):
    """Lấy danh sách câu hỏi Q&A của khóa học, hỗ trợ lọc theo trạng thái,
    bài học và phân trang.

    Trả về dict chứa: questions, total, page, total_pages, has_next, has_previous.
    """
    qs = get_questions_queryset(course_id)
    qs = filter_by_status(qs, status)
    qs = filter_by_lesson(qs, lesson_id)
    qs = order_by_newest(qs)
    page_obj, paginator_result = paginate(qs, page, page_size)
    return {
        "questions": list(page_obj.object_list),
        "total": paginator_result.count,
        "page": page_obj.number,
        "total_pages": paginator_result.num_pages,
        "has_next": page_obj.has_next(),
        "has_previous": page_obj.has_previous(),
    }


def get_question_detail(question_id):
    """Lấy chi tiết một câu hỏi Q&A theo ID."""
    return get_question_by_id(question_id)


def create_question(course, student, data):
    """Tạo mới một câu hỏi Q&A từ học viên cho khóa học.

    Đồng thời gửi thông báo cho giảng viên được phân công của khóa học
    (nếu có) về câu hỏi vừa được đặt. Lỗi thông báo sẽ bị bỏ qua.
    """
    from apps.notifications import services as notif_service
    from apps.courses.repositories import qa_repository as qa_repo
    qst = qa_repo.create_question(
        course=course, student=student,
        lesson=data.get('lesson'), title=data.get('title'), content=data.get('content'),
    )
    try:
        if course.assigned_instructor:
            student_name = student.get_full_name() or student.email
            notif_service.notify_question_asked(course.assigned_instructor, student_name, course.title, data.get('title', ''))
    except Exception:
        pass
    return qst


def reply_question(question, author, content):
    """Trả lời một câu hỏi Q&A.

    - Xác định tác giả có phải giảng viên của khóa học hay không.
    - Nếu giảng viên trả lời và câu hỏi đang ở trạng thái OPEN, cập nhật
      trạng thái thành ANSWERED và gửi thông báo cho học viên hỏi.
    """
    is_instructor = (
        hasattr(author, 'teaching_courses') and
        author.teaching_courses.filter(id=question.course_id).exists()
    )
    answer = create_answer(question=question, author=author, content=content, is_instructor=is_instructor)
    if is_instructor and question.status == CourseQuestion.Status.OPEN:
        update_question_status(question, CourseQuestion.Status.ANSWERED)
        create_notification(
            recipient=question.student,
            title="Câu hỏi của bạn đã được trả lời",
            body=f"Giảng viên đã trả lời câu hỏi: {question.title}",
            link=f"/learning/courses/{question.course_id}/qa/{question.id}/",
        )
    return answer


def close_question(question):
    """Đóng câu hỏi Q&A (chuyển trạng thái sang CLOSED)."""
    update_question_status(question, CourseQuestion.Status.CLOSED)


def get_question_count(course_id):
    """Đếm số lượng câu hỏi Q&A của khóa học theo từng trạng thái."""
    return count_questions(course_id)


def get_learning_report(course_id):
    """Xây dựng báo cáo học tập tổng hợp cho khóa học.

    Trả về dict chứa: tổng số học viên, tiến độ trung bình, tỷ lệ hoàn thành,
    điểm trung bình và danh sách 10 học viên đăng ký gần nhất.
    """
    enrollments = Enrollment.objects.filter(
        course_id=course_id,
        status=Enrollment.Status.ACTIVE,
    ).select_related('student')

    total_students = enrollments.count()

    avg_progress = CourseProgress.objects.filter(
        enrollment__course_id=course_id,
        enrollment__status=Enrollment.Status.ACTIVE,
    ).aggregate(avg=Avg('progress_percent'))['avg'] or 0

    completed = CourseProgress.objects.filter(
        enrollment__course_id=course_id,
        enrollment__status=Enrollment.Status.ACTIVE,
        progress_percent__gte=100,
    ).count()
    completion_rate = round((completed / total_students * 100), 1) if total_students > 0 else 0

    avg_score = QuizAttempt.objects.filter(
        quiz__lesson__chapter__course_id=course_id,
        status__in=['SUBMITTED', 'GRADED'],
    ).aggregate(avg=Avg('score'))['avg'] or 0

    recent_enrollments = enrollments.order_by('-created_at')[:10]
    recent_data = []
    for e in recent_enrollments:
        progress_obj = getattr(e, 'progress', None)
        progress_value = float(progress_obj.progress_percent) if progress_obj else 0
        recent_data.append({
            "id": e.id,
            "student_name": e.student.get_full_name() or e.student.email,
            "enrolled_at": e.created_at,
            "progress": progress_value,
        })

    return {
        "total_students": total_students,
        "average_progress": round(avg_progress, 1),
        "completion_rate": completion_rate,
        "average_score": round(float(avg_score), 1),
        "recent_enrollments": recent_data,
    }