from django.urls import path
from apps.lessons.views import (
    CourseChapterListAPIView, ChapterCreateAPIView, ChapterUpdateAPIView,
    ChapterDeleteAPIView, ChapterReorderAPIView,
    ChapterLessonListAPIView, LessonDetailAPIView, LessonCreateAPIView,
    LessonUpdateAPIView, LessonDeleteAPIView, LessonReorderAPIView,
)


urlpatterns = [
    # Chapter
    path("courses/<int:course_id>/chapters/", CourseChapterListAPIView.as_view(), name="course-chapter-list"),
    path("courses/<int:course_id>/chapters/create/", ChapterCreateAPIView.as_view(), name="chapter-create"),
    path("courses/<int:course_id>/chapters/reorder/", ChapterReorderAPIView.as_view(), name="chapter-reorder"),
    path("chapters/<int:chapter_id>/update/", ChapterUpdateAPIView.as_view(), name="chapter-update"),
    path("chapters/<int:chapter_id>/delete/", ChapterDeleteAPIView.as_view(), name="chapter-delete"),

    # Lesson
    path("chapters/<int:chapter_id>/lessons/", ChapterLessonListAPIView.as_view(), name="chapter-lesson-list"),
    path("chapters/<int:chapter_id>/lessons/create/", LessonCreateAPIView.as_view(), name="lesson-create"),
    path("chapters/<int:chapter_id>/lessons/reorder/", LessonReorderAPIView.as_view(), name="lesson-reorder"),
    path("lessons/<int:lesson_id>/", LessonDetailAPIView.as_view(), name="lesson-detail"),
    path("lessons/<int:lesson_id>/update/", LessonUpdateAPIView.as_view(), name="lesson-update"),
    path("lessons/<int:lesson_id>/delete/", LessonDeleteAPIView.as_view(), name="lesson-delete"),
]
