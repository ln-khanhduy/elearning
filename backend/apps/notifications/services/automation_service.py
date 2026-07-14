"""
Dịch vụ Tự động hóa Thông minh cho Hệ thống E-Learning.

Service này cung cấp các hàm tự động hóa giúp biến các thao tác thủ công
thành tự động, nâng cao trải nghiệm người dùng và hiệu quả vận hành.

Nguyên tắc: Không thay đổi models hiện có, chỉ mở rộng services.
"""

import logging
from datetime import timedelta
from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from django.conf import settings

from apps.notifications import services as notif_service
from apps.notifications.models import Notification
from apps.notifications.services import notification_service as notif_svc

logger = logging.getLogger(__name__)


# =============================================================================
# 1. 🎯 TỰ ĐỘNG HOÀN THÀNH KHÓA HỌC & CẤP CHỨNG CHỈ
# =============================================================================

def auto_complete_course(enrollment, course_progress):
    """
    Tự động hoàn thành khóa học khi học viên đạt 100% progress.
    Được gọi từ signal lesson_progress.post_save hoặc từ mark_lesson_complete.
    
    Thay vì bắt học viên nhấn nút "Hoàn thành", hệ thống tự động:
    1. Đánh dấu Enrollment = COMPLETED
    2. Gửi notification chúc mừng
    3. Trả về thông tin để frontend hiển thị celebration
    """
    from apps.enrollments.repositories import enrollment_repository
    from apps.certificates.repositories import certificate_repository
    from apps.certificates.services import certificate_image_service
    from apps.courses.repositories import course_repository
    import uuid

    # Kiểm tra nếu đã hoàn thành rồi thì skip
    if enrollment.status == 'COMPLETED':
        return None

    progress_percent = float(course_progress.progress_percent)
    if progress_percent < 100:
        return None

    with transaction.atomic():
        enrollment_repository.mark_completed(enrollment)
        course_progress.completed_at = timezone.now()
        course_progress.save(update_fields=['completed_at'])

    # Tạo chứng chỉ
    course = course_repository.get_by_id(enrollment.course_id)
    cert = certificate_repository.get_by_enrollment(enrollment)
    if not cert:
        today = timezone.now().strftime("%y%m%d")
        random_part = uuid.uuid4().hex[:6].upper()
        cert_code = f"CERT-{course.id}-{enrollment.student_id}-{today}-{random_part}"
        cert = certificate_repository.create(
            user=enrollment.student,
            course=course,
            enrollment=enrollment,
            certificate_code=cert_code,
        )

    # Upload ảnh chứng chỉ
    if not cert.image_url:
        try:
            image_url = certificate_image_service.upload(cert)
            if image_url:
                cert.image_url = image_url
                cert.save(update_fields=["image_url"])
        except Exception as e:
            logger.error(f"Failed to generate certificate image for {cert.id}: {e}")

    # Gửi notification
    try:
        notif_svc.notify_course_completed(enrollment.student, course.title)
    except Exception as e:
        logger.error(f"Failed to send completion notification: {e}")

    return {
        'course_completed': True,
        'completed_at': enrollment.completed_at.isoformat() if enrollment.completed_at else None,
        'certificate_code': cert.certificate_code,
        'certificate_id': str(cert.id),
    }


# =============================================================================
# 2. 🏆 TỰ ĐỘNG CHÚC MỪNG CỘT MỐC (MILESTONE CELEBRATION)
# =============================================================================

MILESTONES = [25, 50, 75, 90]

MILESTONE_MESSAGES = {
    25: {
        'title': '🎉 Đã hoàn thành 25% khóa học!',
        'body': 'Bạn đã đi được 1/4 chặng đường! Cố gắng lên nhé!',
    },
    50: {
        'title': '🔥 Nửa chặng đường đã qua!',
        'body': '50% khóa học đã hoàn thành! Bạn đang làm rất tốt!',
    },
    75: {
        'title': '⚡ Gần đến đích rồi!',
        'body': '75% khóa học đã hoàn thành! Chỉ còn một chút nữa thôi!',
    },
    90: {
        'title': '🚀 Sắp hoàn thành!',
        'body': '90% khóa học đã hoàn thành! Chuẩn bị nhận chứng chỉ nhé!',
    },
}


