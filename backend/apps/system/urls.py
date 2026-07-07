from django.urls import path

from apps.system.views import (
    AdminDashboardView,
    AdminUserListAPIView,
    AdminUserDetailAPIView,
    AdminUserToggleActiveAPIView,
    AdminUserChangeRoleAPIView,
    RoleListAPIView,
    RoleCreateAPIView,
    RoleDetailAPIView,
    RoleUpdateAPIView,
    RoleDeleteAPIView,
    PermissionListAPIView,
    RolePermissionListAPIView,
    RolePermissionUpdateAPIView,
    ActivityLogListAPIView,
    ActivityLogActionTypesAPIView,
    SystemConfigListAPIView,
    SystemConfigUpdateAPIView,
)

urlpatterns = [
    path("dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),

    # Users
    path("users/", AdminUserListAPIView.as_view(), name="admin-user-list"),
    path("users/<uuid:user_id>/", AdminUserDetailAPIView.as_view(), name="admin-user-detail"),
    path("users/<uuid:user_id>/toggle-active/", AdminUserToggleActiveAPIView.as_view(), name="admin-user-toggle-active"),
    path("users/<uuid:user_id>/change-role/", AdminUserChangeRoleAPIView.as_view(), name="admin-user-change-role"),

    # Roles
    path("roles/", RoleListAPIView.as_view(), name="admin-role-list"),
    path("roles/create/", RoleCreateAPIView.as_view(), name="admin-role-create"),
    path("roles/<int:role_id>/", RoleDetailAPIView.as_view(), name="admin-role-detail"),
    path("roles/<int:role_id>/update/", RoleUpdateAPIView.as_view(), name="admin-role-update"),
    path("roles/<int:role_id>/delete/", RoleDeleteAPIView.as_view(), name="admin-role-delete"),

    # Permissions
    path("permissions/", PermissionListAPIView.as_view(), name="admin-permission-list"),
    path("roles/<int:role_id>/permissions/", RolePermissionListAPIView.as_view(), name="admin-role-permission-list"),
    path("roles/<int:role_id>/permissions/update/", RolePermissionUpdateAPIView.as_view(), name="admin-role-permission-update"),

    # Activity Logs
    path("activity-logs/", ActivityLogListAPIView.as_view(), name="admin-activity-logs"),
    path("activity-logs/action-types/", ActivityLogActionTypesAPIView.as_view(), name="admin-activity-log-types"),

    # System Config
    path("configs/", SystemConfigListAPIView.as_view(), name="admin-system-configs"),
    path("configs/update/", SystemConfigUpdateAPIView.as_view(), name="admin-system-configs-update"),
]
