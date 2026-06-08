from django.urls import path
from apps.lessons.views import CourseSectionListAPIView, SectionCreateAPIView, SectionUpdateAPIView, SectionDeleteAPIView, SectionReorderAPIView

urlpatterns = [
    path("courses/<int:course_id>/sections/", CourseSectionListAPIView.as_view()),
    path("courses/<int:course_id>/sections/create/", SectionCreateAPIView.as_view()),
    path("courses/<int:course_id>/sections/reorder/", SectionReorderAPIView.as_view()),
    path("sections/<int:section_id>/update/", SectionUpdateAPIView.as_view()),
    path("sections/<int:section_id>/delete/", SectionDeleteAPIView.as_view()),
]