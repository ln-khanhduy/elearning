from django.urls import path

from apps.users.view.user_views import (
    UserListAPIView,
    UserDetailAPIView,
    CurrentUserAPIView,
    UpdateProfileAPIView,
    ChangeUserRoleAPIView,
    LockUserAPIView,
    UnlockUserAPIView,
    ChangePasswordAPIView,
    InstructorApplyAPIView,
    InstructorApplicationListAPIView,
    InstructorApplicationDetailAPIView,
    InstructorApplicationReviewAPIView,
)
urlpatterns = [
    path("", UserListAPIView.as_view(), name="user-list"),
    path("<uuid:user_id>/", UserDetailAPIView.as_view(), name="user-detail"),

    path("me/", CurrentUserAPIView.as_view(), name="current-user"),
    path("me/update/", UpdateProfileAPIView.as_view(), name="update-profile"),
    path("me/change-password/", ChangePasswordAPIView.as_view(), name="change-password"),

    path("<uuid:user_id>/change-role/", ChangeUserRoleAPIView.as_view(), name="change-user-role"),
    path("<uuid:user_id>/lock/", LockUserAPIView.as_view(), name="lock-user"),
    path("<uuid:user_id>/unlock/", UnlockUserAPIView.as_view(), name="unlock-user"),

    path("instructors/apply/", InstructorApplyAPIView.as_view(), name="instructor-apply"),
    path("instructors/applications/",InstructorApplicationListAPIView.as_view(),name="instructor-application-list"),
    path("instructors/applications/<int:application_id>/",InstructorApplicationDetailAPIView.as_view(),name="instructor-application-detail"),
    path("instructors/applications/<int:application_id>/review/",InstructorApplicationReviewAPIView.as_view(),name="instructor-application-review"),
]
