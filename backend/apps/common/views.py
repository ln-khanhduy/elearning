from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import connections
from django.db.utils import OperationalError


@api_view(['GET', 'HEAD'])
def health_check(request):
    """
    Health check endpoint cho Render.
    Render dùng endpoint này để kiểm tra service có hoạt động không.
    """
    # Kiểm tra database
    db_ok = True
    try:
        connections['default'].cursor()
    except OperationalError:
        db_ok = False

    return Response({
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "service": "elearning-backend",
    })