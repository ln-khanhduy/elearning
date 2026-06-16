from rest_framework import serializers
from apps.payments.models import PaymentTransaction


class PaymentTransactionSerializer(serializers.ModelSerializer):
    """Serializer cho PaymentTransaction - dùng cho student xem giao dịch của mình."""
    course_title = serializers.CharField(source="course.title", read_only=True)
    course_thumbnail = serializers.SerializerMethodField()
    student_name = serializers.CharField(source="student.get_full_name", read_only=True)

    class Meta:
        model = PaymentTransaction
        fields = [
            "id", "course", "course_title", "course_thumbnail",
            "student", "student_name",
            "provider", "provider_transaction_id",
            "gross_amount", "payment_fee_amount", "tax_amount",
            "net_amount", "platform_fee_amount", "instructor_share_amount",
            "status", "hold_time", "paid_at",
            "created_at", "updated_at",
        ]
        read_only_fields = fields

    def get_course_thumbnail(self, obj):
        return obj.course.thumbnail.url if obj.course.thumbnail else None


class AdminTransactionSerializer(serializers.ModelSerializer):
    """Serializer cho Finance Admin - xem toàn bộ giao dịch."""
    course_title = serializers.CharField(source="course.title", read_only=True)
    course_thumbnail = serializers.SerializerMethodField()
    student_name = serializers.CharField(source="student.get_full_name", read_only=True)
    instructor_name = serializers.CharField(source="course.instructor.get_full_name", read_only=True)

    class Meta:
        model = PaymentTransaction
        fields = [
            "id", "course", "course_title", "course_thumbnail",
            "student", "student_name",
            "instructor_name",
            "provider", "provider_transaction_id",
            "gross_amount", "payment_fee_amount", "tax_amount",
            "net_amount", "platform_fee_amount", "instructor_share_amount",
            "status", "hold_time", "paid_at",
            "refunded_at", "refund_reason", "refund_requested_at",
            "refund_reviewed_by", "refund_reviewed_at",
            "created_at", "updated_at",
        ]
        read_only_fields = fields

    def get_course_thumbnail(self, obj):
        return obj.course.thumbnail.url if obj.course.thumbnail else None


class InstructorRevenueSerializer(serializers.Serializer):
    """Serializer cho instructor revenue - tổng hợp doanh thu."""
    total_hold = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_available = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_refunded = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_transactions = serializers.IntegerField()
    transactions = serializers.ListField(child=serializers.DictField())
