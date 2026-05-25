from django.contrib import admin

from .models import Question, QuestionOption, Quiz, QuizAttempt, QuizAttemptAnswer, Submission


class QuestionOptionInline(admin.TabularInline):
	model = QuestionOption
	extra = 1


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
	list_display = ('title', 'lesson', 'passing_score', 'created_at')
	search_fields = ('title', 'lesson__title')


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
	list_display = ('quiz', 'question_type', 'order', 'points')
	list_filter = ('question_type',)
	search_fields = ('prompt', 'quiz__title')
	inlines = [QuestionOptionInline]


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
	list_display = ('student', 'quiz', 'status', 'score', 'submitted_at')
	list_filter = ('status',)
	search_fields = ('student__username', 'quiz__title')


@admin.register(QuizAttemptAnswer)
class QuizAttemptAnswerAdmin(admin.ModelAdmin):
	list_display = ('attempt', 'question', 'is_correct', 'score')


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
	list_display = ('student', 'lesson', 'quiz', 'status', 'score', 'submitted_at')
	list_filter = ('status',)
	search_fields = ('student__username', 'lesson__title')
