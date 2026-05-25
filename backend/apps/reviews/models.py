from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class Review(models.Model):
	"""
	Đánh giá / bình luận của người dùng về khóa học hoặc bài học.
	Hỗ trợ  giảng viên / admin có thể phản hồi.
	Một lượt mua (enrollment) có thể để lại nhiều review (review riêng từng bài học).
	"""
	STATUS_CHOICES = (
		('PUBLISHED', 'Published'),  # Hiển thị công khai
		('HIDDEN', 'Hidden'),        # Bị ẩn bởi admin / giảng viên
		('DELETED', 'Deleted'),      # Đã xóa mềm
	)
	# ID tự tăng cho mỗi review
	id = models.BigAutoField(primary_key=True)  
	# Khóa học được đánh giá
	course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='reviews')
	# Lượt mua tương ứng (NULL nếu review không yêu cầu phải mua trước)
	enrollment = models.ForeignKey(
		'enrollments.Enrollment',
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name='reviews',
	)
	# Bài học được đánh giá (NULL = review cho toàn khóa học)
	lesson = models.ForeignKey('lessons.Lesson', on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
	# Người viết review
	user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='reviews')
	# Review cha (NULL = review gốc, không NULL = là reply)
	parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
	# Điểm sao 1-5 (NULL cho reply vì reply không cần chấm điểm)
	rating = models.PositiveSmallIntegerField(
		null=True,
		blank=True,
		validators=[MinValueValidator(1), MaxValueValidator(5)]
	)
	content = models.TextField()  # Nội dung review / bình luận
	status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PUBLISHED')
	# Thời điểm người dùng sửa lần cuối
	edited_at = models.DateTimeField(null=True, blank=True)
	# Thời điểm tạo comment
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		db_table = 'review'
		ordering = ['-created_at']
		indexes = [
			models.Index(fields=['course', 'status', 'created_at']),     # Hiển thị review công khai của khóa học
		]
