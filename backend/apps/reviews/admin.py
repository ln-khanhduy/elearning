from django.contrib import admin

from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
	list_display = ('user', 'course', 'enrollment', 'lesson', 'rating', 'status',  'created_at')
	list_filter = ('status', 'rating')
	search_fields = ('user__username', 'course__title', 'content', 'enrollment__id')
	ordering = ('-created_at',)
