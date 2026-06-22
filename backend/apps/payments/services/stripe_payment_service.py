import stripe
from django.conf import settings
from django.urls import reverse
from apps.payments.repositories.payment_repository import PaymentRepository
from apps.payments.services.payment_service import PaymentService
from apps.payments.models import PaymentTransaction


class StripePaymentService:
    """Service xử lý thanh toán qua Stripe."""

    @staticmethod
    def create_checkout_session(user, course):
        """
        Tạo Stripe Checkout Session.
        - Tạo PaymentTransaction PENDING
        - Tạo Stripe Session
        - Lưu provider_transaction_id = session.id
        """
        # Validate
        is_valid, error = PaymentService.validate_course_for_payment(user, course)
        if not is_valid:
            raise ValueError(error)

        # Tạo PENDING transaction
        transaction = PaymentService.create_pending_transaction(user, course, "STRIPE")

        # Cấu hình Stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        frontend_url = settings.FRONTEND_URL

        # Tạo Stripe Checkout Session
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "vnd",
                    "product_data": {
                        "name": course.title,
                        "description": course.description[:255] if course.description else "",
                    },
                    "unit_amount": int(float(course.price)),
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=f"{frontend_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}&transaction_id={transaction.id}",
            cancel_url=f"{frontend_url}/payment/cancel?transaction_id={transaction.id}",
            metadata={
                "transaction_id": str(transaction.id),
                "course_id": str(course.id),
                "user_id": str(user.id),
            },
            customer_email=user.email,
        )

        # Lưu provider_transaction_id
        PaymentRepository.update(
            transaction,
            provider_transaction_id=session.id,
        )

        return {
            "checkout_url": session.url,
            "transaction_id": transaction.id,
            "provider": "STRIPE",
        }

    @staticmethod
    def verify_session(session_id):
        """
        Verify Stripe session và xử lý thanh toán.
        Dùng cho webhook và verify fallback.
        """
        stripe.api_key = settings.STRIPE_SECRET_KEY

        try:
            session = stripe.checkout.Session.retrieve(session_id)
        except stripe.error.StripeError:
            raise ValueError("Không thể xác thực phiên thanh toán Stripe.")

        if session.payment_status != "paid":
            raise ValueError("Thanh toán chưa hoàn tất.")

        # Tìm transaction
        transaction = PaymentRepository.get_by_provider_transaction_id(
            "STRIPE", session_id
        )
        if not transaction:
            raise ValueError("Không tìm thấy giao dịch tương ứng.")

        # Idempotent: nếu đã HOLD/PAID thì không xử lý lại
        if transaction.status in [PaymentTransaction.Status.HOLD, PaymentTransaction.Status.PAID]:
            return transaction

        # Chuyển sang HOLD
        transaction = PaymentService.mark_transaction_hold(transaction)

        # Tạo enrollment
        PaymentService.grant_course_access(transaction)

        return transaction

    @staticmethod
    def handle_webhook(payload, sig_header):
        """
        Xử lý Stripe webhook event.
        Verify signature bằng STRIPE_WEBHOOK_SECRET.
        """
        stripe.api_key = settings.STRIPE_SECRET_KEY
        endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
        except (ValueError, stripe.error.SignatureVerificationError):
            raise ValueError("Invalid webhook signature.")

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            session_id = session.get("id")

            if session.get("payment_status") == "paid":
                try:
                    StripePaymentService.verify_session(session_id)
                except ValueError:
                    pass  # Log error but don't crash webhook

        return {"status": "ok"}
