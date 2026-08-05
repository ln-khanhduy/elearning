from rest_framework import serializers
from apps.payments.models import PaymentTransaction


class PaymentTransactionSerializer(serializers.ModelSerializer):
    """Serializer cho PaymentTransaction - dùng cho student xem giao dịch của mình."""
    course_title = serializers.CharField(source="course.title", read_only=True)
    course_thumbnail = serializers.SerializerMethodField()
    student_name = serializers.CharField(source="student.get_full_name", read_only=True)
    coupon_usages = serializers.SerializerMethodField()

    class Meta:
        model = PaymentTransaction
        fields = [
            "id", "course", "course_title", "course_thumbnail",
            "student", "student_name",
            "provider", "provider_transaction_id",
            "gross_amount", "payment_fee_amount", "tax_amount",
            "net_amount", "platform_fee_amount", "instructor_share_amount",
            "coupon_usages",
            "status", "hold_time", "paid_at",
            "created_at", "updated_at",
        ]
        read_only_fields = fields

    def get_coupon_usages(self, obj):
        return [
            {
                "code": u.coupon.code,
                "discount_amount": u.discount_amount,
                "used_at": u.used_at,
            }
            for u in obj.coupon_usages.select_related("coupon").all()
        ]

    def get_course_thumbnail(self, obj):
        return obj.course.thumbnail.url if obj.course.thumbnail else None


class AdminTransactionSerializer(serializers.ModelSerializer):
    """Serializer cho Finance Admin - xem toàn bộ giao dịch."""
    course_title = serializers.CharField(source="course.title", read_only=True)
    course_thumbnail = serializers.SerializerMethodField()
    student_name = serializers.CharField(source="student.get_full_name", read_only=True)
    instructor_name = serializers.SerializerMethodField()

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

    def get_instructor_name(self, obj):
        instructor = obj.course.assigned_instructor
        return instructor.get_full_name() if instructor else None

    def get_course_thumbnail(self, obj):
        return obj.course.thumbnail.url if obj.course.thumbnail else None


class InstructorRevenueSerializer(serializers.Serializer):
    """Serializer cho instructor revenue - tổng hợp doanh thu."""
    total_hold = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_available = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_refunded = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_transactions = serializers.IntegerField()
    transactions = serializers.ListField(child=serializers.DictField())


class InstructorPayoutTransactionSerializer(serializers.ModelSerializer):
    """Serializer cho 1 giao dịch trong payout của giảng viên."""
    course_title = serializers.CharField(source="course.title", read_only=True)
    student_name = serializers.CharField(source="student.get_full_name", read_only=True)

    class Meta:
        model = PaymentTransaction
        fields = [
            "id", "course", "course_title", "student_name",
            "gross_amount", "instructor_share_amount",
            "status", "hold_time", "created_at",
        ]
        read_only_fields = fields


class InstructorPayoutGroupSerializer(serializers.Serializer):
    """Serializer cho nhóm payout theo 1 giảng viên - kèm thông tin ngân hàng."""
    instructor_id = serializers.CharField()
    instructor_name = serializers.CharField()
    instructor_email = serializers.EmailField()
    bank_name = serializers.CharField(allow_null=True, allow_blank=True)
    bank_account_number = serializers.CharField(allow_null=True, allow_blank=True)
    bank_account_name = serializers.CharField(allow_null=True, allow_blank=True)
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    transaction_count = serializers.IntegerField()
    transactions = InstructorPayoutTransactionSerializer(many=True)