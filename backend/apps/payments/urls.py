from django.urls import path
from apps.payments.views import (
    StripeCheckoutAPIView,
    StripeCartCheckoutAPIView,
    StripeWebhookAPIView,
    StripeVerifyAPIView,
    TransactionDetailAPIView,
    AdminTransactionListAPIView,
    AdminFinanceReportAPIView,
    AdminPayoutListAPIView,
    AdminInstructorPayoutAPIView,
    InstructorRevenueAPIView,
    MyRefundableTransactionsAPIView,
)

urlpatterns = [
    # Stripe
    path("stripe/courses/<int:course_id>/checkout/", StripeCheckoutAPIView.as_view(), name="stripe-checkout"),
    path("stripe/cart/checkout/", StripeCartCheckoutAPIView.as_view(), name="stripe-cart-checkout"),
    path("stripe/webhook/", StripeWebhookAPIView.as_view(), name="stripe-webhook"),
    path("stripe/verify/", StripeVerifyAPIView.as_view(), name="stripe-verify"),
    # Transaction
    path("transactions/<uuid:transaction_id>/", TransactionDetailAPIView.as_view(), name="transaction-detail"),

    # Admin
    path("admin/transactions/", AdminTransactionListAPIView.as_view(), name="admin-transactions"),
    path("admin/reports/", AdminFinanceReportAPIView.as_view(), name="admin-finance-report"),
    path("admin/payouts/", AdminPayoutListAPIView.as_view(), name="admin-payout-list"),
    path("admin/payouts/instructor/<uuid:instructor_id>/pay/", AdminInstructorPayoutAPIView.as_view(), name="admin-instructor-payout"),

    # Instructor
    path("instructor/revenue/", InstructorRevenueAPIView.as_view(), name="instructor-revenue"),

    # Học viên - giao dịch đủ điều kiện hoàn tiền
    path("my/refundable-transactions/", MyRefundableTransactionsAPIView.as_view(), name="my-refundable-transactions"),
]