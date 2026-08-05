import logging
from decimal import Decimal, ROUND_DOWN
from uuid import UUID

import stripe
from django.conf import settings
from django.db import transaction as db_transaction

from apps.courses.repositories import course_repository
from apps.payments.repositories import payment_repository
from apps.payments.services import payment_service
from apps.payments.models import PaymentTransaction

logger = logging.getLogger(__name__)


class InvalidWebhookSignatureError(ValueError):
    """Webhook signature không hợp lệ — Stripe không nên retry event này."""


def create_checkout_session(user, course, coupon_code=None):
    """
    Tạo Stripe Checkout Session.
    - Validate course
    - Nếu có coupon_code: re-validate toàn bộ trong transaction có khóa dòng (select_for_update),
      server tự tính tổng tiền từ giá khóa học, tính số tiền giảm.
    - Tạo PaymentTransaction PENDING với gross_amount = số tiền thực thu sau giảm.
    - Tạo Stripe Session với unit_amount = số tiền thực thu.
    - Lưu provider_transaction_id = session.id
    """
    from apps.promotions.services import coupon_service

    # Validate
    is_valid, error = payment_service.validate_course_for_payment(user, course)
    if not is_valid:
        raise ValueError(error)

    discount_amount = Decimal("0")
    final_amount = Decimal(str(course.price))

    if coupon_code:
        with db_transaction.atomic():
            coupon = coupon_service.lock_coupon_by_code(coupon_code)
            if not coupon:
                raise ValueError("Mã giảm giá không tồn tại.")
            server_total = coupon_service.get_cart_total_from_server(user, [course.id])
            is_valid, error, coupon_info = coupon_service.validate_coupon(
                coupon_code, user, [course.id], server_total
            )
            if not is_valid:
                raise ValueError(error)
            discount_amount = coupon_service.calculate_discount_amount(coupon, server_total)
            final_amount = server_total - discount_amount

    # Tạo PENDING transaction với số tiền thực thu (sau giảm)
    transaction = payment_service.create_pending_transaction(
        user, course, "STRIPE", payable_amount=final_amount
    )

    # Cấu hình Stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    frontend_url = settings.FRONTEND_URL

    metadata = {
        "transaction_id": str(transaction.id),
        "course_id": str(course.id),
        "user_id": str(user.id),
    }
    if coupon_code:
        metadata["coupon_code"] = coupon_code
        metadata["discount_amount"] = str(discount_amount)

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
                "unit_amount": int(float(final_amount)),
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=f"{frontend_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}&transaction_id={transaction.id}",
        cancel_url=f"{frontend_url}/payment/cancel?transaction_id={transaction.id}",
        metadata=metadata,
        customer_email=user.email,
    )

    # Lưu provider_transaction_id
    payment_repository.update(transaction, provider_transaction_id=session.id)

    return {
        "checkout_url": session.url,
        "transaction_id": transaction.id,
        "provider": "STRIPE",
        "discount_amount": discount_amount,
        "final_amount": final_amount,
    }


