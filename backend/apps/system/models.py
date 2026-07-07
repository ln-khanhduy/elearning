from django.db import models
from django.conf import settings


class AdminActivityLog(models.Model):
    id = models.BigAutoField(primary_key=True)
    admin = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='activity_logs')
    action_type = models.CharField(max_length=50)
    target_type = models.CharField(max_length=50, null=True, blank=True)
    target_id = models.CharField(max_length=64, null=True, blank=True)
    detail = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'admin_activity_log'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['admin', 'created_at']),
            models.Index(fields=['target_type', 'target_id']),
        ]


class SystemConfig(models.Model):
    """Cấu hình hệ thống - lưu key-value cho các thiết lập."""
    id = models.BigAutoField(primary_key=True)
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.CharField(max_length=255, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = 'system_config'
