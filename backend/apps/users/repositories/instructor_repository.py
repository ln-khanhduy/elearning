from django.shortcuts import get_object_or_404
from apps.users.models import InstructorProfile, InstructorCertificate


def get_all_applications(status_filter=None):
    """Lấy danh sách hồ sơ giảng viên, có thể lọc theo trạng thái, sắp xếp theo thời gian nộp đơn mới nhất."""
    qs = InstructorProfile.objects.select_related("user", "user__role", "reviewed_by").all().order_by("-applied_at")
    if status_filter:
        qs = qs.filter(status=status_filter.upper())
    return qs


def get_application_by_id(application_id):
    """Lấy hồ sơ giảng viên theo ID, trả về 404 nếu không tìm thấy."""
    return get_object_or_404(InstructorProfile.objects.select_related("user", "user__role", "reviewed_by"), id=application_id)


def get_application_by_email(email):
    """Lấy hồ sơ giảng viên theo email, trả về None nếu không tìm thấy."""
    try:
        return InstructorProfile.objects.select_related("user", "user__role", "reviewed_by").get(email=email)
    except InstructorProfile.DoesNotExist:
        return None


def create_application(validated_data):
    """Tạo mới hồ sơ giảng viên với trạng thái mặc định là PENDING."""
    return InstructorProfile.objects.create(user=None, status=InstructorProfile.Status.PENDING, **validated_data)


def create_certificate(application, title, file):
    """Tạo mới một chứng chỉ cho hồ sơ giảng viên."""
    return InstructorCertificate.objects.create(profile=application, title=title, file=file)


def get_certificates_by_application(application):
    """Lấy danh sách chứng chỉ của hồ sơ giảng viên, sắp xếp theo thời gian tải lên mới nhất."""
    return InstructorCertificate.objects.filter(profile=application).order_by("-uploaded_at")


def get_certificate_by_id(application, certificate_id):
    """Lấy chứng chỉ theo ID thuộc đúng hồ sơ giảng viên, trả về 404 nếu không tìm thấy."""
    return get_object_or_404(InstructorCertificate, id=certificate_id, profile=application)


def delete_certificate(application, certificate_id):
    """Xóa chứng chỉ của hồ sơ giảng viên."""
    certificate = get_certificate_by_id(application, certificate_id)
    certificate.delete()
