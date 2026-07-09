from apps.notifications import repositories as notif_repo
from apps.notifications.models import Notification


def get_user_notifications(user_id, page=1, page_size=20):
    return notif_repo.get_by_user(user_id, page, page_size)


def get_unread_count(user_id):
    return notif_repo.get_unread_count(user_id)


def mark_as_read(notification_id, user_id):
    return notif_repo.mark_as_read(notification_id, user_id)


def mark_all_as_read(user_id):
    return notif_repo.mark_all_as_read(user_id)


def get_recent(user_id, limit=5):
    return notif_repo.get_recent(user_id, limit)


def _create(recipient, title, body, notification_type, channel, link=None):
    return notif_repo.create(recipient, title, body, notification_type, channel, link)


def notify_login(user):
    unread = get_unread_count(user.id)
    return _create(
        recipient=user, title="Chào mừng bạn quay lại",
        body=f"Chào mừng bạn quay lại, {user.get_full_name() or 'bạn'}! Hôm nay bạn có {unread} thông báo chưa đọc.",
        notification_type=Notification.Type.ACCOUNT, channel=Notification.Channel.IN_APP,
    )


def notify_password_change(user):
    return _create(
        recipient=user, title="Mật khẩu đã được thay đổi",
        body="Mật khẩu của bạn đã được thay đổi thành công. Nếu bạn không thực hiện, vui lòng liên hệ admin ngay.",
        notification_type=Notification.Type.ACCOUNT, channel=Notification.Channel.EMAIL,
    )


def notify_profile_update(user):
    return _create(
        recipient=user, title="Cập nhật thông tin thành công",
        body="Thông tin cá nhân của bạn đã được cập nhật thành công.",
        notification_type=Notification.Type.ACCOUNT, channel=Notification.Channel.IN_APP,
    )


def notify_account_locked(user, reason, admin_email):
    return _create(
        recipient=user, title="Tài khoản đã bị khóa",
        body=f"Tài khoản của bạn đã bị khóa. Lý do: {reason}. Vui lòng liên hệ {admin_email} để được hỗ trợ.",
        notification_type=Notification.Type.SYSTEM, channel=Notification.Channel.EMAIL,
    )


def notify_account_unlocked(user):
    return _create(
        recipient=user, title="Tài khoản đã được mở khóa",
        body="Tài khoản của bạn đã được mở khóa. Bạn có thể đăng nhập và tiếp tục học tập.",
        notification_type=Notification.Type.SYSTEM, channel=Notification.Channel.EMAIL,
    )


def notify_instructor_approved(user):
    return _create(
        recipient=user, title="Hồ sơ giảng viên đã được duyệt",
        body="Hồ sơ giảng viên của bạn đã được phê duyệt. Bạn có thể bắt đầu tạo khóa học và giảng dạy ngay hôm nay.",
        notification_type=Notification.Type.SYSTEM, channel=Notification.Channel.EMAIL,
    )


def notify_instructor_rejected(user, reason):
    return _create(
        recipient=user, title="Hồ sơ giảng viên bị từ chối",
        body=f"Hồ sơ giảng viên của bạn đã bị từ chối. Lý do: {reason}. Vui lòng chỉnh sửa và gửi lại.",
        notification_type=Notification.Type.SYSTEM, channel=Notification.Channel.EMAIL,
    )


def notify_payment_success(user, course_title, price):
    return _create(
        recipient=user, title="Thanh toán thành công",
        body=f'Bạn đã thanh toán thành công {price} cho khóa học "{course_title}". Chúc bạn học tập vui vẻ!',
        notification_type=Notification.Type.PAYMENT, channel=Notification.Channel.EMAIL,
    )


def notify_refund_approved(user, course_title):
    return _create(
        recipient=user, title="Hoàn tiền được duyệt",
        body=f'Yêu cầu hoàn tiền cho khóa học "{course_title}" đã được duyệt. Số tiền sẽ được hoàn lại trong 5-7 ngày làm việc.',
        notification_type=Notification.Type.PAYMENT, channel=Notification.Channel.EMAIL,
    )


def notify_refund_rejected(user, course_title, reason):
    return _create(
        recipient=user, title="Hoàn tiền bị từ chối",
        body=f'Yêu cầu hoàn tiền cho khóa học "{course_title}" đã bị từ chối. Lý do: {reason}',
        notification_type=Notification.Type.PAYMENT, channel=Notification.Channel.IN_APP,
    )


def notify_instructor_paid(instructor, amount, course_title):
    return _create(
        recipient=instructor, title="Đã giải ngân",
        body=f'Khoản thanh toán {amount} từ khóa học "{course_title}" đã được giải ngân vào tài khoản của bạn.',
        notification_type=Notification.Type.PAYMENT, channel=Notification.Channel.IN_APP,
    )


