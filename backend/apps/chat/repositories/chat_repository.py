"""ChatRepository - Tầng truy cập dữ liệu (ORM) cho app chat.

Tách toàn bộ query ORM khỏi services để giữ services sạch (business logic),
thống nhất cách truy cập dữ liệu và dễ test.
"""
from django.db.models import Q
from django.utils import timezone

from apps.chat.models import ChatRoom, ChatMessage, ChatReport


# ==================== CHAT ROOM ====================

def get_or_create_room(course):
    """Lấy phòng chat của khóa, tạo mới nếu chưa tồn tại."""
    room, _ = ChatRoom.objects.get_or_create(course=course)
    return room


def get_room_by_course_id(course_id):
    """Lấy phòng chat theo course_id (kèm course), trả về None nếu không có."""
    return ChatRoom.objects.select_related("course").filter(course_id=course_id).first()


def get_room_by_id(room_id):
    """Lấy phòng chat theo id (kèm course), trả về None nếu không có."""
    return ChatRoom.objects.select_related("course").filter(id=room_id).first()


def get_rooms_by_ids(room_ids):
    """Lấy danh sách phòng theo danh sách id, sắp theo tên khóa."""
    return ChatRoom.objects.filter(id__in=room_ids).select_related("course").order_by("course__title")


def get_rooms_for_course_ids(course_ids):
    """Lấy phòng chat thuộc danh sách course_id, sắp theo tên khóa."""
    return ChatRoom.objects.filter(course_id__in=course_ids).select_related("course").order_by("course__title")


def none_rooms():
    """Trả queryset phòng rỗng (dùng khi user không có quyền phòng nào)."""
    return ChatRoom.objects.none()


def get_published_course_ids():
    """Danh sách id khóa học PUBLISHED (cho admin xem tất cả)."""
    from apps.courses.models import Course

    return list(Course.objects.filter(status=Course.Status.PUBLISHED).values_list("id", flat=True))


def get_owned_or_assigned_course_ids(user):
    """Danh sách id khóa user được phân công hoặc tạo (loại DRAFT)."""
    from apps.courses.models import Course

    return list(Course.objects.filter(
        Q(assigned_instructor=user) | Q(created_by=user)
    ).exclude(status=Course.Status.DRAFT).values_list("id", flat=True))


def get_courses_by_ids_ids_only(course_ids):
    """Lấy các khóa theo id (chỉ cần field id)."""
    from apps.courses.models import Course

    return list(Course.objects.filter(id__in=course_ids).only("id"))


def user_has_active_enrollment(user, course):
    """Kiểm tra user có enrollment ACTIVE/COMPLETED còn hạn cho khóa không."""
    from apps.enrollments.models import Enrollment

    now = timezone.now()
    return Enrollment.objects.filter(
        student=user,
        course=course,
        status__in=[Enrollment.Status.ACTIVE, Enrollment.Status.COMPLETED],
    ).filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now)).exists()


def get_enrolled_course_ids(user):
    """Danh sách course_id user đã mua (ACTIVE/COMPLETED) và còn hạn học."""
    from apps.enrollments.models import Enrollment

    now = timezone.now()
    return list(Enrollment.objects.filter(
        student=user,
        status__in=[Enrollment.Status.ACTIVE, Enrollment.Status.COMPLETED],
    ).filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now)).values_list("course_id", flat=True))


# ==================== CHAT MESSAGE ====================

def get_messages_for_room(room, page=1, page_size=50):
    """Lấy tin nhắn của phòng (mới nhất trước), trả về dict phân trang."""
    qs = ChatMessage.objects.filter(room=room).select_related("sender").order_by("-sent_at")
    total = qs.count()
    start = (page - 1) * page_size
    end = start + page_size
    items = list(qs[start:end])
    items.reverse()
    return {"items": items, "total": total, "page": page, "page_size": page_size, "has_next": end < total}


def create_text_message(room, sender, content):
    """Tạo tin nhắn TEXT."""
    return ChatMessage.objects.create(
        room=room, sender=sender, message_type=ChatMessage.MessageType.TEXT, content=content,
    )


def create_voice_message(room, sender, audio_url, duration, audio_format, replied_to=None):
    """Tạo tin nhắn VOICE."""
    return ChatMessage.objects.create(
        room=room, sender=sender, message_type=ChatMessage.MessageType.VOICE,
        audio_url=audio_url, audio_duration=duration, audio_format=audio_format, replied_to=replied_to,
    )


def get_message_by_id_with_room(message_id):
    """Lấy tin nhắn kèm phòng + khóa + người gửi (trả None nếu không có)."""
    return ChatMessage.objects.select_related("room__course", "sender").filter(id=message_id).first()


def get_replied_message(room, replied_to_id):
    """Lấy tin nhắn gốc để reply (chỉ trong cùng phòng)."""
    return ChatMessage.objects.filter(id=replied_to_id, room=room).first()


# ==================== CHAT REPORT ====================

def list_reports(status=None, page=1, page_size=20):
    """Danh sách báo cáo vi phạm, lọc theo status, phân trang."""
    qs = ChatReport.objects.select_related(
        "message", "message__sender", "message__room__course", "reporter"
    ).order_by("-created_at")

    if status:
        qs = qs.filter(status=status)

    total = qs.count()
    start = (page - 1) * page_size
    end = start + page_size
    items = list(qs[start:end])

    return {"items": items, "total": total, "page": page, "page_size": page_size, "has_next": end < total}


def get_report_by_id(report_id):
    """Lấy báo cáo theo id (kèm message + sender)."""
    return ChatReport.objects.select_related("message", "message__sender").filter(id=report_id).first()


def update_report(report, **fields):
    """Cập nhật các field của báo cáo và lưu."""
    for key, value in fields.items():
        if value is not None:
            setattr(report, key, value)
    report.save()
    return report


def create_report(message, reporter, reason):
    """Tạo báo cáo vi phạm."""
    return ChatReport.objects.create(message=message, reporter=reporter, reason=reason)


# ==================== USER / NOTIFICATION (xử lý báo cáo) ====================

def set_user_active(user, is_active):
    """Bật/tắt trạng thái hoạt động của user."""
    user.is_active = is_active
    user.save(update_fields=["is_active"])
    return user


def create_system_notification(recipient, title, body):
    """Tạo Notification trong-app kiểu SYSTEM."""
    from apps.notifications.models import Notification

    Notification.objects.create(
        recipient=recipient, title=title, body=body,
        notification_type=Notification.Type.SYSTEM,
        channel=Notification.Channel.EMAIL,
        send_status=Notification.SendStatus.SENT,
    )
