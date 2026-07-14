"""
Management command chạy tất cả tác vụ tự động hóa.
Có thể chạy thủ công: python manage.py run_automation
Hoặc cấu hình cron/task scheduler để chạy hàng ngày.

Các tác vụ:
1. Tự động cấp chứng chỉ cho học viên hoàn thành khóa học
2. Tự động gửi nhắc nhở học viên không hoạt động
3. Tự động chuyển HOLD → PAID khi hết thời gian giữ tiền
4. Tự động gửi email mời đánh giá khi hoàn thành
5. Tự động tổng hợp báo cáo hàng tuần
"""
import logging
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Q

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Chạy tất cả tác vụ tự động hóa hệ thống"

    def add_arguments(self, parser):
        parser.add_argument('--tasks', nargs='+', type=str, default=None,
                          help='Chạy tác vụ cụ thể: certificates|reminders|payouts|reviews|reports')

    def handle(self, *args, **options):
        tasks = options.get('tasks')
        run_all = tasks is None

        self.stdout.write(self.style.SUCCESS('[AUTO] === BẮT ĐẦU TÁC VỤ TỰ ĐỘNG HÓA ==='))
        self.stdout.write(f'[AUTO] Thời gian: {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}')
        self.stdout.write(f'[AUTO] Chạy tất cả: {run_all}, Task chỉ định: {tasks or "không"}')

        results = {}

        if run_all or 'certificates' in tasks:
            results['certificates'] = self._auto_issue_certificates()
        if run_all or 'reminders' in tasks:
            results['reminders'] = self._auto_send_reminders()
        if run_all or 'payouts' in tasks:
            results['payouts'] = self._auto_process_payouts()
        if run_all or 'reviews' in tasks:
            results['reviews'] = self._auto_send_review_invitations()
        if run_all or 'reports' in tasks:
            results['reports'] = self._generate_weekly_report()

        if run_all:
            self._log_automation_summary(results)

        self.stdout.write(self.style.SUCCESS('[AUTO] === HOÀN THÀNH ==='))

    # ==================== 1. TỰ ĐỘNG CẤP CHỨNG CHỈ ====================
    def _auto_issue_certificates(self):
        """Tự động cấp chứng chỉ cho học viên hoàn thành 100% khóa học."""
        from apps.enrollments.models import CourseProgress, Enrollment
        from apps.certificates.models import CourseCertificate

        completed_progress = CourseProgress.objects.filter(
            progress_percent__gte=Decimal('100.00'),
        ).select_related('enrollment__student', 'enrollment__course')

        count = 0
        for progress in completed_progress:
            enrollment = progress.enrollment
            if not enrollment or not enrollment.student or not enrollment.course:
                continue

            # Kiểm tra chứng chỉ đã tồn tại chưa
            existing = CourseCertificate.objects.filter(
                student=enrollment.student,
                course=enrollment.course,
            ).first()

            if existing:
                continue  # Đã có rồi, bỏ qua

            try:
                from uuid6 import uuid7
                import hashlib
                code_str = f"{enrollment.student.id}-{enrollment.course.id}-{timezone.now().timestamp()}"
                CourseCertificate.objects.create(
                    student=enrollment.student,
                    course=enrollment.course,
                    enrollment=enrollment,
                    certificate_code=f"CERT-{hashlib.md5(code_str.encode()).hexdigest()[:8].upper()}",
                )
                # Gửi thông báo
                from apps.notifications.services.notification_service import notify_course_completed
                try:
                    notify_course_completed(enrollment.student, enrollment.course.title)
                except Exception:
                    pass
                count += 1
            except Exception as e:
                logger.error(f"Lỗi cấp chứng chỉ cho {enrollment.student.email}: {e}")

        self.stdout.write(f'[AUTO] Cấp chứng chỉ: Đã cấp {count} chứng chỉ mới')
        return {'issued': count}

    # ==================== 2. NHẮC NHỞ HỌC VIÊN KHÔNG HOẠT ĐỘNG ====================
    def _auto_send_reminders(self):
        """Gửi nhắc nhở cho học viên không hoạt động > 7 ngày."""
        from apps.enrollments.models import Enrollment, CourseProgress
        from apps.notifications.models import Notification

        now = timezone.now()
        reminder_count = 0
        escalation_count = 0

        # Học viên không hoạt động 7-13 ngày → nhắc nhở
        inactive_7_days = CourseProgress.objects.filter(
            enrollment__status=Enrollment.Status.ACTIVE,
            last_activity_at__lte=now - timedelta(days=7),
            last_activity_at__gt=now - timedelta(days=14),
        ).select_related('enrollment__student', 'enrollment__course')

        for progress in inactive_7_days:
            enrollment = progress.enrollment
            if not enrollment.student or not enrollment.course:
                continue
            try:
                Notification.objects.create(
                    recipient=enrollment.student,
                    title="Bạn đã lâu không học tập",
                    body=f'Đã { (now - progress.last_activity_at).days } ngày bạn chưa truy cập khóa học "{enrollment.course.title}". Hãy tiếp tục học ngay!',
                    notification_type=Notification.Type.COURSE,
                    channel=Notification.Channel.EMAIL,
                    link=f"/learning/courses/{enrollment.course_id}/",
                    send_status=Notification.SendStatus.SENT,
                )
                reminder_count += 1
            except Exception as e:
                logger.error(f"Lỗi gửi reminder: {e}")

        # Học viên không hoạt động > 14 ngày → cảnh báo cao hơn
        inactive_14_days = CourseProgress.objects.filter(
            enrollment__status=Enrollment.Status.ACTIVE,
            last_activity_at__lte=now - timedelta(days=14),
        ).select_related('enrollment__student', 'enrollment__course')

        for progress in inactive_14_days:
            enrollment = progress.enrollment
            if not enrollment.student or not enrollment.course:
                continue
            try:
                Notification.objects.create(
                    recipient=enrollment.student,
                    title="Cảnh báo: Nguy cơ mất tiến độ học tập",
                    body=f'Bạn đã không truy cập khóa học "{enrollment.course.title}" trong { (now - progress.last_activity_at).days } ngày. Hãy quay lại học để không bị tụt lại phía sau!',
                    notification_type=Notification.Type.COURSE,
                    channel=Notification.Channel.EMAIL,
                    link=f"/learning/courses/{enrollment.course_id}/",
                    send_status=Notification.SendStatus.SENT,
                )
                escalation_count += 1
            except Exception as e:
                logger.error(f"Lỗi gửi escalation: {e}")

        self.stdout.write(f'[AUTO] Nhắc nhở: {reminder_count} nhắc nhở + {escalation_count} cảnh báo')
        return {'reminders': reminder_count, 'escalations': escalation_count}

    # ==================== 3. CHUYỂN HOLD → PAID ====================
    def _auto_process_payouts(self):
        """Tự động chuyển các giao dịch HOLD hết hạn sang PAID."""
        from apps.payments.models import PaymentTransaction
        from apps.payments.repositories import payment_repository

        now = timezone.now()
        expired_holds = PaymentTransaction.objects.filter(
            status=PaymentTransaction.Status.HOLD,
            hold_time__lte=now,
        ).select_related('course__assigned_instructor')

        paid_count = 0
        for t in expired_holds:
            try:
                payment_repository.update(t, status=PaymentTransaction.Status.PAID, paid_at=now)
                paid_count += 1

                # Thông báo cho giảng viên
                instructor = t.course.assigned_instructor if t.course else None
                if instructor:
                    from apps.notifications.services.notification_service import notify_instructor_paid
                    try:
                        notify_instructor_paid(
                            instructor,
                            f"{t.instructor_share_amount:,.0f}₫",
                            t.course.title if t.course else "N/A",
                        )
                    except Exception:
                        pass
            except Exception as e:
                logger.error(f"Lỗi xử lý payout {t.id}: {e}")

        self.stdout.write(f'[AUTO] Payout: Đã thanh toán {paid_count} giao dịch')
        return {'paid': paid_count}

    # ==================== 4. MỜI ĐÁNH GIÁ ====================
    def _auto_send_review_invitations(self):
        """Gửi email mời đánh giá cho học viên hoàn thành khóa học."""
        from apps.enrollments.models import Enrollment, CourseProgress
        from apps.reviews.models import Review
        from apps.notifications.models import Notification

        now = timezone.now()
        # Học viên hoàn thành được 3 ngày mà chưa đánh giá
        completed = CourseProgress.objects.filter(
            progress_percent__gte=Decimal('100.00'),
            enrollment__status=Enrollment.Status.COMPLETED,
        ).select_related('enrollment__student', 'enrollment__course')

        invited = 0
        for progress in completed:
            enrollment = progress.enrollment
            if not enrollment.student or not enrollment.course:
                continue

            # Kiểm tra đã đánh giá chưa
            has_reviewed = Review.objects.filter(
                user=enrollment.student,
                course=enrollment.course,
            ).exists()
            if has_reviewed:
                continue

            try:
                Notification.objects.create(
                    recipient=enrollment.student,
                    title="Đánh giá khóa học của bạn",
                    body=f'Bạn đã hoàn thành khóa học "{enrollment.course.title}". Hãy chia sẻ trải nghiệm của bạn bằng cách để lại đánh giá!',
                    notification_type=Notification.Type.COURSE,
                    channel=Notification.Channel.EMAIL,
                    link=f"/courses/{enrollment.course_id}",
                    send_status=Notification.SendStatus.SENT,
                )
                invited += 1
            except Exception as e:
                logger.error(f"Lỗi gửi review invitation: {e}")

        self.stdout.write(f'[AUTO] Mời đánh giá: Đã gửi {invited} lời mời')
        return {'invited': invited}

    # ==================== 5. BÁO CÁO HÀNG TUẦN ====================
    def _generate_weekly_report(self):
        """Tổng hợp báo cáo hàng tuần gửi cho admin."""
        from apps.enrollments.models import Enrollment, CourseProgress
        from apps.payments.models import PaymentTransaction
        from apps.courses.models import Course
        from django.contrib.auth import get_user_model
        from apps.notifications.models import Notification

        User = get_user_model()
        now = timezone.now()
        week_ago = now - timedelta(days=7)

        # Thống kê
        new_students = User.objects.filter(
            role__code='STUDENT',
            date_joined__gte=week_ago,
        ).count()

        new_enrollments = Enrollment.objects.filter(
            created_at__gte=week_ago,
        ).count()

        completed_courses = CourseProgress.objects.filter(
            completed_at__gte=week_ago,
        ).count()

        revenue_week = PaymentTransaction.objects.filter(
            status__in=[PaymentTransaction.Status.PAID, PaymentTransaction.Status.HOLD],
            paid_at__gte=week_ago,
        ).aggregate(total=models.Sum('net_amount'))['total'] or 0

        new_courses = Course.objects.filter(
            created_at__gte=week_ago,
        ).count()

        report = f"""
=== BÁO CÁO HÀNG TUẦN ({week_ago.strftime('%d/%m')} - {now.strftime('%d/%m/%Y')}) ===

📊 TỔNG QUAN:
- Học viên mới: {new_students}
- Đăng ký mới: {new_enrollments}
- Khóa học mới: {new_courses}
- Học viên hoàn thành: {completed_courses}
- Doanh thu tuần: {revenue_week:,.0f}₫
        """.strip()

        # Gửi cho tất cả admin
        admins = User.objects.filter(
            Q(role__code='SUPERADMIN') | Q(role__code='COURSE_ADMIN') | Q(role__code='FINANCE_ADMIN')
        )

        sent = 0
        for admin in admins:
            try:
                Notification.objects.create(
                    recipient=admin,
                    title=f"Báo cáo hàng tuần ({now.strftime('%d/%m/%Y')})",
                    body=report,
                    notification_type=Notification.Type.SYSTEM,
                    channel=Notification.Channel.EMAIL,
                    send_status=Notification.SendStatus.SENT,
                )
                sent += 1
            except Exception as e:
                logger.error(f"Lỗi gửi báo cáo cho {admin.email}: {e}")

        self.stdout.write(f'[AUTO] Báo cáo: Đã gửi {sent} báo cáo hàng tuần')
        return {'reports_sent': sent}

    # ==================== LOG SUMMARY ====================
    def _log_automation_summary(self, results):
        """Ghi log tổng kết vào database."""
        from apps.system.models import AdminActivityLog

        try:
            summary = []
            for task, result in results.items():
                if result:
                    details = ', '.join(f'{k}={v}' for k, v in result.items())
                    summary.append(f'{task}: {details}')

            # Log system
            from apps.system.services import admin_log_service
            from django.contrib.auth import get_user_model
            admin_log_service.log(
                admin=None,
                action_type='AUTOMATION_RUN',
                detail='Tác vụ tự động: ' + ' | '.join(summary),
            )
        except Exception as e:
            logger.error(f"Lỗi ghi log automation: {e}")


# Import models for aggregation
import django.db.models as models