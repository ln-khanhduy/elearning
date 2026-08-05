from decimal import Decimal

from django.utils import timezone
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from apps.common.base_api_view import BasePermissionAPIView
from apps.common.response_helpers import success_response, error_response
from apps.payments.models import PaymentTransaction
from apps.payments.repositories import payment_repository
from apps.payments.services import payment_service
from apps.payments.services import stripe_payment_service
from apps.payments.serializers.payment_serializer import (
    PaymentTransactionSerializer,
    AdminTransactionSerializer,
    InstructorRevenueSerializer,
    InstructorPayoutGroupSerializer,
)
from apps.courses.models import Course


def _is_finance_admin(user):
    """Kiểm tra user có role FINANCE_ADMIN hoặc SUPERADMIN không."""
    return user.role and user.role.code in ["FINANCE_ADMIN", "SUPERADMIN"]

# ==================== STRIPE ====================

class StripeCheckoutAPIView(BasePermissionAPIView):
    """
    POST /api/payments/stripe/courses/{course_id}/checkout/
    Tạo Stripe Checkout Session.
    Yêu cầu quyền mua khóa học: student.course.buy
    """
    required_permission = "student.course.buy"

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
            result = stripe_payment_service.create_checkout_session(request.user, course, coupon_code=request.data.get("coupon_code"))
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


