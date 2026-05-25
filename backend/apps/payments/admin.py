from django.contrib import admin

from .models import PaymentTransaction


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
	list_display = ('student', 'course', 'gross_amount', 'net_amount', 'status', 'provider', 'created_at')
	list_filter = ('status', 'provider')
	search_fields = ('provider_transaction_id', 'student__username', 'course__title')