def check_and_celebrate_milestone(enrollment, course_progress, course_title, old_progress=0):
    """
    Kiểm tra nếu học viên vừa đạt một milestone mới và gửi notification.
    
    Args:
        enrollment: Enrollment object
        course_progress: CourseProgress object (đã được updated với progress mới)
        course_title: Tên khóa học (string)
        old_progress: Progress % trước khi update (int/float)
    """
    new_progress = float(course_progress.progress_percent)
    old_progress = float(old_progress)

    # Tìm milestone lớn nhất vừa đạt được
    for milestone in sorted(MILESTONES):
        if old_progress < milestone <= new_progress:
            msg = MILESTONE_MESSAGES[milestone]
            try:
                notif_svc._create(
                    recipient=enrollment.student,
                    title=msg['title'],
                    body=f"{msg['body']} Tiếp tục học khóa học \"{course_title}\" nhé!",
                    notification_type=Notification.Type.COURSE,
                    channel=Notification.Channel.IN_APP,
                )
            except Exception as e:
                logger.error(f"Failed to send milestone notification: {e}")
            return milestone

    return None


# =============================================================================
# 3. 🔔 NHẮC NHỞ HỌC VIÊN VẮNG MẶT (INACTIVITY RE-ENGAGEMENT)
# =============================================================================

def process_inactivity_reminders():
    """
    Xử lý nhắc nhở học viên không hoạt động lâu ngày.
    Chạy daily qua management command.
    
    - 7 days: notification nhẹ nhàng
    - 14 days: email + notification
    - 30 days: email "Chúng tôi nhớ bạn"
    """
    from apps.enrollments.repositories import enrollment_repository
    from apps.courses.repositories import course_repository

    now = timezone.now()
    reminders_sent = {'7days': 0, '14days': 0, '30days': 0}

    # Lấy tất cả enrollment ACTIVE có progress
    enrollments = enrollment_repository.get_active_enrollments_with_progress()

    for enrollment, progress in enrollments:
        if not progress.last_activity_at:
            continue

        days_since = (now - progress.last_activity_at).days
        student = enrollment.student
        course = course_repository.get_by_id(enrollment.course_id)
        course_title = course.title if course else 'Khóa học'

        try:
            if days_since >= 30:
                _send_inactivity_notification(
                    student, course_title, days_since,
                    '🚨 Bạn đã vắng mặt 30 ngày!',
                    f'Đã 30 ngày kể từ lần cuối bạn học "{course_title}". '
                    f'Đừng bỏ lỡ kiến thức! Hãy quay lại học ngay hôm nay. '
                    f'Chúng tôi luôn đồng hành cùng bạn! 💪',
                    is_email=True,
                )
                reminders_sent['30days'] += 1

            elif days_since >= 14:
                _send_inactivity_notification(
                    student, course_title, days_since,
                    '⏰ Đã 2 tuần bạn chưa học!',
                    f'Đã 14 ngày kể từ lần cuối bạn học "{course_title}". '
                    f'Kiến thức cũ sẽ nhanh quên đấy! Hãy dành 15 phút để ôn lại nhé. 📚',
                    is_email=True,
                )
                reminders_sent['14days'] += 1

            elif days_since >= 7:
                _send_inactivity_notification(
                    student, course_title, days_since,
                    '💡 Bạn đã học gì hôm nay chưa?',
                    f'Đã 7 ngày kể từ lần cuối bạn học "{course_title}". '
                    f'Chỉ cần 10 phút mỗi ngày là bạn đã tiến bộ rồi! 🚀',
                    is_email=False,
                )
                reminders_sent['7days'] += 1

        except Exception as e:
            logger.error(f"Failed to send inactivity reminder for user {student.id}: {e}")

    logger.info(f"Inactivity reminders sent: {reminders_sent}")
    return reminders_sent


def _send_inactivity_notification(student, course_title, days, title, body, is_email=False):
    """Helper gửi notification inactivity."""
    channel = Notification.Channel.EMAIL if is_email else Notification.Channel.IN_APP
    notif_svc._create(
        recipient=student,
        title=title,
        body=body,
        notification_type=Notification.Type.COURSE,
        channel=channel,
    )


# =============================================================================
# 4. 📉 CẢNH BÁO GIẢM GIÁ CHO WISHLIST (PRICE DROP ALERT)
# =============================================================================

