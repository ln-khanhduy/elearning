from django.contrib import admin

from .models import Category, Course, Tag


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
	list_display = ('name', 'slug')
	search_fields = ('name', 'slug')


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
	list_display = ('name', 'slug')
	search_fields = ('name', 'slug')


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
	list_display = ('title', 'instructor', 'category', 'status', 'price')
	list_filter = ('status', 'category')
	search_fields = ('title', 'description', 'slug')
	filter_horizontal = ('tags',)
