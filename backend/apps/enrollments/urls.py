from django.urls import path
from apps.enrollments.views import (
    MyCourseListAPIView,
    EnrollmentDetailAPIView,
    CheckEnrolledAPIView,
)

urlpatterns = [
    path("my-courses/", MyCourseListAPIView.as_view(), name="my-courses"),
    path("<int:enrollment_id>/", EnrollmentDetailAPIView.as_view(), name="enrollment-detail"),
    path("check/<int:course_id>/", CheckEnrolledAPIView.as_view(), name="check-enrolled"),
]