def notify_wishlist_price_drop(course, old_price, new_price):
    """
    Khi giá khóa học giảm, gửi notification cho tất cả học viên 
    đã thêm khóa học vào wishlist.
    """
    from apps.courses.repositories import course_repository

    if new_price >= old_price:
        logger.info(f"Price did not drop for course {course.id}. Skipping.")
        return 0

    # Lấy tất cả wishlist items cho khóa học này
    wishlist_items = course.wishlisted_by.all()
    notified_count = 0

    # Format giá
    old_price_vnd = f"{int(old_price):,}đ"
    new_price_vnd = f"{int(new_price):,}đ"
    discount_pct = round((1 - float(new_price) / float(old_price)) * 100)

    title = f'📉 Giá khóa học đã giảm {discount_pct}%!'
    body = (f'Khóa học "{course.title}" đã giảm giá từ {old_price_vnd} '
            f'xuống còn {new_price_vnd} (giảm {discount_pct}%). '
            f'Đây là cơ hội tốt để sở hữu khóa học!')

    for item in wishlist_items:
        try:
            notif_svc._create(
                recipient=item.student,
                title=title,
                body=body,
                notification_type=Notification.Type.COURSE,
                channel=Notification.Channel.IN_APP,
            )
            notified_count += 1
        except Exception as e:
            logger.error(f"Failed to notify user {item.student_id}: {e}")

    logger.info(f"Price drop alert sent to {notified_count} users for course {course.id}")
    return notified_count


# =============================================================================
# 5. 🛒 PHỤC HỒI GIỎ HÀNG BỎ QUÊN (ABANDONED CART RECOVERY)
# =============================================================================

def process_abandoned_carts():
    """
    Phát hiện và xử lý giỏ hàng bị bỏ quên.
    Chạy daily qua management command.
    
    - Pending > 2h: notification
    - Pending > 24h: send coupon
    - Pending > 72h: final reminder
    """
    from apps.payments.repositories import payment_repository
    from apps.promotions.repositories import coupon_repository
    from apps.courses.repositories import course_repository

    now = timezone.now()
    recovered = {'2h': 0, '24h': 0, '72h': 0}

    # Lấy các payment PENDING (chưa thanh toán)
    pending_payments = payment_repository.get_pending_transactions()

    for payment in pending_payments:
        hours_since = (now - payment.created_at).total_seconds() / 3600
        student = payment.student
        course = course_repository.get_by_id(payment.course_id)
        course_title = course.title if course else 'Khóa học'

        try:
            if hours_since >= 72:
                _send_abandoned_cart_notification(
                    student, course_title, payment,
                    '⏳ Cơ hội cuối! Giỏ hàng của bạn sắp hết hạn',
                    f'Giỏ hàng khóa học "{course_title}" của bạn đã chờ hơn 72 giờ. '
                    f'Hãy hoàn tất thanh toán ngay trước khi ưu đãi kết thúc!',
                    is_email=True,
                )
                recovered['72h'] += 1

            elif hours_since >= 24:
                # Tạo mã giảm giá 5-10%
                coupon = _generate_recovery_coupon(student, payment, course_title)
                discount_text = f" Mã giảm giá {coupon.code} - Giảm {int(coupon.discount_value)}% dành riêng cho bạn!" if coupon else ""
                
                _send_abandoned_cart_notification(
                    student, course_title, payment,
                    '🎁 Ưu đãi đặc biệt dành cho bạn!',
                    f'Bạn vẫn còn khóa học "{course_title}" trong giỏ hàng.{discount_text} '
                    f'Hãy nhanh tay sở hữu ngay hôm nay!',
                    is_email=True,
                )
                recovered['24h'] += 1

            elif hours_since >= 2:
                _send_abandoned_cart_notification(
                    student, course_title, payment,
                    '🛒 Bạn đã quên giỏ hàng của mình?',
                    f'Khóa học "{course_title}" vẫn đang chờ bạn trong giỏ hàng! '
                    f'Hãy hoàn tất thanh toán để bắt đầu học ngay.',
                    is_email=False,
                )
                recovered['2h'] += 1

        except Exception as e:
            logger.error(f"Failed to process abandoned cart for payment {payment.id}: {e}")

    logger.info(f"Abandoned cart recovery: {recovered}")
    return recovered


def _send_abandoned_cart_notification(student, course_title, payment, title, body, is_email=False):
    """Helper gửi notification abandoned cart."""
    channel = Notification.Channel.EMAIL if is_email else Notification.Channel.IN_APP
    notif_svc._create(
        recipient=student,
        title=title,
        body=body,
        notification_type=Notification.Type.PAYMENT,
        channel=channel,
    )


