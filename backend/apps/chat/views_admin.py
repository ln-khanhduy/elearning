from rest_framework import status

from apps.common.base_api_view import BasePermissionAPIView
from apps.common.response_helpers import success_response, error_response
from apps.chat.services import admin_service


class ChatReportListAPIView(BasePermissionAPIView):
    required_permission = "chat.report.view"

    def get(self, request):
        page = int(request.GET.get("page", 1))
        page_size = int(request.GET.get("page_size", 20))
        status_filter = request.GET.get("status")
        data = admin_service.list_reports(request.user, status=status_filter, page=page, page_size=page_size)
        return success_response({
            "items": [_serialize_report(r) for r in data["items"]],
            "total": data["total"], "page": data["page"], "page_size": data["page_size"],
            "has_next": data["has_next"],
        })


class ChatReportReviewAPIView(BasePermissionAPIView):
    required_permission = "chat.report.manage"

    def post(self, request, report_id):
        try:
            report = admin_service.review_report(request.user, report_id, request.data.get("note", ""))
        except Exception as e:
            return error_response(str(e), http_status=status.HTTP_400_BAD_REQUEST)
        return success_response(_serialize_report(report), "Da xac minh bao cao.")


class ChatReportResolveAPIView(BasePermissionAPIView):
    required_permission = "chat.report.manage"

    def post(self, request, report_id):
        action = request.data.get("action")
        if not action:
            return error_response("Thieu action xu ly.", http_status=status.HTTP_400_BAD_REQUEST)
        try:
            report = admin_service.resolve_report(request.user, report_id, action, request.data.get("note", ""))
        except Exception as e:
            return error_response(str(e), http_status=status.HTTP_400_BAD_REQUEST)
        return success_response(_serialize_report(report), "Da xu ly bao cao.")


def _serialize_report(r):
    msg = r.message
    return {
        "id": r.id, "reason": r.reason, "status": r.status, "action_taken": r.action_taken,
        "resolution_note": r.resolution_note, "handled_by": r.handled_by_id,
        "resolved_at": r.resolved_at, "created_at": r.created_at,
        "reporter": {"id": r.reporter_id, "name": r.reporter.get_full_name() or r.reporter.email, "email": r.reporter.email},
        "message": {
            "id": msg.id, "content": msg.content, "message_type": msg.message_type,
            "audio_url": msg.audio_url, "sent_at": msg.sent_at,
            "sender": {"id": msg.sender_id, "name": msg.sender.get_full_name() or msg.sender.email, "email": msg.sender.email},
        },
        "course_title": msg.room.course.title if msg.room and msg.room.course else None,
    }