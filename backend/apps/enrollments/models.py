from django.db import models
from django.conf import settings

class Enrollment(models.Model):
	"""
	Đăng ký khóa học của học viên.
	Ràng buộc: 1 học viên chỉ được đăng ký 1 khóa học đúng 1 lần.
	"""
	# Trạng thái thanh toán
	STATUS_CHOICES = (
		('PENDING_PAYMENT', 'Pending payment'),   # Chưa thanh toán, chờ học viên hoàn tất GD
		('ACTIVE', 'Active'),                    # Đã thanh toán, đang học
		('COMPLETED', 'Completed'),              # Đã hoàn thành toàn bộ khóa học
		('CANCELLED', 'Cancelled'),              # Bị hủy (hoàn tiền thành công hoặc hết hạn)
	)
	# Trạng thái hoàn tiền
	REFUND_STATUS_CHOICES = (
		('NONE', 'None'),            # Chưa yêu cầu hoàn tiền
		('REQUESTED', 'Requested'),  # Học viên đã gửi yêu cầu hoàn tiền
		('APPROVED', 'Approved'),    # Finance Admin đã duyệt hoàn tiền
		('REJECTED', 'Rejected'),    # Finance Admin từ chối hoàn tiền
		('REFUNDED', 'Refunded'),    # Đã hoàn tiền thực tế về tài khoản học viên
	)

	# id học viên đăng ký
	student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_enrollments')
	# id khóa học được đăng ký
	course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='enrollments')
	# id giao dịch thanh toán tương ứng (NULL nếu chưa thanh toán / khóa học miễn phí)
	payment_transaction = models.OneToOneField(
		'payments.PaymentTransaction',
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name='enrollment',
	)
	# Trạng thái đăng ký 
	status = models.CharField(max_length=20, choices=STATUS_CHOICES,default='PENDING_PAYMENT')
	# Trạng thái hoàn tiền 
	refund_status = models.CharField(max_length=20, choices=REFUND_STATUS_CHOICES, default='NONE')
	# Thời điểm học viên chính thức đăng ký (sau khi thanh toán)
	enrolled_at = models.DateTimeField(null=True, blank=True)
	# Thời điểm hệ thống mở quyền truy cập nội dung khóa học
	access_granted_at = models.DateTimeField(null=True, blank=True)
	# Thời điểm học viên gửi yêu cầu hoàn tiền
	refund_requested_at = models.DateTimeField(null=True, blank=True)
	# Thời điểm Finance Admin duyệt yêu cầu hoàn tiền
	refund_approved_at = models.DateTimeField(null=True, blank=True)
	# Thời điểm tiền thực tế được hoàn về tài khoản học viên
	refunded_at = models.DateTimeField(null=True, blank=True)
	# Thời điểm học viên hoàn thành toàn bộ bài học
	completed_at = models.DateTimeField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		db_table = 'enrollment'
		constraints = [
			# Một học viên chỉ đăng ký một khóa học đúng 1 lần
			models.UniqueConstraint(fields=['student', 'course'], name='unique_student_course_enrollment'),
		]
		ordering = ['-created_at']
		indexes = [
			models.Index(fields=['status', 'created_at']),              # Lọc đăng ký theo trạng thái
			models.Index(fields=['refund_status', 'created_at']),       # Theo dõi hàng đợi hoàn tiền
		]


class LessonProgress(models.Model):
	"""
	Tiến độ chi tiết từng bài học của học viên.
	Mỗi bản ghi tương ứng 1 học viên đã hoàn thành 1 bài học trong khóa học đã đăng ký.
	"""
	enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='lesson_progresses')
	lesson = models.ForeignKey('lessons.Lesson', on_delete=models.CASCADE, related_name='student_progresses')
	completed = models.BooleanField(default=False)
	completed_at = models.DateTimeField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		db_table = 'lesson_progress'
		constraints = [
			models.UniqueConstraint(fields=['enrollment', 'lesson'], name='unique_enrollment_lesson_progress'),
		]
		ordering = ['-updated_at']


class CourseProgress(models.Model):
	"""
	Bảng tổng hợp tiến độ học tập của học viên cho một khóa học.
	Dùng để hiển thị % hoàn thành, bài học cuối cùng đã học và thời điểm hoạt động gần nhất.
	"""
	# Liên kết 1-1 với lượt đăng ký khóa học
	enrollment = models.OneToOneField(Enrollment,on_delete=models.CASCADE,related_name='progress',)
	# Số bài học đã hoàn thành
	completed_lessons_count = models.PositiveIntegerField(default=0)
	# Tổng số bài học trong khóa tại thời điểm ghi nhận
	total_lessons_count = models.PositiveIntegerField(default=0)
	# % hoàn thành, có thể cập nhật dần theo tiến độ
	progress_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
	# Bài học cuối cùng học viên đã tương tác / hoàn thành
	last_completed_lesson = models.ForeignKey(
		'lessons.Lesson',
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name='last_progress_records',
	)
	# Thời điểm bắt đầu học khóa này
	started_at = models.DateTimeField(null=True, blank=True)
	# Thời điểm có hoạt động học gần nhất
	last_activity_at = models.DateTimeField(null=True, blank=True)
	# Thời điểm hoàn thành 100% khóa học
	completed_at = models.DateTimeField(null=True, blank=True)

	class Meta:
		db_table = 'course_progress'
		ordering = ['-last_activity_at']
		indexes = [
			models.Index(fields=['last_activity_at']),
		]
