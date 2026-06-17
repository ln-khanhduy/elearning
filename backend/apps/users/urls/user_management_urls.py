from django.urls import path

from apps.users.view.user_management_views import (
    UserManageListAPIView,
    UserManageToggleActiveAPIView,
)

urlpatterns = [
    path("users/", UserManageListAPIView.as_view(), name="user-management-list"),
    path("users/<uuid:user_id>/toggle-active/", UserManageToggleActiveAPIView.as_view(), name="user-management-toggle-active"),
]
