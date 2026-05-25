from django.db import models


class Notification(models.Model):
	"""
	Thông báo gửi đến người dùng.
	Mỗi bản ghi = 1 thông báo đến 1 người .
	Một sự kiện có thể tạo nhiều bản ghi nếu gửi qua nhiều kênh cùng lúc.
	"""

	TYPE_CHOICES = (
		('SYSTEM', 'System'),    # Thông báo hệ thống (bảo trì, cập nhật,...)
		('PAYMENT', 'Payment'),  # Liên quan thanh toán (mua thành công, hoàn tiền,...)
		('COURSE', 'Course'),    # Liên quan khóa học (được duyệt, bài mới,...)
		('SUPPORT', 'Support'),  # Liên quan hỗ trợ (có phản hồi mới,...)
		('ACCOUNT', 'Account'),  # Liên quan tài khoản (bị khóa, đổi mật khẩu,...)
	)

	CHANNEL_CHOICES = (
		('IN_APP', 'In app'),      # Hiển thị trong web (chuông thông báo)
		('EMAIL', 'Email'),        # Gửi qua email
	)

	SEND_STATUS_CHOICES = (
		('PENDING', 'Pending'),    # Chưa gửi
		('SENT', 'Sent'),          # Gửi thành công
		('FAILED', 'Failed'),      # Gửi thất bại
	)

	# id người nhận thông báo
	recipient = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='notifications')
	# Tiêu đề 
	title = models.CharField(max_length=255)
	# Nội dung chi tiết
	body = models.TextField()
	# Loại thông báo                
	notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='SYSTEM')
	# Cách gửi thông báo (IN_APP / EMAIL)
	channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default='IN_APP')
	# Đường dẫn khi người dùng click vào thông báo (VD: /courses/123/)
	target_url = models.CharField(max_length=500, null=True, blank=True)
	# True = người dùng đã đọc thông báo này
	is_read = models.BooleanField(default=False)
	# Thời điểm người dùng đọc
	read_at = models.DateTimeField(null=True, blank=True)
	# Trạng thái gửi (PENDING / SENT / FAILED)
	send_status = models.CharField(max_length=20, choices=SEND_STATUS_CHOICES, default='PENDING')
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		db_table = 'notification'
		ordering = ['-created_at']
		indexes = [
			models.Index(fields=['recipient', 'is_read']),     # Đếm / lọc thông báo chưa đọc
		]