def create_cart_checkout_session(user, course_ids, coupon_code=None):
    """
    Tạo Stripe Checkout Session cho nhiều khóa học (thanh toán giỏ hàng).
    - 1 Stripe Session với nhiều line_items -> tổng tiền đúng bằng tổng giỏ hàng (sau giảm).
    - Tạo 1 PaymentTransaction PENDING cho từng khóa.
    - provider_transaction_id (unique) chỉ gán cho transaction đại diện (đầu tiên);
      các transaction còn lại để NULL để tránh vi phạm unique constraint.
      Toàn bộ danh sách transaction được lưu trong Stripe Session metadata `transaction_ids`
      và được verify qua metadata khi thanh toán thành công.
    - Nếu có coupon: server tự tính tổng, phân bổ giảm giá theo tỷ lệ từng khóa.
    """
    from apps.promotions.services import coupon_service

    courses = list(course_repository.get_cartable_by_ids(course_ids))
    if not courses:
        raise ValueError("Không có khóa học hợp lệ để thanh toán.")

    # Validate từng khóa (đã publish, có phí, chưa enroll)
    for course in courses:
        is_valid, error = payment_service.validate_course_for_payment(user, course)
        if not is_valid:
            raise ValueError(f"{course.title}: {error}")

    course_ids_int = [c.id for c in courses]
    server_total = coupon_service.get_cart_total_from_server(user, course_ids_int)

    discount_amount = Decimal("0")
    final_amount = server_total

    if coupon_code:
        with db_transaction.atomic():
            coupon = coupon_service.lock_coupon_by_code(coupon_code)
            if not coupon:
                raise ValueError("Mã giảm giá không tồn tại.")
            is_valid, error, _coupon_info = coupon_service.validate_coupon(
                coupon_code, user, course_ids_int, server_total
            )
            if not is_valid:
                raise ValueError(error)
            discount_amount = coupon_service.calculate_discount_amount(coupon, server_total)
            final_amount = server_total - discount_amount

    if final_amount <= 0:
        raise ValueError("Tổng tiền thanh toán không hợp lệ.")

    # Phân bổ giảm giá theo tỷ lệ cho từng khóa (tổng unit_amount = final_amount)
    per_course_amounts = {}
    allocated = Decimal("0")
    for idx, course in enumerate(courses):
        course_price = Decimal(str(course.price))
        if discount_amount > 0:
            if idx == len(courses) - 1:
                course_final = final_amount - allocated
            else:
                course_discount = (
                    (discount_amount * course_price) / server_total
                ).quantize(Decimal("1"), rounding=ROUND_DOWN)
                course_final = course_price - course_discount
                allocated += course_final
        else:
            course_final = course_price
        per_course_amounts[course.id] = course_final

    # Tạo PENDING transaction cho từng khóa
    transactions = []
    for course in courses:
        tx = payment_service.create_pending_transaction(
            user, course, "STRIPE", payable_amount=per_course_amounts[course.id]
        )
        transactions.append(tx)

    # Cấu hình Stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    frontend_url = settings.FRONTEND_URL

    line_items = []
    for course in courses:
        line_items.append({
            "price_data": {
                "currency": "vnd",
                "product_data": {
                    "name": course.title,
                    "description": course.description[:255] if course.description else "",
                },
                "unit_amount": int(float(per_course_amounts[course.id])),
            },
            "quantity": 1,
        })

    transaction_ids = ",".join(str(t.id) for t in transactions)
    metadata = {
        "transaction_ids": transaction_ids,
        "user_id": str(user.id),
    }
    if coupon_code:
        metadata["coupon_code"] = coupon_code
        metadata["discount_amount"] = str(discount_amount)

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=line_items,
        mode="payment",
        success_url=f"{frontend_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{frontend_url}/payment/cancel",
        metadata=metadata,
        customer_email=user.email,
    )

    # Lưu provider_transaction_id cho transaction đại diện (duy nhất).
    # Các transaction còn lại của cùng giỏ hàng để NULL để tránh vi phạm
    # unique constraint provider_transaction_id.
    payment_repository.update(transactions[0], provider_transaction_id=session.id)

    return {
        "checkout_url": session.url,
        "transaction_ids": transaction_ids,
        "provider": "STRIPE",
        "discount_amount": discount_amount,
        "final_amount": final_amount,
    }


def is_cart_checkout_session(session_id):
    """
    Kiểm tra Stripe session có phải checkout giỏ hàng (nhiều khóa) không.
    Dùng cho StripeVerifyAPIView để redirect đúng trang sau thanh toán.
    """
    stripe.api_key = settings.STRIPE_SECRET_KEY
    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except stripe.error.StripeError:
        return False
    _, _, transaction_ids = _read_session_metadata(session)
    return bool(transaction_ids)


