from rest_framework import serializers
from apps.promotions.models import Coupon


class CouponListSerializer(serializers.ModelSerializer):
    """Serializer cho danh sách coupon."""

    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = Coupon
        fields = [
            "id", "code", "discount_type", "discount_value",
            "max_usage_count", "used_count", "max_uses_per_user",
            "min_order_amount", "is_active", "is_expired",
            "start_date", "end_date", "description",
            "created_by_name", "created_at", "updated_at",
        ]

    def get_is_expired(self, obj):
        from django.utils import timezone
        return timezone.now() > obj.end_date


class CouponDetailSerializer(serializers.ModelSerializer):
    """Serializer cho chi tiết coupon."""

    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)
    is_expired = serializers.SerializerMethodField()
    applicable_course_ids = serializers.SerializerMethodField()

    class Meta:
        model = Coupon
        fields = [
            "id", "code", "discount_type", "discount_value",
            "max_usage_count", "used_count", "max_uses_per_user",
            "min_order_amount", "is_active", "is_expired",
            "start_date", "end_date", "description",
            "applicable_course_ids",
            "created_by_name", "created_at", "updated_at",
        ]

    def get_is_expired(self, obj):
        from django.utils import timezone
        return timezone.now() > obj.end_date

    def get_applicable_course_ids(self, obj):
        return list(obj.applicable_courses.values_list("id", flat=True))


class CouponCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer cho tạo/cập nhật coupon."""

    class Meta:
        model = Coupon
        fields = [
            "code", "discount_type", "discount_value",
            "max_usage_count", "max_uses_per_user",
            "min_order_amount", "applicable_courses",
            "start_date", "end_date", "is_active", "description",
        ]

    def validate_code(self, value):
        """Kiểm tra mã code không trùng."""
        from apps.promotions.repositories import coupon_repository
        if self.instance:
            if self.instance.code != value and coupon_repository.exists_by_code(value):
                raise serializers.ValidationError("Mã giảm giá này đã tồn tại.")
        else:
            if coupon_repository.exists_by_code(value):
                raise serializers.ValidationError("Mã giảm giá này đã tồn tại.")
        return value

    def validate_discount_value(self, value):
        """Kiểm tra giá trị giảm hợp lệ."""
        if value <= 0:
            raise serializers.ValidationError("Giá trị giảm phải lớn hơn 0.")
        return value


class CouponValidateSerializer(serializers.Serializer):
    """Serializer cho validate mã giảm giá."""

    code = serializers.CharField(max_length=50)
    course_ids = serializers.ListField(
        child=serializers.CharField(), required=False
    )


class CouponApplySerializer(serializers.Serializer):
    """Serializer cho áp dụng mã giảm giá."""

    code = serializers.CharField(max_length=50)
    cart_total = serializers.DecimalField(max_digits=12, decimal_places=2)
    course_ids = serializers.ListField(
        child=serializers.CharField(), required=False
    )