from rest_framework import status

from apps.common.base_api_view import BasePermissionAPIView
from apps.common.response_helpers import success_response, error_response
from apps.courses.repositories import wishlist_repository
from apps.courses.repositories import course_repository


class WishlistListAPIView(BasePermissionAPIView):
    """GET /api/courses/wishlist/ - Danh sách khóa học yêu thích của học viên."""
    required_permission = "student.wishlist.view"

    def get(self, request):
        items = wishlist_repository.get_user_wishlist(request.user)
        wishlist_data = []
        for item in items:
            course = item.course
            if not course:
                continue
            # (R2) Course.price đã bỏ — hiển thị các gói kích hoạt + giá từ (min price)
            plans = course.access_plans.all().order_by("duration_days")
            plan_list = [
                {
                    "id": p.id,
                    "name": p.name,
                    "duration_days": p.duration_days,
                    "price": float(p.price),
                }
                for p in plans
            ]
            min_price = min((p["price"] for p in plan_list), default=None)
            wishlist_data.append({
                "id": item.id,
                "course_id": course.id,
                "course_title": course.title,
                "course_slug": course.slug,
                "thumbnail_url": course.thumbnail.url if course.thumbnail else None,
                "access_plans": plan_list,
                "min_price": min_price,
                "instructor_name": course.assigned_instructor.get_full_name() if course.assigned_instructor else None,
                "created_at": item.created_at,
            })
        return success_response({
            "items": wishlist_data,
            "count": len(wishlist_data),
        })


class WishlistAddAPIView(BasePermissionAPIView):
    """POST /api/courses/wishlist/{course_id}/add/ - Thêm khóa học vào danh sách yêu thích."""
    required_permission = "student.wishlist.manage"

    def post(self, request, course_id):
        try:
            course = course_repository.get_by_id(course_id)
        except Exception:
            return error_response("Không tìm thấy khóa học.", http_status=status.HTTP_404_NOT_FOUND)

        item, created = wishlist_repository.add_to_wishlist(request.user, course)
        if created:
            return success_response({"id": item.id}, "Đã thêm vào danh sách yêu thích.", status.HTTP_201_CREATED)
        return success_response({"id": item.id}, "Khóa học đã có trong danh sách yêu thích.")


class WishlistRemoveAPIView(BasePermissionAPIView):
    """DELETE /api/courses/wishlist/{course_id}/remove/ - Xóa khóa học khỏi danh sách yêu thích."""
    required_permission = "student.wishlist.manage"

    def delete(self, request, course_id):
        removed = wishlist_repository.remove_from_wishlist(request.user, course_id)
        if removed:
            return success_response(None, "Đã xóa khỏi danh sách yêu thích.")
        return error_response("Khóa học không có trong danh sách yêu thích.", http_status=status.HTTP_404_NOT_FOUND)


class WishlistCheckAPIView(BasePermissionAPIView):
    """GET /api/courses/wishlist/{course_id}/check/ - Kiểm tra khóa học đã yêu thích chưa."""
    required_permission = "student.wishlist.view"

    def get(self, request, course_id):
        is_wishlisted = wishlist_repository.is_wishlisted(request.user, course_id)
        return success_response({"is_wishlisted": is_wishlisted})


class WishlistCountAPIView(BasePermissionAPIView):
    """GET /api/courses/wishlist/count/ - Đếm số lượng khóa học yêu thích."""
    required_permission = "student.wishlist.view"

    def get(self, request):
        count = wishlist_repository.count_user_wishlist(request.user)
        return success_response({"count": count})