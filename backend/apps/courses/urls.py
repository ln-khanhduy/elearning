from django.urls import path
from apps.courses.views import (
    # Public
    CourseListAPIView, CourseDetailAPIView,
    CourseCurriculumAPIView, CourseCurriculumPreviewAPIView,
    CategoryListAPIView, CategoryCreateAPIView, CategoryUpdateAPIView, CategoryDeleteAPIView,

    # Admin
    AdminCourseListAPIView, AdminCourseCreateAPIView, AdminCourseDetailAPIView,
    AdminCourseUpdateAPIView, AdminCourseDeleteAPIView,
    AdminCoursePublishAPIView, AdminCourseHideAPIView,
    AdminCourseAssignInstructorAPIView, AdminCourseAssignedInstructorAPIView,

    # Instructor
    InstructorCourseListAPIView, InstructorCourseDetailAPIView,
    InstructorCourseStudentsAPIView, InstructorCourseAnalyticsAPIView,
    InstructorCourseEssaySubmissionsAPIView, InstructorCourseGradeEssayAPIView,
    InstructorCourseSendNotificationAPIView, InstructorCourseQAAPIView,
    InstructorCourseQAReplyAPIView, InstructorCourseLearningReportAPIView,
)


urlpatterns = [
    # ==================== PUBLIC ====================
    path("", CourseListAPIView.as_view(), name="course-list"),
    path("<int:course_id>/", CourseDetailAPIView.as_view(), name="course-detail"),
    path("<int:course_id>/curriculum/", CourseCurriculumAPIView.as_view(), name="course-curriculum"),
    path("<int:course_id>/curriculum/preview/", CourseCurriculumPreviewAPIView.as_view(), name="course-curriculum-preview"),

    # ==================== ADMIN ====================
    path("admin/", AdminCourseListAPIView.as_view(), name="admin-course-list"),
    path("admin/create/", AdminCourseCreateAPIView.as_view(), name="admin-course-create"),
    path("admin/<int:course_id>/", AdminCourseDetailAPIView.as_view(), name="admin-course-detail"),
    path("admin/<int:course_id>/update/", AdminCourseUpdateAPIView.as_view(), name="admin-course-update"),
    path("admin/<int:course_id>/delete/", AdminCourseDeleteAPIView.as_view(), name="admin-course-delete"),
    path("admin/<int:course_id>/publish/", AdminCoursePublishAPIView.as_view(), name="admin-course-publish"),
    path("admin/<int:course_id>/hide/", AdminCourseHideAPIView.as_view(), name="admin-course-hide"),
    path("admin/<int:course_id>/assign-instructor/", AdminCourseAssignInstructorAPIView.as_view(), name="admin-course-assign-instructor"),
    path("admin/<int:course_id>/assigned-instructor/", AdminCourseAssignedInstructorAPIView.as_view(), name="admin-course-assigned-instructor"),

    # ==================== INSTRUCTOR ====================
    path("instructor/", InstructorCourseListAPIView.as_view(), name="instructor-course-list"),
    path("instructor/<int:course_id>/", InstructorCourseDetailAPIView.as_view(), name="instructor-course-detail"),
    path("instructor/<int:course_id>/students/", InstructorCourseStudentsAPIView.as_view(), name="instructor-course-students"),
    path("instructor/<int:course_id>/analytics/", InstructorCourseAnalyticsAPIView.as_view(), name="instructor-course-analytics"),
    path("instructor/<int:course_id>/essay-submissions/", InstructorCourseEssaySubmissionsAPIView.as_view(), name="instructor-course-essay-submissions"),
    path("instructor/<int:course_id>/grade-essay/", InstructorCourseGradeEssayAPIView.as_view(), name="instructor-course-grade-essay"),
    path("instructor/<int:course_id>/send-notification/", InstructorCourseSendNotificationAPIView.as_view(), name="instructor-course-send-notification"),
    path("instructor/<int:course_id>/qa/", InstructorCourseQAAPIView.as_view(), name="instructor-course-qa"),
    path("instructor/<int:course_id>/qa/<int:question_id>/reply/", InstructorCourseQAReplyAPIView.as_view(), name="instructor-course-qa-reply"),
    path("instructor/<int:course_id>/learning-report/", InstructorCourseLearningReportAPIView.as_view(), name="instructor-course-learning-report"),

    # ==================== CATEGORY ====================
    path("categories/", CategoryListAPIView.as_view(), name="category-list"),
    path("categories/create/", CategoryCreateAPIView.as_view(), name="category-create"),
    path("categories/<int:category_id>/update/", CategoryUpdateAPIView.as_view(), name="category-update"),
    path("categories/<int:category_id>/delete/", CategoryDeleteAPIView.as_view(), name="category-delete"),
]
