from apps.support.models import SupportRequest
from rest_framework.exceptions import NotFound


def get_by_id(request_id):
    """Lấy yêu cầu hỗ trợ theo ID kèm thông tin người dùng, người phụ trách và giao dịch.

    Trả về lỗi NotFound nếu không tìm thấy.
    """
    request_obj = SupportRequest.objects.select_related("user", "assigned_to", "transaction").filter(id=request_id).first()
    if not request_obj:
        raise NotFound("Không tìm thấy yêu cầu.")
    return request_obj


def get_by_user(user_id):
    """Lấy danh sách yêu cầu hỗ trợ của một người dùng, sắp xếp theo thời gian tạo mới nhất."""
    return SupportRequest.objects.select_related("assigned_to", "transaction").filter(user_id=user_id).order_by("-created_at")


def get_by_request_type(request_type):
    """Lấy danh sách yêu cầu hỗ trợ theo loại yêu cầu, sắp xếp theo thời gian tạo mới nhất."""
    return SupportRequest.objects.select_related("user", "assigned_to", "transaction").filter(request_type=request_type).order_by("-created_at")


def get_all():
    """Lấy tất cả yêu cầu hỗ trợ, sắp xếp theo thời gian tạo mới nhất."""
    return SupportRequest.objects.select_related("user", "assigned_to", "transaction").all().order_by("-created_at")


def create(data):
    """Tạo mới một yêu cầu hỗ trợ."""
    return SupportRequest.objects.create(**data)


def update_status(request_obj, status, assigned_to=None, resolution_note=None):
    """Cập nhật trạng thái của yêu cầu hỗ trợ.

    - Gán người phụ trách (assigned_to) và ghi chú giải quyết nếu được cung cấp.
    - Nếu trạng thái là RESOLVED hoặc REJECTED, thiết lập thời gian resolved_at là hiện tại.
    """
    from django.utils import timezone
    request_obj.status = status
    if assigned_to:
        request_obj.assigned_to = assigned_to
    if resolution_note:
        request_obj.resolution_note = resolution_note
    if status in [SupportRequest.Status.RESOLVED, SupportRequest.Status.REJECTED]:
        request_obj.resolved_at = timezone.now()
    request_obj.save(update_fields=["status", "assigned_to", "resolution_note", "resolved_at", "updated_at"])
    return request_obj