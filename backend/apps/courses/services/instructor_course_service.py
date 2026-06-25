"""
InstructorCourseService - Service cho các tính năng của instructor trong khóa học.
Bao gồm: chấm bài tự luận, gửi thông báo, Q&A, báo cáo học tập.
"""

from django.utils import timezone
from django.db.models import Avg
from apps.quizzes.models import QuizAttemptAnswer, Question
from apps.enrollments.models import Enrollment, CourseProgress
from apps.notifications.models import Notification
from apps.quizzes.models import QuizAttempt

class InstructorCourseService:
    """Service xử lý các nghiệp vụ instructor trong khóa học."""

    @staticmethod
    def get_essay_submissions(course_id):
        """
        Lấy danh sách bài tự luận cần chấm của khóa học.
        """

        answers = QuizAttemptAnswer.objects.filter(
            question__question_type=Question.QuestionType.ESSAY,
            attempt__quiz__lesson__chapter__course_id=course_id,
        ).select_related(
            'attempt', 'attempt__student', 'question', 'attempt__quiz'
        ).order_by('-attempt__started_at')

        data = []
        for ans in answers:
            # Với câu hỏi tự luận, max_score mặc định là 10
            # (question.points thường là 1 - default - không phù hợp cho tự luận)
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
        """
        Chấm điểm câu hỏi tự luận.
        Returns: (success, message_or_error)
        """
        

        try:
            answer = QuizAttemptAnswer.objects.get(
                id=answer_id,
                question__question_type=Question.QuestionType.ESSAY,
                attempt__quiz__lesson__chapter__course_id=course_id,
            )
        except QuizAttemptAnswer.DoesNotExist:
            return False, "Không tìm thấy câu trả lời."

        # Với câu hỏi tự luận, max_score mặc định là 10
        # (question.points thường là 1 - default - không phù hợp cho tự luận)
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

        # Cập nhật điểm tổng của attempt
        attempt = answer.attempt
        total_score = sum(
            float(a.score) for a in attempt.answers.all()
        )
        attempt.score = total_score

        # Kiểm tra nếu tất cả câu hỏi trong attempt đã được chấm
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
        """
        Gửi thông báo tới tất cả học viên đang active trong khóa học.
        Returns: số lượng học viên đã nhận thông báo
        """
        

        enrollments = Enrollment.objects.filter(
            course_id=course_id,
            status=Enrollment.Status.ACTIVE,
        ).select_related('student')

        notifications = []
        for enrollment in enrollments:
            notifications.append(Notification(
                recipient=enrollment.student,
                title=title,
                body=body,
                notification_type=Notification.Type.COURSE,
                channel=Notification.Channel.IN_APP,
                link=f"/learning/courses/{course_id}/",
                send_status=Notification.SendStatus.SENT,
            ))

        if notifications:
            Notification.objects.bulk_create(notifications)

        return len(notifications)

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
