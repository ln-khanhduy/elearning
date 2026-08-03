from django.urls import path
from apps.reviews.views import (
    ReviewListAPIView,
    ReviewDetailAPIView,
    ReviewCreateAPIView,
    ReviewUpdateAPIView,
    ReviewDeleteAPIView,
    CourseReviewListAPIView,
    CourseReviewStatsAPIView,
)

urlpatterns = [
    path("", ReviewListAPIView.as_view(), name="review-list"),
    path("create/", ReviewCreateAPIView.as_view(), name="review-create"),
    path("<int:review_id>/", ReviewDetailAPIView.as_view(), name="review-detail"),
    path("<int:review_id>/update/", ReviewUpdateAPIView.as_view(), name="review-update"),
    path("<int:review_id>/delete/", ReviewDeleteAPIView.as_view(), name="review-delete"),
    path("courses/<int:course_id>/", CourseReviewListAPIView.as_view(), name="course-review-list"),
    path("courses/<int:course_id>/stats/", CourseReviewStatsAPIView.as_view(), name="course-review-stats"),
]
