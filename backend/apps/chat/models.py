import uuid6

from django.conf import settings
from django.db import models


class ChatRoom(models.Model):
    """
    Phòng chat theo khóa học - mỗi khóa có đúng 1 phòng chat.
    Thành viên: học viên còn hạn + giảng viên được phân công.
    """

    id = models.UUIDField(primary_key=True, default=uuid6.uuid7, editable=False)
    course = models.OneToOneField(
        "courses.Course",
        on_delete=models.CASCADE,
        related_name="chat_room",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chat_room"

    def __str__(self):
        return f"ChatRoom: {self.course_id}"


class ChatMessage(models.Model):
    """
    Tin nhắn chat - Database là source of truth.
    Bắt buộc lưu vào DB trước khi broadcast realtime.
    """

    class MessageType(models.TextChoices):
        TEXT = "TEXT", "Văn bản"
        VOICE = "VOICE", "Giọng nói"

    id = models.UUIDField(primary_key=True, default=uuid6.uuid7, editable=False)
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_messages",
    )
    message_type = models.CharField(max_length=20, choices=MessageType.choices, default=MessageType.TEXT)
    # Văn bản (≤1000 ký tự) — CHỈ dùng cho TEXT
    content = models.TextField(null=True, blank=True)
    # Voice — lưu trên Cloudinary, thư mục `voice`
    audio_url = models.URLField(null=True, blank=True)
    audio_duration = models.PositiveIntegerField(null=True, blank=True)  # giây (≤300s = 5 phút)
    audio_format = models.CharField(max_length=20, null=True, blank=True)  # VD: mp3, wav
    # Trả lời một tin nhắn câu hỏi (optional)
    replied_to = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="replies",
    )
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chat_message"
        ordering = ["sent_at"]
        indexes = [
            models.Index(fields=["room", "sent_at"]),
        ]

    def __str__(self):
        return f"{self.sender_id} -> {self.room_id} ({self.message_type})"


class ChatReport(models.Model):
    """
    Báo cáo vi phạm tin nhắn chat.
    Phạm vi: trong khóa. USER_MANAGER xử lý.
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Chờ xử lý"
        REVIEWED = "REVIEWED", "Đã xác minh"
        RESOLVED = "RESOLVED", "Đã xử lý"
        REJECTED = "REJECTED", "Từ chối báo cáo"

    class ActionTaken(models.TextChoices):
        WARNING = "WARNING", "Cảnh cáo"
        LOCK_3D = "LOCK_3D", "Khóa 3 ngày"
        LOCK_7D = "LOCK_7D", "Khóa 1 tuần"
        LOCK_FOREVER = "LOCK_FOREVER", "Khóa vĩnh viễn (thu hồi chứng chỉ)"

    id = models.UUIDField(primary_key=True, default=uuid6.uuid7, editable=False)
    message = models.ForeignKey(ChatMessage, on_delete=models.CASCADE, related_name="reports")
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_reports_made",
    )
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    handled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="chat_reports_handled",
    )
    action_taken = models.CharField(max_length=20, choices=ActionTaken.choices, null=True, blank=True)
    resolution_note = models.TextField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chat_report"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report {self.reporter_id} on msg {self.message_id} ({self.status})"


class QuestionQueueItem(models.Model):
    """
    Hàng đợi câu hỏi chờ giảng viên trực trả lời.
    Câu hỏi ngoài khung giờ -> QUEUED -> giảng viên trực trả lời -> ANSWERED.
    """

    class Status(models.TextChoices):
        QUEUED = "QUEUED", "Chờ trả lời"
        ANSWERED = "ANSWERED", "Đã trả lời"
        EXPIRED = "EXPIRED", "Hết hạn (không còn quyền)"

    id = models.UUIDField(primary_key=True, default=uuid6.uuid7, editable=False)
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="question_queue")
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="question_queue_items",
    )
    message = models.ForeignKey(ChatMessage, on_delete=models.CASCADE, related_name="queued_as_question")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.QUEUED)
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="answered_questions",
    )
    answered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "question_queue_item"
        ordering = ["created_at"]

    def __str__(self):
        return f"Q {self.student_id} ({self.status})"