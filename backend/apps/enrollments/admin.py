from django.contrib import admin

from .models import Enrollment


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
	list_display = ('student', 'course', 'status', 'refund_status', 'enrolled_at', 'access_granted_at')
	list_filter = ('status', 'refund_status')
	search_fields = ('student__username', 'course__title')