def _generate_recovery_coupon(user, payment, course_title):
    """Tạo mã giảm giá personal cho user bỏ quên giỏ hàng."""
    from apps.promotions.repositories import coupon_repository
    from apps.courses.repositories import course_repository
    import random
    import string

    # Kiểm tra xem đã có coupon recovery cho user này chưa
    code = f"WELCOME{user.id}{random.randint(100, 999)}"
    discount_value = random.choice([5, 8, 10])

    try:
        coupon = coupon_repository.create_coupon(
            code=code,
            discount_type='PERCENTAGE',
            discount_value=discount_value,
            max_usage_count=1,
            max_uses_per_user=1,
            min_order_amount=0,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=7),
            is_active=True,
            description=f'Mã giảm giá phục hồi giỏ hàng cho {user.email} - {course_title}',
            created_by=user,
        )
        # Gán applicable course
        course = course_repository.get_by_id(payment.course_id)
        if course and hasattr(coupon, 'applicable_courses'):
            coupon.applicable_courses.add(course)
        return coupon
    except Exception as e:
        logger.error(f"Failed to generate recovery coupon: {e}")
        return None


# =============================================================================
# 6. ⭐ NHẮC NHỞ ĐÁNH GIÁ SAU HOÀN THÀNH (REVIEW REMINDER)
# =============================================================================

def process_review_reminders():
    """
    Nhắc nhở học viên đánh giá khóa học sau khi hoàn thành.
    - 3 ngày sau completed: notification
    - 7 ngày sau completed: email nếu chưa review
    """
    from apps.enrollments.repositories import enrollment_repository
    from apps.courses.repositories import course_repository
    from apps.reviews.repositories import review_repository

    now = timezone.now()
    reminders_sent = {'3days': 0, '7days': 0}

    # Lấy tất cả enrollment COMPLETED
    completed_enrollments = enrollment_repository.get_completed_enrollments()

    for enrollment in completed_enrollments:
        if not enrollment.completed_at:
            continue

        days_since = (now - enrollment.completed_at).days
        student = enrollment.student
        course = course_repository.get_by_id(enrollment.course_id)
        course_title = course.title if course else 'Khóa học'

        # Kiểm tra xem đã có review chưa
        existing_review = review_repository.get_by_student_and_course(student.id, enrollment.course_id)
        if existing_review:
            continue  # Đã đánh giá rồi

        try:
            if days_since >= 7:
                _send_review_reminder_notification(
                    student, course_title,
                    '📝 Chia sẻ trải nghiệm của bạn!',
                    f'Đã 7 ngày bạn hoàn thành "{course_title}". '
                    f'Hãy dành 1 phút để đánh giá và giúp người khác có quyết định đúng đắn nhé! ⭐',
                    is_email=True,
                )
                reminders_sent['7days'] += 1

            elif days_since >= 3:
                _send_review_reminder_notification(
                    student, course_title,
                    '⭐ Đánh giá khóa học bạn vừa học?',
                    f'Bạn đã hoàn thành "{course_title}" được 3 ngày rồi! '
                    f'Cảm thấy thế nào? Hãy chia sẻ đánh giá của bạn để giúp cộng đồng nhé!',
                    is_email=False,
                )
                reminders_sent['3days'] += 1

        except Exception as e:
            logger.error(f"Failed to send review reminder for user {student.id}: {e}")

    logger.info(f"Review reminders sent: {reminders_sent}")
    return reminders_sent


def _send_review_reminder_notification(student, course_title, title, body, is_email=False):
    """Helper gửi notification review reminder."""
    channel = Notification.Channel.EMAIL if is_email else Notification.Channel.IN_APP
    notif_svc._create(
        recipient=student,
        title=title,
        body=body,
        notification_type=Notification.Type.COURSE,
        channel=channel,
    )


# =============================================================================
# 7. 📊 BÁO CÁO HỌC TẬP TUẦN (WEEKLY STUDY DIGEST)
# =============================================================================