def notify_course_published(instructor, course_title):
    return _create(
        recipient=instructor, title='Khóa học đã được xuất bản',
        body=f'Khóa học "{course_title}" đã được admin xuất bản. Học viên có thể đăng ký và học ngay.',
        notification_type=Notification.Type.COURSE, channel=Notification.Channel.IN_APP,
    )


def notify_course_hidden(instructor, course_title):
    return _create(
        recipient=instructor, title="Khóa học bị tạm ẩn",
        body=f'Khóa học "{course_title}" đã bị admin tạm ẩn. Vui lòng liên hệ admin để biết chi tiết.',
        notification_type=Notification.Type.COURSE, channel=Notification.Channel.IN_APP,
    )


def notify_instructor_assigned(instructor, course_title):
    return _create(
        recipient=instructor, title="Phân công giảng dạy mới",
        body=f'Bạn được phân công giảng dạy khóa học "{course_title}". Hãy kiểm tra và chuẩn bị bài giảng.',
        notification_type=Notification.Type.COURSE, channel=Notification.Channel.IN_APP,
    )


def notify_student_enrolled(instructor, student_name, course_title):
    return _create(
        recipient=instructor, title="Có học viên mới",
        body=f'Học viên {student_name} vừa đăng ký khóa học "{course_title}" của bạn.',
        notification_type=Notification.Type.COURSE, channel=Notification.Channel.IN_APP,
    )


def notify_course_completed(student, course_title):
    return _create(
        recipient=student, title="Hoàn thành khóa học",
        body=f'Chúc mừng! Bạn đã hoàn thành 100% khóa học "{course_title}". Chứng chỉ đã được cấp, kiểm tra trong mục Chứng chỉ của tôi.',
        notification_type=Notification.Type.COURSE, channel=Notification.Channel.EMAIL,
    )


def notify_essay_graded(student, quiz_title, course_title, score, max_score):
    return _create(
        recipient=student, title="Bài tập đã được chấm điểm",
        body=f'Bài tập "{quiz_title}" trong khóa học "{course_title}" đã được chấm điểm: {score}/{max_score}.',
        notification_type=Notification.Type.COURSE, channel=Notification.Channel.IN_APP,
    )


def notify_support_request_created(admin, user_name, request_type, title):
    return _create(
        recipient=admin, title="Yêu cầu hỗ trợ mới",
        body=f'{user_name} đã gửi yêu cầu {request_type}: {title}. Nhấp để xem chi tiết và xử lý.',
        notification_type=Notification.Type.SUPPORT, channel=Notification.Channel.EMAIL, link="/admin/requests",
    )


def notify_support_request_processed(user, title, status, resolution_note):
    return _create(
        recipient=user, title=f"Yêu cầu đã được xử lý: {status}",
        body=f'Yêu cầu "{title}" đã được xử lý: {status}. Phản hồi từ admin: {resolution_note}',
        notification_type=Notification.Type.SUPPORT, channel=Notification.Channel.EMAIL,
    )


def notify_payout_completed(instructor, amount, course_title):
    """#27: Thanh toán cho giảng viên"""
    return _create(
        recipient=instructor, title="Đã nhận được thanh toán",
        body=f'Khoản thanh toán {amount} từ khóa học "{course_title}" đã được giải ngân vào tài khoản của bạn.',
        notification_type=Notification.Type.PAYMENT, channel=Notification.Channel.IN_APP,
    )


# ====== REVIEW NOTIFICATIONS ======

def notify_new_review(instructor, student_name, course_title, rating, content):
    """#25: Có đánh giá mới - gửi cho giảng viên"""
    return _create(
        recipient=instructor, title="Có đánh giá mới",
        body=f'{student_name} đã đánh giá {rating}/5 sao cho khóa học "{course_title}". Nội dung: {content}',
        notification_type=Notification.Type.COURSE, channel=Notification.Channel.IN_APP,
    )


def notify_review_replied(student, instructor_name, course_title):
    """#26: Giảng viên phản hồi đánh giá - gửi cho học viên"""
    return _create(
        recipient=student, title="Phản hồi đánh giá của bạn",
        body=f'Giảng viên {instructor_name} đã phản hồi đánh giá của bạn về khóa học "{course_title}".',
        notification_type=Notification.Type.COURSE, channel=Notification.Channel.IN_APP,
    )


def notify_question_asked(instructor, student_name, course_title, question_title):
    """#23: Học viên đặt câu hỏi mới - gửi cho giảng viên"""
    return _create(
        recipient=instructor, title="Câu hỏi mới từ học viên",
        body=f'{student_name} đã đặt câu hỏi trong khóa học "{course_title}": {question_title}',
        notification_type=Notification.Type.COURSE, channel=Notification.Channel.IN_APP,
    )