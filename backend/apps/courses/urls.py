from django.urls import path
from apps.courses.views import (CourseListAPIView, CourseDetailAPIView, CourseCreateAPIView, CourseUpdateAPIView, CourseDeleteAPIView, 
                                CourseSubmitReviewAPIView, PendingCourseListAPIView,CourseApproveAPIView,CourseRejectAPIView,CoursePublishAPIView,)


urlpatterns = [
    path("", CourseListAPIView.as_view(), name="course-list"),
    path("create/", CourseCreateAPIView.as_view(), name="course-create"),
    path("<int:course_id>/", CourseDetailAPIView.as_view(), name="course-detail"),
    path("<int:course_id>/update/", CourseUpdateAPIView.as_view(), name="course-update"),
    path("<int:course_id>/delete/", CourseDeleteAPIView.as_view(), name="course-delete"),
    path("<int:course_id>/submit-review/", CourseSubmitReviewAPIView.as_view(), name="course-submit-review"),
    path("pending/", PendingCourseListAPIView.as_view(), name="course-pending"),
    path("<int:course_id>/approve/", CourseApproveAPIView.as_view(), name="course-approve"),
    path("<int:course_id>/reject/", CourseRejectAPIView.as_view(), name="course-reject"),
    path("<int:course_id>/publish/", CoursePublishAPIView.as_view(), name="course-publish"),
]