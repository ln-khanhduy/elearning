from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.common.base_api_view import BasePermissionAPIView
from apps.common.response_helpers import success_response, error_response
from apps.system.services import admin_log_service

from apps.promotions.services import coupon_service
from apps.promotions.serializers.coupon_serializer import (
    CouponListSerializer, CouponDetailSerializer,
    CouponCreateUpdateSerializer, CouponValidateSerializer, CouponApplySerializer,
)


# ==================== COUPON MANAGEMENT API ====================


class AdminCouponListAPIView(BasePermissionAPIView):
    required_permission = "finance.coupon.view"

    def get(self, request):
        coupons = coupon_service.get_coupons()
        serializer = CouponListSerializer(coupons, many=True)
        return success_response(serializer.data)


class AdminCouponCreateAPIView(BasePermissionAPIView):
    required_permission = "finance.coupon.manage"

    def post(self, request):
        serializer = CouponCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        coupon = coupon_service.create_coupon(request.user, serializer.validated_data)
        admin_log_service.log(
            admin=request.user,
            action_type='COUPON_CREATE',
            detail=f"{request.user.email} đã tạo mã giảm giá '{coupon.code}' (ID: {coupon.id})",
            target_id=str(coupon.id),
            target_type='Coupon',
        )
        return success_response(
            CouponDetailSerializer(coupon).data,
            "Tạo mã giảm giá thành công.",
            status.HTTP_201_CREATED
        )


class AdminCouponDetailAPIView(BasePermissionAPIView):
    required_permission = "finance.coupon.view"

    def get(self, request, coupon_id):
        coupon = coupon_service.get_coupon_detail(coupon_id)
        return success_response(CouponDetailSerializer(coupon).data)


class AdminCouponUpdateAPIView(BasePermissionAPIView):
    required_permission = "finance.coupon.manage"

    def patch(self, request, coupon_id):
        serializer = CouponCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        coupon = coupon_service.update_coupon(coupon_id, serializer.validated_data)
        admin_log_service.log(
            admin=request.user,
            action_type='COUPON_UPDATE',
            detail=f"Admin {request.user.email} đã cập nhật mã giảm giá '{coupon.code}' (ID: {coupon.id})",
            target_id=str(coupon.id),
            target_type='Coupon',
        )
        return success_response(
            CouponDetailSerializer(coupon).data,
            "Cập nhật mã giảm giá thành công.",
        )


class AdminCouponDeleteAPIView(BasePermissionAPIView):
    required_permission = "finance.coupon.manage"

    def delete(self, request, coupon_id):
        coupon = coupon_service.get_coupon_detail(coupon_id)
        coupon_code = coupon.code
        coupon_id_str = str(coupon.id)
        coupon_service.delete_coupon(coupon_id)
        admin_log_service.log(
            admin=request.user,
            action_type='COUPON_DELETE',
            detail=f"Admin {request.user.email} đã xóa mã giảm giá '{coupon_code}' (ID: {coupon_id_str})",
            target_id=coupon_id_str,
            target_type='Coupon',
        )
        return success_response(None, "Xóa mã giảm giá thành công.")


# ==================== PUBLIC COUPON API ====================


class CouponValidateAPIView(APIView):
    """API kiểm tra mã giảm giá (public, yêu cầu đăng nhập)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CouponValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data["code"]
        course_ids = serializer.validated_data.get("course_ids")

        is_valid, error, coupon_info = coupon_service.validate_coupon(code, request.user, course_ids)
        if not is_valid:
            return error_response(error)

        return success_response(coupon_info, "Mã giảm giá hợp lệ.")


class CouponApplyAPIView(APIView):
    """API áp dụng mã giảm giá (public, yêu cầu đăng nhập)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CouponApplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data["code"]
        cart_total = serializer.validated_data["cart_total"]
        course_ids = serializer.validated_data.get("course_ids")

        result = coupon_service.apply_coupon_to_cart(code, request.user, cart_total, course_ids)
        if not result["success"]:
            return error_response(result["message"])

        return success_response(result, "Áp dụng mã giảm giá thành công.")