def _read_session_metadata(session):
    """
    Đọc coupon_code / discount_amount / transaction_ids từ Stripe Session metadata.
    Lưu ý: session và metadata đều là StripeObject (không có .get()).
    Dùng getattr + `in` + bracket access vì cả StripeObject lẫn dict đều hỗ trợ.
    Trả về (coupon_code, discount_amount, transaction_ids).
    """
    metadata = getattr(session, "metadata", None) or {}
    coupon_code = metadata["coupon_code"] if "coupon_code" in metadata else None
    discount_amount = metadata["discount_amount"] if "discount_amount" in metadata else None
    transaction_ids = metadata["transaction_ids"] if "transaction_ids" in metadata else None
    return coupon_code, discount_amount, transaction_ids


def verify_session(session_id):
    """
    Verify Stripe session và xử lý thanh toán.
    Dùng cho webhook và verify fallback.

    Hỗ trợ cả:
    - Checkout 1 khóa (metadata transaction_id) — giữ nguyên hành vi cũ.
    - Checkout giỏ hàng (metadata transaction_ids) — xử lý N transaction cùng lúc.

    Nguyên tắc chống lỗi nghiệp vụ:
    - READ-FIRST: đọc toàn bộ dữ liệu cần thiết (metadata, transaction, coupon)
      TRƯỚC khi có bất kỳ ghi DB nào → lỗi sẽ raise sớm, không để lại trạng thái lệch.
    - ATOMIC: mọi ghi DB (hold, grant access, record coupon usage) nằm trong 1
      transaction.atomic() → commit tất cả hoặc rollback tất cả.
    - SELF-HEALING: nếu transaction đã HOLD/PAID (vd crash giữa chừng lần trước),
      vẫn đảm bảo CouponUsage tồn tại (get_or_create + tăng used_count đúng 1 lần).
    """
    from apps.promotions.services import coupon_service
    from apps.promotions.repositories import coupon_repository

    stripe.api_key = settings.STRIPE_SECRET_KEY

    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except stripe.error.StripeError:
        raise ValueError("Không thể xác thực phiên thanh toán Stripe.")

    if session.payment_status != "paid":
        raise ValueError("Thanh toán chưa hoàn tất.")

    # ===== READ-FIRST: không ghi DB gì cho tới khi mọi dữ liệu đã đọc xong =====
    coupon_code, discount_amount, transaction_ids_meta = _read_session_metadata(session)

    if transaction_ids_meta:
        # ===== CHECKOUT GIỎ HÀNG: xử lý nhiều transaction =====
        tx_ids = []
        for raw_id in transaction_ids_meta.split(","):
            raw_id = raw_id.strip()
            if not raw_id:
                continue
            try:
                tx_ids.append(UUID(raw_id))
            except (ValueError, AttributeError):
                raise ValueError("Dữ liệu giao dịch không hợp lệ.")

        if not tx_ids:
            raise ValueError("Không tìm thấy giao dịch tương ứng.")

        # Lưu ý: KHÔNG dùng select_for_update ở đây (ngoài transaction.atomic)
        # vì Django yêu cầu select_for_update chỉ được dùng trong transaction.
        # Tính idempotent được đảm bảo bởi kiểm tra status HOLD/PAID trong atomic.
        transactions = list(payment_repository.get_by_ids(tx_ids))
        if not transactions:
            raise ValueError("Không tìm thấy giao dịch tương ứng.")
        if len(transactions) != len(tx_ids):
            raise ValueError("Một số giao dịch không tồn tại.")

        # Đảm bảo transaction đại diện khớp với session này (chống gian lận).
        # Lưu ý: danh sách transactions fetch từ DB không đảm bảo thứ tự
        # (model có ordering = ['-created_at']), nên phải tìm transaction
        # có provider_transaction_id == session_id (transaction được gắn session khi checkout).
        representative = next(
            (t for t in transactions if t.provider_transaction_id == session_id),
            None,
        )
        if representative is None:
            raise ValueError("Giao dịch không khớp với phiên thanh toán.")

        coupon = coupon_repository.get_by_code(coupon_code) if coupon_code else None

        # ===== ATOMIC + SELF-HEALING =====
        with db_transaction.atomic():
            for t in transactions:
                # Idempotent: chỉ chuyển HOLD + grant access nếu chưa từng làm.
                if t.status not in [
                    PaymentTransaction.Status.HOLD,
                    PaymentTransaction.Status.PAID,
                ]:
                    t = payment_service.mark_transaction_hold(t)
                    payment_service.grant_course_access(t)
                    t.refresh_from_db()

                # Ghi CouponUsage (get_or_create → chạy lại nhiều lần vẫn an toàn).
                if coupon:
                    d_amt = Decimal(str(discount_amount)) if discount_amount is not None else Decimal("0")
                    # Với giỏ hàng, coupon ghi 1 lần duy nhất cho transaction đại diện
                    if t.id == representative.id:
                        coupon_service.record_coupon_usage(coupon, t.student, t, d_amt)

        # ===== SAU COMMIT: notify chỉ ghi log, không rollback giao dịch chính =====
        try:
            from apps.notifications import services as notif_service
            for t in transactions:
                notif_service.notify_payment_success(
                    t.student, t.course.title, t.gross_amount
                )
        except Exception:
            logger.exception("Không gửi được notification payment success cho transactions %s", session_id)

        return representative

    # ===== CHECKOUT 1 KHÓA (hành vi cũ) =====
    transaction = payment_repository.get_by_provider_transaction_id("STRIPE", session_id)
    if not transaction:
        raise ValueError("Không tìm thấy giao dịch tương ứng.")

    coupon = coupon_repository.get_by_code(coupon_code) if coupon_code else None

    # ===== ATOMIC + SELF-HEALING =====
    with db_transaction.atomic():
        # Idempotent: chỉ chuyển HOLD + grant access nếu chưa từng làm.
        if transaction.status not in [
            PaymentTransaction.Status.HOLD,
            PaymentTransaction.Status.PAID,
        ]:
            transaction = payment_service.mark_transaction_hold(transaction)
            payment_service.grant_course_access(transaction)
            transaction.refresh_from_db()

        # Ghi CouponUsage (get_or_create → chạy lại nhiều lần vẫn an toàn).
        # Tự phục hồi các giao dịch cũ crash giữa chừng mà chưa ghi được usage.
        if coupon:
            coupon_service.record_coupon_usage(
                coupon, transaction.student, transaction,
                discount_amount if discount_amount is not None else Decimal("0"),
            )

    # ===== SAU COMMIT: notify chỉ ghi log, không rollback giao dịch chính =====
    try:
        from apps.notifications import services as notif_service
        notif_service.notify_payment_success(
            transaction.student, transaction.course.title, transaction.gross_amount
        )
    except Exception:
        logger.exception("Không gửi được notification payment success cho transaction %s", transaction.id)

    return transaction


