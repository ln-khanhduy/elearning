from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import InstructorProfile, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
	list_display = ('username', 'email', 'role', 'is_active', 'account_status', 'is_staff')
	list_filter = ('role', 'is_active', 'account_status', 'is_staff', 'is_superuser')
	fieldsets = BaseUserAdmin.fieldsets + (
		('Business fields', {'fields': ('role', 'avatar', 'phone', 'account_status', 'account_status_changed_at', 'account_status_reason', 'account_status_changed_by')}),
	)
	readonly_fields = ('account_status_changed_at',)


@admin.register(InstructorProfile)
class InstructorProfileAdmin(admin.ModelAdmin):
	list_display = ('user', 'status', 'bank_name', 'reviewed_at')
	list_filter = ('status', 'bank_name')
