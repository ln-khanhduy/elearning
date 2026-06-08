from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.common.permissions import HasRequiredPermission


class BasePermissionAPIView(APIView):
    permission_classes = [IsAuthenticated,HasRequiredPermission]