def process_weekly_digest():
    """
    Gửi báo cáo học tập tuần cho tất cả học viên đang hoạt động.
    Chạy mỗi Chủ Nhật.
    
    Nội dung:
    - Số bài học đã hoàn thành trong tuần
    - So sánh với tuần trước
    - Tổng số quiz đã làm
    - Thành tích nổi bật
    """
    from apps.enrollments.repositories import enrollment_repository
    from apps.courses.repositories import course_repository
    from django.db.models import Count

    now = timezone.now()
    week_start = now - timedelta(days=7)
    last_week_start = week_start - timedelta(days=7)

    digests_sent = 0

    # Lấy tất cả enrollment ACTIVE có activity trong vòng 30 ngày
    active_enrollments = enrollment_repository.get_active_enrollments_with_recent_activity(days=30)

    for enrollment in active_enrollments:
        student = enrollment.student
        course = course_repository.get_by_id(enrollment.course_id)
        course_title = course.title if course else 'Khóa học'

        # Đếm bài học hoàn thành trong tuần này
        from apps.enrollments.repositories import enrollment_repository as er
        this_week_lessons = er.count_lessons_completed_in_range(
            enrollment.id, week_start, now
        )
        last_week_lessons = er.count_lessons_completed_in_range(
            enrollment.id, last_week_start, week_start
        )

        # Đếm quiz đã làm trong tuần
        from apps.quizzes.repositories import quiz_repository
        this_week_quizzes = quiz_repository.count_attempts_in_range(
            student.id, enrollment.course_id, week_start, now
        )

        if this_week_lessons == 0 and this_week_quizzes == 0:
            continue  # Không có hoạt động trong tuần -> không gửi digest

        # So sánh
        if last_week_lessons > 0:
            change_pct = round((this_week_lessons - last_week_lessons) / last_week_lessons * 100)
            if change_pct > 0:
                trend = f"tăng {change_pct}% so với tuần trước 🔥"
            elif change_pct < 0:
                trend = f"giảm {abs(change_pct)}% so với tuần trước 📉"
            else:
                trend = "bằng với tuần trước 👏"
        else:
            trend = "tuần đầu tiên bạn học! 🚀"

        title = '📊 Báo cáo học tập tuần của bạn'
        body = (
            f'Tuần này bạn đã hoàn thành {this_week_lessons} bài học '
            f'và làm {this_week_quizzes} bài quiz trong khóa học "{course_title}".\n\n'
            f'📈 {trend}\n\n'
            f'Hãy duy trì đà học tập này nhé! 💪'
        )

        try:
            notif_svc._create(
                recipient=student,
                title=title,
                body=body,
                notification_type=Notification.Type.COURSE,
                channel=Notification.Channel.EMAIL,
            )
            digests_sent += 1
        except Exception as e:
            logger.error(f"Failed to send weekly digest for user {student.id}: {e}")

    logger.info(f"Weekly digests sent: {digests_sent}")
    return digests_sent


# =============================================================================
# 8. 🔄 TỰ ĐỘNG QUẢN LÝ COUPON (COUPON LIFECYCLE)
# =============================================================================

def process_coupon_lifecycle():
    """
    Tự động quản lý vòng đời coupon.
    - Activate coupon khi đến start_date
    - Deactivate coupon khi quá end_date
    - Cảnh báo admin khi coupon sắp hết hạn (3 ngày)
    """
    from apps.promotions.repositories import coupon_repository
    from apps.users.repositories import user_repository

    now = timezone.now()
    results = {'activated': 0, 'deactivated': 0, 'expiring_soon': 0}

    # 1. Auto-activate coupons đến hạn
    pending_coupons = coupon_repository.get_coupons_for_activation(now)
    for coupon in pending_coupons:
        coupon.is_active = True
        coupon.save(update_fields=['is_active'])
        results['activated'] += 1
        logger.info(f"Auto-activated coupon {coupon.code}")

    # 2. Auto-deactivate coupons quá hạn
    expired_coupons = coupon_repository.get_active_expired_coupons(now)
    for coupon in expired_coupons:
        coupon.is_active = False
        coupon.save(update_fields=['is_active'])
        results['deactivated'] += 1
        logger.info(f"Auto-deactivated expired coupon {coupon.code}")

    # 3. Cảnh báo coupon sắp hết hạn (3 ngày)
    warning_time = now + timedelta(days=3)
    expiring_soon = coupon_repository.get_active_coupons_expiring_before(warning_time)
    for coupon in expiring_soon:
        # Gửi notification cho admin (người tạo coupon)
        try:
            notif_svc._create(
                recipient=coupon.created_by,
                title='⏰ Coupon sắp hết hạn',
                body=f'Mã "{coupon.code}" sẽ hết hạn vào {coupon.end_date.strftime("%d/%m/%Y")}. '
                     f'Hiện đã sử dụng {coupon.used_count}/{coupon.max_usage_count or "∞"} lượt.',
                notification_type=Notification.Type.SYSTEM,
                channel=Notification.Channel.IN_APP,
            )
            results['expiring_soon'] += 1
        except Exception as e:
            logger.error(f"Failed to notify admin about expiring coupon {coupon.code}: {e}")

    logger.info(f"Coupon lifecycle processed: {results}")
    return results


