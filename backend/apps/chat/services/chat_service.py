"""Dich vu chat theo khoa - business logic, tach ORM sang repositories."""
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework.exceptions import NotFound, PermissionDenied

from apps.chat.repositories import chat_repository as repo


def _is_admin(user):
    """Chỉ SUPERADMIN và USER_MANAGER xem được TẤT CẢ phòng chat."""
    return bool(user and user.role and user.role.code in ("SUPERADMIN", "USER_MANAGER"))


def _can_see_all_rooms(user):
    """SUPERADMIN + USER_MANAGER xem toàn bộ phòng chat.

    COURSE_ADMIN KHÔNG được xem tất cả — chỉ xem khóa được phân công/tạo.
    """
    return _is_admin(user)


def user_can_access_chat(user, course):
    """Kiểm tra người dùng có quyền truy cập phòng chat không.

    - SUPERADMIN / USER_MANAGER: toàn bộ.
    - Giảng viên được phân công / người tạo khóa (bao gồm COURSE_ADMIN nếu tạo/phân công).
    - Học viên đã mua (enrollment ACTIVE/COMPLETED) và còn hạn học.
    """
    if not user or not user.is_authenticated:
        return False
    # Admin xem tất cả
    if _can_see_all_rooms(user):
        return True
    # Giảng viên được phân công / người tạo khóa
    if course.assigned_instructor_id == user.id or course.created_by_id == user.id:
        return True
    # Học viên còn hạn học
    return repo.user_has_active_enrollment(user, course)


def get_or_create_room(user, course):
    if not user_can_access_chat(user, course):
        raise PermissionDenied("Không có quyền truy cập phòng chat này.")
    return repo.get_or_create_room(course)


def get_rooms_for_user(user):
    """Danh sách phòng chat của user — TỰ ĐỘNG TẠO phòng nếu chưa tồn tại.

    - ADMIN (SUPERADMIN, USER_MANAGER): tất cả khóa PUBLISHED.
    - INSTRUCTOR / COURSE_ADMIN: khóa được phân công hoặc tạo.
    - STUDENT: khóa đã mua (enrollment ACTIVE/COMPLETED) còn hạn học.
    """
    # 1) Xác định danh sách course user được quyền truy cập
    if _can_see_all_rooms(user):
        course_ids = repo.get_published_course_ids()
    else:
        enrolled_course_ids = repo.get_enrolled_course_ids(user)
        owned_course_ids = repo.get_owned_or_assigned_course_ids(user)

        # Gộp + loại trùng
        all_course_ids = set(enrolled_course_ids) | set(owned_course_ids)
        if not all_course_ids:
            return repo.none_rooms()
        course_ids = all_course_ids

    courses = repo.get_courses_by_ids_ids_only(course_ids)

    # 2) Đảm bảo phòng tồn tại cho từng khóa (create nếu chưa có)
    room_map = {}
    for course in courses:
        room = repo.get_or_create_room(course)
        room_map[room.course_id] = room

    # 3) Trả về danh sách phòng đã đảm bảo tồn tại
    room_ids = [r.id for r in room_map.values()]
    return repo.get_rooms_by_ids(room_ids)


def build_message_payload(message):
    """Tạo payload tin nhắn chuẩn để broadcast realtime (giống ChatConsumer)."""
    s = message.sender
    return {
        "type": "new_message",
        "message": {
            "id": str(message.id),
            "room": str(message.room_id),
            "sender_id": str(s.id),
            "sender_name": s.get_full_name() or s.email,
            "sender_avatar": getattr(s, "avatar_url", None),
            "message_type": message.message_type,
            "content": message.content,
            "audio_url": message.audio_url,
            "audio_duration": message.audio_duration,
            "audio_format": message.audio_format,
            "replied_to": str(message.replied_to_id) if message.replied_to_id else None,
            "sent_at": message.sent_at.isoformat() if message.sent_at else None,
        },
    }


def broadcast_message(room, message):
    """Broadcast tin nhắn realtime tới group chat_{course_id} (từ REST/sync context)."""
    try:
        channel_layer = get_channel_layer()
        group_name = f"chat_{room.course_id}"
        async_to_sync(channel_layer.group_send)(
            group_name,
            {"type": "chat_message", "data": build_message_payload(message)},
        )
    except Exception:
        # Broadcast lỗi không làm hỏng luồng lưu tin nhắn
        pass


def get_messages(user, room_id, page=1, page_size=50):
    room = repo.get_room_by_id(room_id)
    if not room:
        raise NotFound("Không tìm thấy phòng chat.")
    if not user_can_access_chat(user, room.course):
        raise PermissionDenied("Không có quyền xem tin nhắn phòng chat này.")
    return repo.get_messages_for_room(room, page, page_size)


def create_text_message(user, room_id, content):
    """ Luu tin nhan TEXT vao DB truoc - DB la source of truth."""
    content = (content or "").strip()
    if not content:
        raise PermissionDenied("Nội dung tin nhắn không được để trống.")
    if len(content) > 1000:
        raise PermissionDenied("Tin nhắn tối đa 1000 ký tự.")

    room = repo.get_room_by_id(room_id)
    if not room:
        raise NotFound("Không tìm thấy phòng chat.")
    if not user_can_access_chat(user, room.course):
        raise PermissionDenied("Không có quyền gửi tin nhắn phòng chat này.")

    message = repo.create_text_message(room, user, content)
    broadcast_message(room, message)
    return message


def create_voice_message(user, room_id, audio_url, duration, audio_format, replied_to_id=None):
    room = repo.get_room_by_id(room_id)
    if not room:
        raise NotFound("Không tìm thấy phòng chat.")
    if not user_can_access_chat(user, room.course):
        raise PermissionDenied("Không có quyền gửi tin nhắn phòng chat này.")
    if duration and duration > 300:
        raise PermissionDenied("Tin nhắn thoại tối đa 5 phút.")

    replied_to = repo.get_replied_message(room, replied_to_id) if replied_to_id else None

    message = repo.create_voice_message(room, user, audio_url, duration, audio_format, replied_to=replied_to)
    broadcast_message(room, message)
    return message


def report_message(user, message_id, reason):
    """Báo cáo tin nhắn vi phạm."""
    reason = (reason or "").strip()
    if not reason:
        raise PermissionDenied("Vui lòng nhập lý do báo cáo.")

    message = repo.get_message_by_id_with_room(message_id)
    if not message:
        raise NotFound("Không tìm thấy tin nhắn.")
    if not user_can_access_chat(user, message.room.course):
        raise PermissionDenied("Không có quyền báo cáo tin nhắn này.")
    if message.sender_id == user.id:
        raise PermissionDenied("Không thể báo cáo tin nhắn của chính bạn.")

    return repo.create_report(message, user, reason)