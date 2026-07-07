from rest_framework import serializers
from apps.support.models import SupportRequest


class SupportRequestSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.get_full_name", read_only=True)
    transaction_course_title = serializers.CharField(source="transaction.course.title", read_only=True)

    class Meta:
        model = SupportRequest
        fields = [
            "id", "request_type", "status", "user", "user_name", "user_email",
            "title", "description", "transaction", "transaction_course_title",
            "assigned_to", "assigned_to_name", "resolution_note",
            "resolved_at", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "user", "status", "assigned_to", "resolved_at", "created_at", "updated_at"]


class SupportRequestCreateSerializer(serializers.Serializer):
    request_type = serializers.ChoiceField(choices=["REFUND", "TECHNICAL", "COMPLAINT", "OTHER"])
    title = serializers.CharField(required=False, allow_blank=True, max_length=200)
    description = serializers.CharField(required=True, max_length=5000)
    transaction_id = serializers.CharField(required=False, allow_null=True)


class SupportRequestProcessSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["PROCESSING", "RESOLVED", "REJECTED"])
    resolution_note = serializers.CharField(required=True, max_length=5000)