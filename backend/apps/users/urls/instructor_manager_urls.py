from django.urls import path
from apps.users.view.instructor_manager_views import (
    InstructorManageListAPIView,
    InstructorLockAPIView,
    InstructorUnlockAPIView,
)

urlpatterns = [
    path("manage/", InstructorManageListAPIView.as_view(), name="instructor-manage-list"),
    path("manage/<uuid:user_id>/lock/", InstructorLockAPIView.as_view(), name="instructor-lock"),
    path("manage/<uuid:user_id>/unlock/", InstructorUnlockAPIView.as_view(), name="instructor-unlock"),
]