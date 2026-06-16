from django.urls import path
from apps.enrollments.views.learning_views import (
    LearningCurriculumAPIView,
    MarkLessonCompleteAPIView,
    SubmitQuizAPIView,
)

urlpatterns = [
    path("courses/<int:course_id>/curriculum/", LearningCurriculumAPIView.as_view(), name="learning-curriculum"),
    path("courses/<int:course_id>/lessons/complete/", MarkLessonCompleteAPIView.as_view(), name="mark-lesson-complete"),
    path("courses/<int:course_id>/quizzes/submit/", SubmitQuizAPIView.as_view(), name="submit-quiz"),
]
