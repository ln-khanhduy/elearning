from django.contrib import admin

from .models import Lesson

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
	list_display = ('title', 'content_type', 'order', 'is_free', 'status')
	list_filter = ('content_type', 'is_free', 'status')
	search_fields = ('title', 'slug', 'course__title')


