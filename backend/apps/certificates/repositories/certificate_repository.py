from apps.certificates.models import CourseCertificate


def get_by_enrollment(enrollment):
    """Lấy chứng chỉ theo enrollment."""
    return CourseCertificate.objects.filter(enrollment=enrollment).first()


def create(user, course_id, enrollment, certificate_code, pdf_url="", image_url=""):
    """Tạo chứng chỉ mới."""
    return CourseCertificate.objects.create(
        student=user,
        course_id=course_id,
        enrollment=enrollment,
        certificate_code=certificate_code,
        pdf_url=pdf_url,
        image_url=image_url,
    )


def get_or_create(user, course_id, enrollment, defaults=None):
    """Tìm hoặc tạo chứng chỉ."""
    return CourseCertificate.objects.get_or_create(
        student=user,
        course_id=course_id,
        enrollment=enrollment,
        defaults=defaults or {},
    )