def transfer_to_instructor(destination_account_id, amount_vnd, metadata=None):
    """
    Chuyển tiền từ Stripe balance của platform sang Connected Account của giảng viên.
    - destination_account_id: Stripe Connected Account ID (acct_...), tạm thời lưu trong bank_account_number của InstructorProfile
    - amount_vnd: số tiền VND cần chuyển (Decimal/float/int)
    - metadata: dict tùy chọn để truy vết
    Trả về Stripe Transfer object; nếu balance không đủ hoặc account không hợp lệ sẽ raise ValueError.
    """
    stripe.api_key = settings.STRIPE_SECRET_KEY
    amount = int(amount_vnd)
    if amount <= 0:
        raise ValueError("Số tiền thanh toán phải lớn hơn 0.")
    try:
        return stripe.Transfer.create(
            amount=amount, currency="vnd",
            destination=destination_account_id, metadata=metadata or {},
        )
    except stripe.error.InsufficientFundsError:
        raise ValueError("Số dư Stripe (VND) không đủ để thanh toán cho giảng viên.")
    except stripe.error.InvalidRequestError as e:
        raise ValueError(f"Không thể chuyển tiền cho giảng viên (Connected Account không hợp lệ): {getattr(e, 'user_message', '') or e}")
    except stripe.error.StripeError as e:
        raise ValueError(f"Lỗi Stripe khi chuyển tiền: {getattr(e, 'user_message', '') or e}")


