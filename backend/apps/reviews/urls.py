from django.urls import path
from apps.reviews.views import (
    ReviewListAPIView,
    ReviewDetailAPIView,
    ReviewCreateAPIView,
    ReviewUpdateAPIView,
    ReviewDeleteAPIView,
    ReviewUpdateStatusAPIView,
    CourseReviewListAPIView,
    CourseReviewStatsAPIView,
)

urlpatterns = [
    path("", ReviewListAPIView.as_view(), name="review-list"),
    path("create/", ReviewCreateAPIView.as_view(), name="review-create"),
    path("<int:review_id>/", ReviewDetailAPIView.as_view(), name="review-detail"),
    path("<int:review_id>/update/", ReviewUpdateAPIView.as_view(), name="review-update"),
    path("<int:review_id>/delete/", ReviewDeleteAPIView.as_view(), name="review-delete"),
    path("<int:review_id>/update-status/", ReviewUpdateStatusAPIView.as_view(), name="review-update-status"),
    path("courses/<int:course_id>/", CourseReviewListAPIView.as_view(), name="course-review-list"),
    path("courses/<int:course_id>/stats/", CourseReviewStatsAPIView.as_view(), name="course-review-stats"),
]
