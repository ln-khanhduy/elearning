from rest_framework.views import APIView

from apps.common.base_api_view import BasePermissionAPIView
from apps.common.response_helpers import success_response, error_response
from apps.cart.services import cart_service


class CartDetailAPIView(BasePermissionAPIView):
    """GET /api/cart/ - Xem giỏ hàng của user hiện tại."""
    required_permission = "student.cart.view"

    def get(self, request):
        cart_data = cart_service.get_cart(request.user)
        return success_response(cart_data)


class CartAddItemAPIView(BasePermissionAPIView):
    """POST /api/cart/add/{course_id}/ - Thêm khóa học vào giỏ hàng."""
    required_permission = "student.cart.manage"

    def post(self, request, course_id):
        plan_id = request.data.get("plan_id")
        result = cart_service.add_item(request.user, course_id, plan_id=plan_id)
        if not result["success"]:
            return error_response(result["message"])
        return success_response(None, result["message"])


class CartRemoveItemAPIView(BasePermissionAPIView):
    """DELETE /api/cart/remove/{course_id}/ - Xóa khóa học khỏi giỏ hàng."""
    required_permission = "student.cart.manage"

    def delete(self, request, course_id):
        result = cart_service.remove_item(request.user, course_id)
        if not result["success"]:
            return error_response(result["message"])
        return success_response(None, result["message"])


class CartClearAPIView(BasePermissionAPIView):
    """DELETE /api/cart/clear/ - Xóa toàn bộ giỏ hàng."""
    required_permission = "student.cart.manage"

    def delete(self, request):
        result = cart_service.clear(request.user)
        return success_response(None, result["message"])