def refund_transaction(transaction):
    """
    Hoàn tiền thực tế trên Stripe cho một PaymentTransaction.
    Tìm PaymentIntent từ Checkout Session (provider_transaction_id lưu session_id),
    sau đó gọi Stripe Refund với số tiền gross_amount.
    Trả về Stripe Refund object; nếu lỗi sẽ raise ValueError.
    """
    stripe.api_key = settings.STRIPE_SECRET_KEY
    session_id = transaction.provider_transaction_id
    if not session_id:
        # Transaction phụ trong thanh toán giỏ hàng không lưu provider_transaction_id.
        # Tự tìm session chứa transaction này qua metadata transaction_ids của các
        # transaction đại diện (cùng user).
        candidate_tx = payment_repository.get_by_user_with_provider_id(transaction.student_id)
        for candidate in candidate_tx:
            candidate_session_id = candidate.provider_transaction_id
            if not candidate_session_id:
                continue
            try:
                candidate_session = stripe.checkout.Session.retrieve(candidate_session_id)
            except stripe.error.StripeError:
                continue
            _, _, tx_ids_meta = _read_session_metadata(candidate_session)
            if tx_ids_meta and str(transaction.id) in [x.strip() for x in tx_ids_meta.split(",")]:
                session_id = candidate_session_id
                break
        if not session_id:
            raise ValueError("Không tìm thấy phiên thanh toán Stripe của giao dịch này.")
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        payment_intent = getattr(session, "payment_intent", None)
        if not payment_intent:
            raise ValueError("Không tìm thấy PaymentIntent của giao dịch để hoàn tiền.")
    except stripe.error.StripeError as e:
        raise ValueError(f"Không thể truy vấn phiên thanh toán Stripe: {getattr(e, 'user_message', '') or e}")
    try:
        return stripe.Refund.create(payment_intent=payment_intent, amount=int(transaction.gross_amount))
    except stripe.error.InvalidRequestError as e:
        raise ValueError(f"Không thể hoàn tiền (giao dịch có thể đã hoàn hoặc không hợp lệ): {getattr(e, 'user_message', '') or e}")
    except stripe.error.StripeError as e:
        raise ValueError(f"Lỗi Stripe khi hoàn tiền: {getattr(e, 'user_message', '') or e}")


def handle_webhook(payload, sig_header):
    """
    Xử lý Stripe webhook event.
    Verify signature bằng STRIPE_WEBHOOK_SECRET.

    Quan trọng: KHÔNG nuốt lỗi xử lý (chỉ nuốt lỗi signature).
    - Signature lỗi → HTTP 400 → Stripe sẽ KHÔNG retry (không thể sửa được).
    - Lỗi xử lý khác (verify_session thất bại tạm thời) → để lan lên view → HTTP 500
      → Stripe TỰ ĐỘNG retry event đến khi thành công (cơ chế phục hồi chính của Stripe).
    """
    stripe.api_key = settings.STRIPE_SECRET_KEY
    endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise InvalidWebhookSignatureError("Invalid webhook signature.")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        session_id = getattr(session, "id", None)
        if session_id and getattr(session, "payment_status", None) == "paid":
            # Nếu verify_session raise (vd Stripe tạm lỗi, DB lỗi),
            # ngoại lệ sẽ lan lên view → HTTP 500 → Stripe retry event này.
            verify_session(session_id)

    return {"status": "ok"}