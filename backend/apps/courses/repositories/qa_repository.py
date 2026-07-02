from django.core.paginator import Paginator
from apps.courses.models import CourseQuestion, CourseAnswer
from apps.notifications.models import Notification
def get_questions_queryset(course_id):
    return CourseQuestion.objects.filter(course_id=course_id).select_related('student', 'lesson').prefetch_related('answers')
def filter_by_status(queryset, status):
    return queryset.filter(status=status) if status else queryset
def filter_by_lesson(queryset, lesson_id):
    return queryset.filter(lesson_id=lesson_id) if lesson_id else queryset
def order_by_newest(queryset):
    return queryset.order_by('-created_at')
def paginate(queryset, page, page_size):
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)
    return page_obj, paginator
def get_question_by_id(question_id):
    try:
        return CourseQuestion.objects.select_related('student', 'lesson').prefetch_related('answers__author').get(id=question_id)
    except CourseQuestion.DoesNotExist:
        return None
def create_question(course, student, lesson, title, content):
    return CourseQuestion.objects.create(course=course, student=student, lesson=lesson, title=title, content=content)
def create_answer(question, author, content, is_instructor):
    return CourseAnswer.objects.create(question=question, author=author, content=content, is_instructor=is_instructor)
def update_question_status(question, status):
    question.status = status
    question.save(update_fields=['status'])
def create_notification(recipient, title, body, link):
    return Notification.objects.create(
        recipient=recipient, title=title, body=body,
        notification_type=Notification.Type.COURSE, channel=Notification.Channel.IN_APP,
        link=link, send_status=Notification.SendStatus.SENT,
    )
def count_questions(course_id):
    from django.db.models import Count, Q
    return CourseQuestion.objects.filter(course_id=course_id).aggregate(
        total=Count('id'),
        open_count=Count('id', filter=Q(status=CourseQuestion.Status.OPEN)),
        answered_count=Count('id', filter=Q(status=CourseQuestion.Status.ANSWERED)),
        closed_count=Count('id', filter=Q(status=CourseQuestion.Status.CLOSED)),
    )
