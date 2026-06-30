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
from apps.courses.repositories.qa_repository import QARepository

class InstructorCourseService:
    """Service xử lý các nghiệp vụ instructor trong khóa học."""

    @staticmethod
    def get_essay_submissions(course_id):
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

    @staticmethod
    def grade_essay(course_id, answer_id, score):
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

    @staticmethod
    def send_notification(course_id, title, body):
        enrollments = Enrollment.objects.filter(course_id=course_id, status=Enrollment.Status.ACTIVE).select_related('student')
        notifications = []
        for enrollment in enrollments:
            notifications.append(Notification(
                recipient=enrollment.student, title=title, body=body,
                notification_type=Notification.Type.COURSE, channel=Notification.Channel.IN_APP,
                link=f"/learning/courses/{course_id}/", send_status=Notification.SendStatus.SENT,
            ))
        if notifications:
            Notification.objects.bulk_create(notifications)
        return len(notifications)

    # ==================== Q&A METHODS ====================

    @staticmethod
    def get_questions(course_id, status=None, lesson_id=None, page=1, page_size=20):
        qs = QARepository.get_questions_queryset(course_id)
        qs = QARepository.filter_by_status(qs, status)
        qs = QARepository.filter_by_lesson(qs, lesson_id)
        qs = QARepository.order_by_newest(qs)
        page_obj, paginator = QARepository.paginate(qs, page, page_size)
        return {
            "questions": list(page_obj.object_list),
            "total": paginator.count,
            "page": page_obj.number,
            "total_pages": paginator.num_pages,
            "has_next": page_obj.has_next(),
            "has_previous": page_obj.has_previous(),
        }

    @staticmethod
    def get_question_detail(question_id):
        return QARepository.get_question_by_id(question_id)

    @staticmethod
    def create_question(course, student, data):
        return QARepository.create_question(
            course=course, student=student,
            lesson=data.get('lesson'), title=data.get('title'), content=data.get('content'),
        )

    @staticmethod
    def reply_question(question, author, content):
        is_instructor = (
            hasattr(author, 'teaching_courses') and
            author.teaching_courses.filter(id=question.course_id).exists()
        )
        answer = QARepository.create_answer(question=question, author=author, content=content, is_instructor=is_instructor)
        if is_instructor and question.status == CourseQuestion.Status.OPEN:
            QARepository.update_question_status(question, CourseQuestion.Status.ANSWERED)
            QARepository.create_notification(
                recipient=question.student,
                title="Câu hỏi của bạn đã được trả lời",
                body=f"Giảng viên đã trả lời câu hỏi: {question.title}",
                link=f"/learning/courses/{question.course_id}/qa/{question.id}/",
            )
        return answer

    @staticmethod
    def close_question(question):
        QARepository.update_question_status(question, CourseQuestion.Status.CLOSED)

    @staticmethod
    def get_question_count(course_id):
        return QARepository.count_questions(course_id)

    @staticmethod
    def get_learning_report(course_id):
        """
        Lấy báo cáo học tập chi tiết của khóa học.
        """
        enrollments = Enrollment.objects.filter(
            course_id=course_id,
            status=Enrollment.Status.ACTIVE,
        ).select_related('student')

        total_students = enrollments.count()

        # Tiến độ trung bình
        avg_progress = CourseProgress.objects.filter(
            enrollment__course_id=course_id,
            enrollment__status=Enrollment.Status.ACTIVE,
        ).aggregate(avg=Avg('progress_percent'))['avg'] or 0

        # Tỷ lệ hoàn thành
        completed = CourseProgress.objects.filter(
            enrollment__course_id=course_id,
            enrollment__status=Enrollment.Status.ACTIVE,
            progress_percent__gte=100,
        ).count()
        completion_rate = round((completed / total_students * 100), 1) if total_students > 0 else 0

        # Điểm trung bình bài kiểm tra
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
