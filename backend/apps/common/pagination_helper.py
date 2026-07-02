"""Hàm h? tr? phân trang chung."""
def paginate_queryset(queryset, request, serializer=None, default_page_size=10):
    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", default_page_size))
    total = queryset.count()
    start = (page - 1) * page_size
    end = start + page_size
    items = queryset[start:end]
    data = serializer(items, many=True).data if serializer else list(items)
    return {"items": data, "total": total, "page": page, "page_size": page_size, "total_pages": (total + page_size - 1) // page_size}
