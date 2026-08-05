from rest_framework import serializers
from apps.support.models import SupportRequest


class SupportRequestSerializer(serializers.ModelSerializer):
    """Serializer cho yêu cầu hỗ trợ (SupportRequest).

    Bổ sung các trường thông tin hiển thị lấy từ quan hệ: tên/email người dùng,
    tên người phụ trách và thông tin giao dịch liên quan (nếu có).
    """
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.get_full_name", read_only=True)
    transaction_course_title = serializers.CharField(source="transaction.course.title", read_only=True)
    transaction_status = serializers.CharField(source="transaction.status", read_only=True, default=None)
    transaction_gross_amount = serializers.DecimalField(source="transaction.gross_amount", max_digits=12, decimal_places=2, read_only=True, default=None)
    transaction_paid_at = serializers.DateTimeField(source="transaction.paid_at", read_only=True, default=None)
    transaction_created_at = serializers.DateTimeField(source="transaction.created_at", read_only=True, default=None)
    transaction_hold_time = serializers.DateTimeField(source="transaction.hold_time", read_only=True, default=None)

    class Meta:
        model = SupportRequest
        fields = [
            "id", "request_type", "status", "user", "user_name", "user_email",
            "title", "description", "transaction", "transaction_course_title",
            "transaction_status", "transaction_gross_amount",
            "transaction_paid_at", "transaction_created_at", "transaction_hold_time",
            "assigned_to", "assigned_to_name", "resolution_note",
            "resolved_at", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "user", "status", "assigned_to", "resolved_at", "created_at", "updated_at"]


class SupportRequestCreateSerializer(serializers.Serializer):
    """Serializer dùng để tạo mới một yêu cầu hỗ trợ.

    - request_type: loại yêu cầu (REFUND, TECHNICAL, COMPLAINT, OTHER).
    - title: tiêu đề yêu cầu (tùy chọn).
    - description: mô tả chi tiết (bắt buộc).
    - transaction_id: ID giao dịch liên quan (tùy chọn).
    """
    request_type = serializers.ChoiceField(choices=["REFUND", "TECHNICAL", "COMPLAINT", "OTHER"])
    title = serializers.CharField(required=False, allow_blank=True, max_length=200)
    description = serializers.CharField(required=True, max_length=5000)
    transaction_id = serializers.CharField(required=False, allow_null=True)


class SupportRequestProcessSerializer(serializers.Serializer):
    """Serializer dùng để xử lý một yêu cầu hỗ trợ bởi admin.

    - status: trạng thái mới của yêu cầu (PROCESSING, RESOLVED, REJECTED).
    - resolution_note: ghi chú giải quyết (bắt buộc).
    """
    status = serializers.ChoiceField(choices=["PROCESSING", "RESOLVED", "REJECTED"])
    resolution_note = serializers.CharField(required=True, max_length=5000)