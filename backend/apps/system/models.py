from django.db import models
from django.conf import settings

class AdminActivityLog(models.Model):
    # ID tự tăng cho mỗi log
    id=models.BigAutoField(primary_key=True)  
    #id admin thực hiện hành động 
    admin = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='activity_logs')
    # Loại hành động 
    action_type = models.CharField(max_length=50)   
    # Loại đối tượng bị tác động  
    target_type = models.CharField(max_length=50)  
    # ID của đối tượng bị tác động     
    target_id = models.CharField(max_length=64)
    # Mô tả chi tiết về hành động         
    detail = models.TextField(null=True, blank=True)    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'admin_activity_log'
        ordering = ['-created_at'] # Ưu tiên hiện log mới nhất lên đầu
        indexes = [
            models.Index(fields=['admin', 'created_at']), # Đổi thành 'admin' theo tên trường mới
            models.Index(fields=['target_type', 'target_id'])
        ]