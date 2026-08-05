from django.core.paginator import Paginator
from django.db.models import Count, Q
from apps.courses.models import CourseQuestion, CourseAnswer
from apps.notifications.models import Notification


def get_questions_queryset(course_id):
    """Lấy queryset các câu hỏi của một khóa học, kèm thông tin học viên,
    bài học và danh sách câu trả lời."""
    return CourseQuestion.objects.filter(course_id=course_id).select_related('student', 'lesson').prefetch_related('answers')


def filter_by_status(queryset, status):
    """Lọc danh sách câu hỏi theo trạng thái. Nếu status là None, trả về queryset gốc."""
    return queryset.filter(status=status) if status else queryset


def filter_by_lesson(queryset, lesson_id):
    """Lọc danh sách câu hỏi theo bài học. Nếu lesson_id là None, trả về queryset gốc."""
    return queryset.filter(lesson_id=lesson_id) if lesson_id else queryset


def order_by_newest(queryset):
    """Sắp xếp danh sách câu hỏi theo thời gian tạo mới nhất."""
    return queryset.order_by('-created_at')


def paginate(queryset, page, page_size):
    """Phân trang cho queryset. Trả về (page_obj, paginator)."""
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)
    return page_obj, paginator


def get_question_by_id(question_id):
    """Lấy chi tiết câu hỏi theo ID, kèm thông tin học viên, bài học
    và tác giả của các câu trả lời. Trả về None nếu không tìm thấy."""
    try:
        return CourseQuestion.objects.select_related('student', 'lesson').prefetch_related('answers__author').get(id=question_id)
    except CourseQuestion.DoesNotExist:
        return None


def create_question(course, student, lesson, title, content):
    """Tạo mới một câu hỏi cho khóa học."""
    return CourseQuestion.objects.create(course=course, student=student, lesson=lesson, title=title, content=content)


def create_answer(question, author, content, is_instructor):
    """Tạo mới một câu trả lời cho câu hỏi."""
    return CourseAnswer.objects.create(question=question, author=author, content=content, is_instructor=is_instructor)


def update_question_status(question, status):
    """Cập nhật trạng thái của câu hỏi."""
    question.status = status
    question.save(update_fields=['status'])


def create_notification(recipient, title, body, link):
    """Tạo mới một thông báo hỏi đáp trong khóa học, loại COURSE, kênh IN_APP và trạng thái gửi SENT."""
    return Notification.objects.create(
        recipient=recipient, title=title, body=body,
        notification_type=Notification.Type.COURSE, channel=Notification.Channel.IN_APP,
        link=link, send_status=Notification.SendStatus.SENT,
    )


def count_questions(course_id):
    """Đếm tổng số câu hỏi và số câu hỏi theo từng trạng thái (mở, đã trả lời, đã đóng) của một khóa học."""
    return CourseQuestion.objects.filter(course_id=course_id).aggregate(
        total=Count('id'),
        open_count=Count('id', filter=Q(status=CourseQuestion.Status.OPEN)),
        answered_count=Count('id', filter=Q(status=CourseQuestion.Status.ANSWERED)),
        closed_count=Count('id', filter=Q(status=CourseQuestion.Status.CLOSED)),
    )