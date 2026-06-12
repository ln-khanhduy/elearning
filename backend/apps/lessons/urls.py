from django.urls import path
from apps.lessons.views import (CourseSectionListAPIView, SectionCreateAPIView, SectionUpdateAPIView, SectionDeleteAPIView, SectionReorderAPIView,
                                SectionLessonListAPIView, LessonDetailAPIView, LessonCreateAPIView, LessonUpdateAPIView, LessonDeleteAPIView, LessonReorderAPIView)


urlpatterns = [
    path("courses/<int:course_id>/sections/", CourseSectionListAPIView.as_view()),
    path("courses/<int:course_id>/sections/create/", SectionCreateAPIView.as_view()),
    path("courses/<int:course_id>/sections/reorder/", SectionReorderAPIView.as_view()),
    path("sections/<int:section_id>/update/", SectionUpdateAPIView.as_view()),
    path("sections/<int:section_id>/delete/", SectionDeleteAPIView.as_view()),

    path("sections/<int:section_id>/lessons/", SectionLessonListAPIView.as_view()),
    path("sections/<int:section_id>/lessons/create/", LessonCreateAPIView.as_view()),
    path("sections/<int:section_id>/lessons/reorder/", LessonReorderAPIView.as_view()),
    path("lessons/<int:lesson_id>/", LessonDetailAPIView.as_view()),
    path("lessons/<int:lesson_id>/update/", LessonUpdateAPIView.as_view()),
    path("lessons/<int:lesson_id>/delete/", LessonDeleteAPIView.as_view()),
]
