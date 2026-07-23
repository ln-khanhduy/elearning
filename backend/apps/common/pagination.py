"""
Lớp phân trang tùy chỉnh sử dụng DRF built-in pagination.
Thay thế hàm paginate_queryset tự code trong pagination_helper.py.
"""
from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """
    Phân trang chuẩn với hỗ trợ tham số page_size.
    Cách dùng: ?page=1&page_size=20
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100