# =============================================================================
# 9. 🧠 GỢI Ý ÔN TẬP THÔNG MINH (SMART REVIEW)
# =============================================================================

def check_and_suggest_review(attempt, quiz, lesson_title):
    """
    Kiểm tra kết quả quiz và gợi ý ôn tập nếu điểm thấp.
    Được gọi sau khi học viên nộp bài quiz.
    
    Nếu điểm < 50% max_score: gợi ý xem lại lesson
    """
    from apps.lessons.repositories import lesson_repository

    if not attempt or not quiz:
        return None

    # Tính điểm tối đa
    max_score = sum(float(q.points) for q in quiz.questions.all())
    score = float(attempt.score)

    if max_score == 0:
        return None

    score_pct = (score / max_score) * 100

    if score_pct < 50:
        # Gợi ý ôn tập
        title = '📚 Bạn nên ôn lại bài học này'
        body = (
            f'Bạn đạt {score:.1f}/{max_score:.1f} điểm ({score_pct:.0f}%) '
            f'cho quiz "{quiz.title}".\n\n'
            f'💡 Hãy xem lại bài "{lesson_title}" trước khi làm lại quiz nhé!'
        )

        try:
            notif_svc._create(
                recipient=attempt.student,
                title=title,
                body=body,
                notification_type=Notification.Type.COURSE,
                channel=Notification.Channel.IN_APP,
            )
            return {
                'suggested': True,
                'score_pct': round(score_pct, 1),
                'lesson_title': lesson_title,
            }
        except Exception as e:
            logger.error(f"Failed to send smart review suggestion: {e}")

    return None


# =============================================================================
# 10. 📈 DASHBOARD INSIGHTS CHO ADMIN/INSTRUCTOR
# =============================================================================

def process_weekly_insights():
    """
    Tạo báo cáo insights hàng tuần cho instructor và admin.
    Gửi thông báo với các chỉ số quan trọng.
    
    - Tỷ lệ hoàn thành khóa học
    - Số học viên mới
    - Cảnh báo refund
    - Khóa học có performance thấp
    """
    from apps.enrollments.repositories import enrollment_repository
    from apps.courses.repositories import course_repository
    from apps.users.repositories import user_repository
    from django.db.models import Count, Avg, Q

    now = timezone.now()
    week_ago = now - timedelta(days=7)
    insights_sent = 0

    # Lấy tất cả instructor
    instructors = user_repository.get_users_by_role('INSTRUCTOR')

    for instructor in instructors:
        # Lấy các khóa học của instructor này
        courses = course_repository.get_by_instructor(instructor.id)

        for course in courses:
            enrollments = course.enrollments.all()
            total_enrollments = enrollments.count()
            completed_enrollments = enrollments.filter(status='COMPLETED').count()
            new_this_week = enrollments.filter(created_at__gte=week_ago).count()

            if total_enrollments == 0:
                continue

            completion_rate = round((completed_enrollments / total_enrollments) * 100, 1)

            # Cảnh báo nếu tỷ lệ hoàn thành thấp
            if total_enrollments >= 5 and completion_rate < 20:
                try:
                    notif_svc._create(
                        recipient=instructor,
                        title='📉 Cảnh báo: Tỷ lệ hoàn thành thấp',
                        body=f'Khóa học "{course.title}" có tỷ lệ hoàn thành chỉ {completion_rate}% '
                             f'({completed_enrollments}/{total_enrollments} học viên). '
                             f'Hãy xem xét cải thiện nội dung khóa học.',
                        notification_type=Notification.Type.COURSE,
                        channel=Notification.Channel.IN_APP,
                    )
                    insights_sent += 1
                except Exception as e:
                    logger.error(f"Failed to send insight for course {course.id}: {e}")

            # Báo cáo tuần
            if new_this_week > 0:
                try:
                    notif_svc._create(
                        recipient=instructor,
                        title=f'📊 Báo cáo tuần: {course.title}',
                        body=f'Tuần này có {new_this_week} học viên mới đăng ký khóa học "{course.title}".\n'
                             f'Tổng số: {total_enrollments} học viên, {completed_enrollments} đã hoàn thành.\n'
                             f'Tỷ lệ hoàn thành: {completion_rate}%',
                        notification_type=Notification.Type.COURSE,
                        channel=Notification.Channel.IN_APP,
                    )
                    insights_sent += 1
                except Exception as e:
                    logger.error(f"Failed to send weekly report for course {course.id}: {e}")

    logger.info(f"Weekly insights sent: {insights_sent}")
    return insights_sent