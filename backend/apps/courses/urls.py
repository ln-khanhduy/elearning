from django.urls import path
from apps.courses.views import (
    CourseListAPIView, CourseDetailAPIView, CourseCreateAPIView,
    CourseUpdateAPIView, CourseDeleteAPIView,
    CourseSubmitReviewAPIView, PendingCourseListAPIView,
    CourseApproveAPIView, CourseRejectAPIView, CoursePublishAPIView,
    CourseHideAPIView, CourseUnhideAPIView, CourseCurriculumAPIView,
    CategoryListAPIView, CategoryCreateAPIView, CategoryUpdateAPIView, CategoryDeleteAPIView,
    TagListAPIView, TagCreateAPIView, TagUpdateAPIView, TagDeleteAPIView,
)


urlpatterns = [
    path("", CourseListAPIView.as_view(), name="course-list"),
    path("create/", CourseCreateAPIView.as_view(), name="course-create"),
    path("pending/", PendingCourseListAPIView.as_view(), name="course-pending"),
    path("<int:course_id>/", CourseDetailAPIView.as_view(), name="course-detail"),
    path("<int:course_id>/update/", CourseUpdateAPIView.as_view(), name="course-update"),
    path("<int:course_id>/delete/", CourseDeleteAPIView.as_view(), name="course-delete"),
    path("<int:course_id>/submit-review/", CourseSubmitReviewAPIView.as_view(), name="course-submit-review"),
    path("<int:course_id>/approve/", CourseApproveAPIView.as_view(), name="course-approve"),
    path("<int:course_id>/reject/", CourseRejectAPIView.as_view(), name="course-reject"),
    path("<int:course_id>/publish/", CoursePublishAPIView.as_view(), name="course-publish"),
    path("<int:course_id>/hide/", CourseHideAPIView.as_view(), name="course-hide"),
    path("<int:course_id>/unhide/", CourseUnhideAPIView.as_view(), name="course-unhide"),
    path("<int:course_id>/curriculum/", CourseCurriculumAPIView.as_view(), name="course-curriculum"),

    # Category
    path("categories/", CategoryListAPIView.as_view(), name="category-list"),
    path("categories/create/", CategoryCreateAPIView.as_view(), name="category-create"),
    path("categories/<int:category_id>/update/", CategoryUpdateAPIView.as_view(), name="category-update"),
    path("categories/<int:category_id>/delete/", CategoryDeleteAPIView.as_view(), name="category-delete"),

    # Tag
    path("tags/", TagListAPIView.as_view(), name="tag-list"),
    path("tags/create/", TagCreateAPIView.as_view(), name="tag-create"),
    path("tags/<int:tag_id>/update/", TagUpdateAPIView.as_view(), name="tag-update"),
    path("tags/<int:tag_id>/delete/", TagDeleteAPIView.as_view(), name="tag-delete"),
]