class StripeCartCheckoutAPIView(BasePermissionAPIView):
    """
    POST /api/payments/stripe/cart/checkout/
    Tạo Stripe Checkout Session cho nhiều khóa học (thanh toán giỏ hàng).
    Body: { "course_ids": [1,2,3], "coupon_code": "..." }
    Yêu cầu quyền mua khóa học: student.course.buy
    """
    required_permission = "student.course.buy"

    def post(self, request):
        course_ids = request.data.get("course_ids") or []
        coupon_code = request.data.get("coupon_code") or ""
        if not course_ids:
            return Response(
                {"success": False, "message": "Vui lòng chọn khóa học để thanh toán."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = stripe_payment_service.create_cart_checkout_session(
                request.user, course_ids, coupon_code=coupon_code
            )
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
        except Exception as e:
            return Response(
                {"success": False, "message": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class StripeWebhookAPIView(APIView):
    """
    POST /api/payments/stripe/webhook/
    Xử lý Stripe webhook event.

    Trả về:
    - 200: xử lý thành công.
    - 400: signature không hợp lệ → Stripe KHÔNG retry (lỗi không thể sửa).
    - 500: lỗi xử lý tạm thời → Stripe TỰ ĐỘNG retry event đến khi thành công
      (đảm bảo giao dịch/coupon được hoàn tất, chống mất dữ liệu như lỗi trước đây).
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        try:
            result = stripe_payment_service.handle_webhook(payload, sig_header)
            return Response(result, status=status.HTTP_200_OK)
        except stripe_payment_service.InvalidWebhookSignatureError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            # Lỗi xử lý (Stripe tạm lỗi, DB lỗi, ...) → HTTP 500 để Stripe retry.
            # KHÔNG trả 400 vì Stripe sẽ bỏ event và không bao giờ thử lại.
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
            is_cart = stripe_payment_service.is_cart_checkout_session(session_id)
            transaction = stripe_payment_service.verify_session(session_id)
            return Response({
                "success": True,
                "message": "Thanh toán thành công. Bạn đã được mở quyền học.",
                "data": {
                    "transaction_id": transaction.id,
                    "redirect_url": (
                        "/my-courses" if is_cart
                        else f"/courses/{transaction.course.id}/learn"
                    ),
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


# ==================== PAYOUT ====================

class AdminPayoutListAPIView(BasePermissionAPIView):
    """
    GET /api/payments/admin/payouts/
    Danh sách giảng viên đủ điều kiện thanh toán (HOLD đã hết hạn, có giảng viên).
    Nhóm theo từng giảng viên, kèm thông tin ngân hàng, tổng tiền và danh sách giao dịch.
    """
    required_permission = "finance.finance.payout"

    def get(self, request):
        grouped = payment_repository.get_eligible_payouts_grouped_by_instructor()
        serializer = InstructorPayoutGroupSerializer(list(grouped.values()), many=True)
        return Response({
            "success": True,
            "data": serializer.data,
        }, status=status.HTTP_200_OK)


class AdminInstructorPayoutAPIView(BasePermissionAPIView):
    """
    POST /api/payments/admin/payouts/instructor/{instructor_id}/pay/
    Thanh toán cho 1 giảng viên - bắt buộc xác nhận thông tin ngân hàng trước khi thanh toán.
    Body: { "transaction_ids": ["uuid1", "uuid2", ...],
            "confirmed_bank_name": "...", "confirmed_account_number": "...", "confirmed_account_name": "..." }
    Chỉ xử lý các transaction HOLD đã hết hạn, thuộc instructor này.
    Backend kiểm tra lại thông tin ngân hàng xác nhận khớp với hồ sơ giảng viên trước khi chuyển PAID.
    """
    required_permission = "finance.finance.payout"

    def post(self, request, instructor_id):
        from apps.notifications import services as notif_service

        transaction_ids = request.data.get("transaction_ids", [])
        if not transaction_ids:
            return Response({
                "success": False, "message": "Vui lòng chọn giao dịch cần thanh toán.",
            }, status=status.HTTP_400_BAD_REQUEST)

        confirmed_bank_name = request.data.get("confirmed_bank_name")
        confirmed_account_number = request.data.get("confirmed_account_number")
        confirmed_account_name = request.data.get("confirmed_account_name")

        if not confirmed_bank_name or not confirmed_account_number or not confirmed_account_name:
            return Response({
                "success": False, "message": "Vui lòng xác nhận đầy đủ thông tin ngân hàng (tên ngân hàng, số tài khoản, tên chủ tài khoản).",
            }, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        # Chỉ lấy các transaction đủ điều kiện trong danh sách đã chọn, thuộc instructor này
        eligible = PaymentTransaction.objects.filter(
            id__in=transaction_ids,
            course__assigned_instructor_id=instructor_id,
            status=PaymentTransaction.Status.HOLD,
            hold_time__lte=now,
        ).select_related("student", "course", "course__assigned_instructor")

        if not eligible.exists():
            return Response({
                "success": False, "message": "Không có giao dịch nào đủ điều kiện thanh toán cho giảng viên này.",
            }, status=status.HTTP_400_BAD_REQUEST)

        instructor = eligible.first().course.assigned_instructor
        if not instructor:
            return Response({
                "success": False, "message": "Giảng viên không hợp lệ.",
            }, status=status.HTTP_400_BAD_REQUEST)

        profile = getattr(instructor, "instructor_profile", None)
        if profile is None or not profile.bank_name or not profile.bank_account_number or not profile.bank_account_name:
            return Response({
                "success": False, "message": "Giảng viên chưa cập nhật đầy đủ thông tin ngân hàng. Vui lòng yêu cầu giảng viên cập nhật hồ sơ trước khi thanh toán.",
            }, status=status.HTTP_400_BAD_REQUEST)

        # Kiểm tra thông tin xác nhận khớp với hồ sơ
        if (confirmed_bank_name.strip() != profile.bank_name.strip()
                or confirmed_account_number.strip() != profile.bank_account_number.strip()
                or confirmed_account_name.strip() != profile.bank_account_name.strip()):
            return Response({
                "success": False, "message": "Thông tin ngân hàng xác nhận không khớp với hồ sơ giảng viên. Vui lòng kiểm tra lại.",
            }, status=status.HTTP_400_BAD_REQUEST)

        def _fmt(amount):
            return f"{amount:,.0f}₫" if amount % 1 == 0 else f"{amount:,.2f}₫"

        ids = list(eligible.values_list("id", flat=True))
        total_amount = sum(float(t.instructor_share_amount or 0) for t in eligible)
        course_titles = [t.course.title for t in eligible if t.course]

        # Chuyển tiền thực tế qua Stripe Transfer đến Connected Account của giảng viên
        # (connected account ID tạm thời lưu trong bank_account_number)
        try:
            stripe_payment_service.transfer_to_instructor(
                profile.bank_account_number,
                total_amount,
                metadata={
                    "instructor_id": str(instructor.id),
                    "transaction_ids": ",".join(str(i) for i in ids),
                },
            )
        except ValueError as e:
            return Response({
                "success": False, "message": str(e),
            }, status=status.HTTP_400_BAD_REQUEST)

        # Batch update to PAID - chỉ sau khi Transfer thành công
        paid_count = payment_repository.mark_paid_for_instructor(instructor_id, ids, paid_at=now)

        try:
            notif_service.notify_payout_completed(instructor, _fmt(total_amount), ", ".join(course_titles))
        except Exception:
            pass
        return Response({
            "success": True,
            "message": f"Đã thanh toán {paid_count} giao dịch cho {instructor.get_full_name() or instructor.email}, tổng {_fmt(total_amount)}.",
            "data": {"paid_count": paid_count, "total_amount": total_amount},
        }, status=status.HTTP_200_OK)


# ==================== INSTRUCTOR REVENUE ====================

class InstructorRevenueAPIView(APIView):
    """
    GET /api/payments/instructor/revenue/
    Xem doanh thu của instructor hiện tại (chức năng cá nhân — chỉ cần đăng nhập).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        revenue = payment_service.get_instructor_revenue(request.user.id)
        serializer = InstructorRevenueSerializer(revenue)
        return Response({
            "success": True,
            "data": serializer.data,
        }, status=status.HTTP_200_OK)


class MyRefundableTransactionsAPIView(APIView):
    """
    GET /api/payments/my/refundable-transactions/
    Danh sách giao dịch của học viên hiện tại đủ điều kiện yêu cầu hoàn tiền
    (trạng thái HOLD còn trong thời hạn, hoặc PAID).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.system.repositories import system_config_repository

        now = timezone.now()
        hold_days = int(system_config_repository.get_decimal("payment_hold_days", "7"))
        transactions = payment_repository.get_by_user(request.user.id)

        refundable = []
        for t in transactions:
            if t.status in [PaymentTransaction.Status.HOLD, PaymentTransaction.Status.PAID]:
                # Nếu HOLD thì phải còn trong thời hạn
                if t.status == PaymentTransaction.Status.HOLD and t.hold_time and t.hold_time < now:
                    continue
                refundable.append(t)

        serializer = PaymentTransactionSerializer(refundable, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
        }, status=status.HTTP_200_OK)