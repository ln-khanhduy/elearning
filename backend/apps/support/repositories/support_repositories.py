from apps.support.models import SupportRequest
from rest_framework.exceptions import NotFound


def get_by_id(request_id):
    request_obj = SupportRequest.objects.select_related("user", "assigned_to", "transaction").filter(id=request_id).first()
    if not request_obj:
        raise NotFound("Không tìm thấy yêu cầu.")
    return request_obj


def get_by_user(user_id):
    return SupportRequest.objects.select_related("assigned_to", "transaction").filter(user_id=user_id).order_by("-created_at")


def get_by_request_type(request_type):
    return SupportRequest.objects.select_related("user", "assigned_to", "transaction").filter(request_type=request_type).order_by("-created_at")


def get_all():
    return SupportRequest.objects.select_related("user", "assigned_to", "transaction").all().order_by("-created_at")


def create(data):
    return SupportRequest.objects.create(**data)


def update_status(request_obj, status, assigned_to=None, resolution_note=None):
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