from django.db import models
from django.conf import settings
from uuid6 import uuid7

class CourseCertificate(models.Model):
    # Mỗi chứng chỉ sẽ có một mã định danh duy nhất (UUID) để dễ dàng quản lý và tra cứu
    id = models.UUIDField(primary_key=True,default=uuid7,editable=False)
    # Liên kết tới học viên đã hoàn thành khóa học và được cấp chứng chỉ
    student = models.ForeignKey( settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name="course_certificates")
    # Liên kết tới khóa học tương ứng mà học viên đã hoàn thành và được cấp chứng chỉ
    course = models.ForeignKey("courses.Course",on_delete=models.CASCADE, related_name="certificates")
    # Liên kết tới enrollment để đảm bảo chứng chỉ gắn với một lần đăng ký khóa học cụ thể
    enrollment = models.OneToOneField( "enrollments.Enrollment",on_delete=models.CASCADE,related_name="certificate")
    # Mã chứng chỉ duy nhất, có thể là UUID hoặc một chuỗi định dạng đặc biệt (VD: "CERT-2024-0001")
    certificate_code = models.CharField( max_length=50, unique=True)
    # URL để tải file chứng chỉ PDF 
    pdf_url = models.URLField(blank=True, default="")
    # URL ảnh chứng chỉ (PNG) đã upload lên Cloudinary
    image_url = models.URLField(blank=True, default="")
    # Thời điểm cấp chứng chỉ (tự động ghi khi tạo)
    issued_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "course_certificate"
        constraints = [
            models.UniqueConstraint(
                fields=["student", "course"],
                name="unique_student_course_certificate"
            )
        ]
        indexes = [
            models.Index(fields=["student", "issued_at"]),
            models.Index(fields=["course", "issued_at"]),
            models.Index(fields=["certificate_code"]),
        ]

    def __str__(self):
        return self.certificate_code