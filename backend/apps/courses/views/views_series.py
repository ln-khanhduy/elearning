from rest_framework import status

from apps.common.base_api_view import BasePermissionAPIView
from apps.common.response_helpers import success_response, error_response
from apps.courses.services import series_service
from apps.courses.repositories import course_repository


class CourseSeriesListCreateAPIView(BasePermissionAPIView):
    """GET/POST /api/courses/series/ - Danh sách + tạo series."""
    required_permission = "course.course.manage"

    def get(self, request):
        series = series_service.list_series(request.user)
        data = [_serialize_series(s) for s in series]
        return success_response(data)

    def post(self, request):
        name = (request.data.get("name") or "").strip()
        if not name:
            return error_response("Tên series không được để trống.", http_status=status.HTTP_400_BAD_REQUEST)
        try:
            series = series_service.create_series(request.user, name)
        except Exception as e:
            return error_response(str(e), http_status=status.HTTP_400_BAD_REQUEST)
        return success_response(_serialize_series(series), "Tạo series thành công.", status.HTTP_201_CREATED)


class CourseSeriesDetailAPIView(BasePermissionAPIView):
    """GET /api/courses/series/{series_id}/ - Chi tiết series + các phiên bản khóa."""
    required_permission = "course.course.manage"

    def get(self, request, series_id):
        series = series_service._get_series(series_id)
        return success_response(_serialize_series(series))


class CourseSeriesCreateVersionAPIView(BasePermissionAPIView):
    """POST /api/courses/series/{series_id}/create-version/ - Tạo phiên bản mới (clone khóa)."""
    required_permission = "course.course.manage"

    def post(self, request, series_id):
        course_id = request.data.get("course_id")
        if not course_id:
            return error_response("Thiếu course_id (khóa nguồn để clone).", http_status=status.HTTP_400_BAD_REQUEST)
        try:
            course = course_repository.get_by_id(course_id)
            new_course = series_service.create_version(request.user, series_id, course)
        except Exception as e:
            return error_response(str(e), http_status=status.HTTP_400_BAD_REQUEST)
        return success_response({"course_id": new_course.id, "title": new_course.title}, "Tạo phiên bản mới thành công.", status.HTTP_201_CREATED)


class CourseSeriesPublishAndHideAPIView(BasePermissionAPIView):
    """POST /api/courses/series/publish-and-hide/{course_id}/ - Publish khóa + ẩn khóa cũ cùng series."""
    required_permission = "course.course.manage"

    def post(self, request, course_id):
        try:
            course = series_service.publish_and_hide_old(request.user, course_id)
        except Exception as e:
            return error_response(str(e), http_status=status.HTTP_400_BAD_REQUEST)
        return success_response({"id": course.id, "status": course.status}, "Đã publish khóa và ẩn khóa cũ trong series.")


def _serialize_series(series):
    items = []
    for item in series.items.select_related("course").order_by("order"):
        course = item.course
        items.append({
            "id": item.id,
            "course_id": course.id,
            "course_title": course.title,
            "status": course.status,
            "version": item.version,
            "order": item.order,
        })
    return {
        "id": series.id,
        "name": series.name,
        "slug": series.slug,
        "status": series.status,
        "items": items,
        "created_at": series.created_at,
    }