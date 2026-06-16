from django.urls import path
from apps.enrollments.views import (
    MyCourseListAPIView,
    EnrollmentDetailAPIView,
    CheckEnrolledAPIView,
    LearningCurriculumAPIView,
)
from apps.payments.views.payment_views import FreeEnrollAPIView

urlpatterns = [
    path("my-courses/", MyCourseListAPIView.as_view(), name="my-courses"),
    path("<int:enrollment_id>/", EnrollmentDetailAPIView.as_view(), name="enrollment-detail"),
    path("check/<int:course_id>/", CheckEnrolledAPIView.as_view(), name="check-enrolled"),
    path("courses/<int:course_id>/enroll-free/", FreeEnrollAPIView.as_view(), name="enroll-free"),
    path("courses/<int:course_id>/curriculum/", LearningCurriculumAPIView.as_view(), name="learning-curriculum"),
]



