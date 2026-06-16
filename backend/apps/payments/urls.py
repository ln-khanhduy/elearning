from django.urls import path
from apps.payments.views.payment_views import (
    # Stripe
    StripeCheckoutAPIView,
    StripeWebhookAPIView,
    StripeVerifyAPIView,
    # MoMo
    MoMoCheckoutAPIView,
    MoMoIPNAPIView,
    MoMoVerifyAPIView,
    # Transaction
    TransactionDetailAPIView,
    # Admin
    AdminTransactionListAPIView,
    MarkTransactionPaidAPIView,
    # Instructor
    InstructorRevenueAPIView,
)

urlpatterns = [
    # Stripe
    path("stripe/courses/<int:course_id>/checkout/", StripeCheckoutAPIView.as_view(), name="stripe-checkout"),
    path("stripe/webhook/", StripeWebhookAPIView.as_view(), name="stripe-webhook"),
    path("stripe/verify/", StripeVerifyAPIView.as_view(), name="stripe-verify"),

    # MoMo
    path("momo/courses/<int:course_id>/checkout/", MoMoCheckoutAPIView.as_view(), name="momo-checkout"),
    path("momo/ipn/", MoMoIPNAPIView.as_view(), name="momo-ipn"),
    path("momo/verify/", MoMoVerifyAPIView.as_view(), name="momo-verify"),

    # Transaction
    path("transactions/<uuid:transaction_id>/", TransactionDetailAPIView.as_view(), name="transaction-detail"),

    # Admin
    path("admin/transactions/", AdminTransactionListAPIView.as_view(), name="admin-transactions"),
    path("admin/transactions/<uuid:transaction_id>/mark-paid/", MarkTransactionPaidAPIView.as_view(), name="mark-transaction-paid"),

    # Instructor
    path("instructor/revenue/", InstructorRevenueAPIView.as_view(), name="instructor-revenue"),
]
