from decimal import Decimal

from django.utils import timezone
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from apps.common.base_api_view import BasePermissionAPIView
from apps.payments.models import PaymentTransaction
from apps.payments.repositories import payment_repository
from apps.payments.services import payment_service
from apps.payments.services import stripe_payment_service
from apps.payments.serializers.payment_serializer import (
    PaymentTransactionSerializer,
    AdminTransactionSerializer,
    InstructorRevenueSerializer,
)
from apps.courses.models import Course


def _is_finance_admin(user):
    """Kiểm tra user có role FINANCE_ADMIN hoặc SUPERADMIN không."""
    return user.role and user.role.code in ["FINANCE_ADMIN", "SUPERADMIN"]

# ==================== STRIPE ====================

class StripeCheckoutAPIView(APIView):
    """
    POST /api/payments/stripe/courses/{course_id}/checkout/
    Tạo Stripe Checkout Session.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id):
        try:
            course = Course.objects.get(id=course_id, status=Course.Status.PUBLISHED)
        except Course.DoesNotExist:
            return Response(
                {"success": False, "message": "Không tìm thấy khóa học."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if course.price <= 0:
            return Response(
                {"success": False, "message": "Khóa học miễn phí. Vui lòng sử dụng đăng ký miễn phí."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = stripe_payment_service.create_checkout_session(request.user, course)
            return Response({
                "success": True,
                "message": "Tạo phiên thanh toán Stripe thành công.",
                "data": result,
            }, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response(
                {"success": False, "message": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class StripeWebhookAPIView(APIView):
    """
    POST /api/payments/stripe/webhook/
    Xử lý Stripe webhook event.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        try:
            result = stripe_payment_service.handle_webhook(payload, sig_header)
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class StripeVerifyAPIView(APIView):
    """
    POST /api/payments/stripe/verify/
    Verify Stripe session (fallback cho dev/demo).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        session_id = request.data.get("session_id")
        if not session_id:
            return Response(
                {"success": False, "message": "Thiếu session_id."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            transaction = stripe_payment_service.verify_session(session_id)
            return Response({
                "success": True,
                "message": "Thanh toán thành công. Bạn đã được mở quyền học.",
                "data": {
                    "transaction_id": transaction.id,
                    "redirect_url": f"/courses/{transaction.course.id}/learn",
                },
            }, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response(
                {"success": False, "message": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


# ==================== TRANSACTION DETAIL ====================

class TransactionDetailAPIView(APIView):
    """
    GET /api/payments/transactions/{transaction_id}/
    Xem chi tiết giao dịch.
    - User chỉ xem giao dịch của mình.
    - Finance Admin/Admin xem được tất cả.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, transaction_id):
        try:
            transaction = payment_repository.get_by_id(transaction_id)
        except Exception:
            return Response(
                {"success": False, "message": "Không tìm thấy giao dịch."},
                status=status.HTTP_404_NOT_FOUND,
            )

        is_admin = _is_finance_admin(request.user) or (
            request.user.role and request.user.role.code == "SUPERADMIN"
        )
        if transaction.student_id != request.user.id and not is_admin:
            return Response(
                {"success": False, "message": "Bạn không có quyền xem giao dịch này."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = PaymentTransactionSerializer(transaction)
        return Response({
            "success": True,
            "data": serializer.data,
        }, status=status.HTTP_200_OK)


# ==================== ADMIN TRANSACTIONS ====================

class AdminTransactionListAPIView(BasePermissionAPIView):
    """
    GET /api/payments/admin/transactions/
    Danh sách giao dịch cho Finance Admin.
    Filter: status, provider, course, student, date_from, date_to
    """
    required_permission = "finance.finance.revenue_view"

    def get(self, request):
        filters = {}
        for key in ["status", "provider", "course", "student", "date_from", "date_to"]:
            val = request.query_params.get(key)
            if val:
                filters[key] = val

        transactions = payment_repository.get_all_for_admin(filters)
        serializer = AdminTransactionSerializer(transactions, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
        }, status=status.HTTP_200_OK)


class MarkTransactionPaidAPIView(BasePermissionAPIView):
    """
    POST /api/payments/admin/transactions/{transaction_id}/mark-paid/
    Finance Admin đánh dấu transaction đã thanh toán cho instructor.
    """
    required_permission = "finance.finance.revenue_view"

    def post(self, request, transaction_id):
        try:
            transaction = payment_repository.get_by_id(transaction_id)
        except Exception:
            return Response(
                {"success": False, "message": "Không tìm thấy giao dịch."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if transaction.status != PaymentTransaction.Status.HOLD:
            return Response(
                {"success": False, "message": "Chỉ có thể đánh dấu thanh toán cho giao dịch đang giữ tiền."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if transaction.hold_time and transaction.hold_time > timezone.now():
            return Response(
                {"success": False, "message": "Giao dịch vẫn đang trong thời gian giữ tiền 7 ngày."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment_repository.update(transaction, status=PaymentTransaction.Status.PAID)
        return Response({
            "success": True,
            "message": "Đã đánh dấu giao dịch đã thanh toán cho giảng viên.",
        }, status=status.HTTP_200_OK)


# ==================== INSTRUCTOR REVENUE ====================

class InstructorRevenueAPIView(BasePermissionAPIView):
    """
    GET /api/payments/instructor/revenue/
    Xem doanh thu của instructor hiện tại.
    """
    required_permission = "user.instructor.sales_history"

    def get(self, request):
        revenue = payment_service.get_instructor_revenue(request.user.id)
        serializer = InstructorRevenueSerializer(revenue)
        return Response({
            "success": True,
            "data": serializer.data,
        }, status=status.HTTP_200_OK)