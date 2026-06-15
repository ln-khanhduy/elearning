from django.urls import path
from apps.quizzes.views import (
    LessonQuizListAPIView, QuizDetailAPIView, QuizCreateAPIView,
    QuizUpdateAPIView, QuizDeleteAPIView,
    QuizQuestionListAPIView, QuestionCreateAPIView,
    QuestionUpdateAPIView, QuestionDeleteAPIView,
)


urlpatterns = [
    # Quiz
    path("lessons/<int:lesson_id>/quizzes/", LessonQuizListAPIView.as_view(), name="lesson-quiz-list"),
    path("lessons/<int:lesson_id>/quizzes/create/", QuizCreateAPIView.as_view(), name="quiz-create"),
    path("quizzes/<int:quiz_id>/", QuizDetailAPIView.as_view(), name="quiz-detail"),
    path("quizzes/<int:quiz_id>/update/", QuizUpdateAPIView.as_view(), name="quiz-update"),
    path("quizzes/<int:quiz_id>/delete/", QuizDeleteAPIView.as_view(), name="quiz-delete"),

    # Question
    path("quizzes/<int:quiz_id>/questions/", QuizQuestionListAPIView.as_view(), name="quiz-question-list"),
    path("quizzes/<int:quiz_id>/questions/create/", QuestionCreateAPIView.as_view(), name="question-create"),
    path("questions/<int:question_id>/update/", QuestionUpdateAPIView.as_view(), name="question-update"),
    path("questions/<int:question_id>/delete/", QuestionDeleteAPIView.as_view(), name="question-delete"),
]
