import os
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def _is_cloudinary_configured():
    """Kiểm tra Cloudinary config một cách lazy."""
    try:
        c = getattr(settings, 'CLOUDINARY_STORAGE', {})
        return bool(c.get('CLOUD_NAME') and c.get('API_KEY') and c.get('API_SECRET'))
    except Exception:
        return False


class SmartMediaCloudinaryStorage:
    """
    Storage thông minh: dùng Cloudinary nếu có config, fallback về local storage.
    Tự động chọn resource_type dựa trên extension file khi upload và lấy URL.
    """

    IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'}
    RAW_EXTENSIONS = {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
                      '.zip', '.rar', '.txt', '.csv', '.mp4', '.avi', '.mov'}

    def __init__(self):
        from django.core.files.storage import FileSystemStorage
        self._local_storage = FileSystemStorage(location=settings.MEDIA_ROOT, base_url=settings.MEDIA_URL)
        self._cloudinary_available = _is_cloudinary_configured()
        if self._cloudinary_available:
            from cloudinary_storage.storage import MediaCloudinaryStorage
            import cloudinary
            self._cloudinary_module = cloudinary
            self._storage = MediaCloudinaryStorage()
        else:
            self._cloudinary_module = None
            self._storage = self._local_storage

    def _get_resource_type(self, name):
        ext = os.path.splitext(name)[1].lower()
        if not ext:
            return 'image'
        if ext in self.IMAGE_EXTENSIONS:
            return 'image'
        return 'raw'

    def url(self, name):
        if not name:
            return None
        if self._cloudinary_available and self._cloudinary_module:
            try:
                # Nếu file tồn tại ở local (fallback từ Cloudinary upload lỗi), serve local
                if self._local_storage.exists(name):
                    return self._local_storage.url(name)

                # Kiểm tra resource có thực sự tồn tại trên Cloudinary không
                if not self._exists(name):
                    logger.warning(f"Cloudinary resource not found: {name}, returning None")
                    return None

                resource_type = self._get_resource_type(name)
                url, _ = self._cloudinary_module.utils.cloudinary_url(
                    name, resource_type=resource_type, type='upload', secure=True
                )
                return url
            except Exception as e:
                logger.warning(f"Cloudinary URL error for {name}: {e}")
                if self._local_storage.exists(name):
                    return self._local_storage.url(name)
                return None
        return self._storage.url(name)

    def open(self, name, mode='rb'):
        if self._cloudinary_available and self._local_storage.exists(name):
            return self._local_storage.open(name, mode)
        return self._storage.open(name, mode)

    def save(self, name, content, max_length=None):
        if self._cloudinary_available:
            resource_type = self._get_resource_type(name)
            try:
                import cloudinary.uploader
                result = cloudinary.uploader.upload(
                    content,
                    public_id=name,
                    resource_type=resource_type,
                    type='upload',
                    overwrite=True,
                )
                return result.get('public_id', name)
            except Exception as e:
                logger.warning(f"Cloudinary upload error for {name}: {e}")
                return self._local_storage.save(name, content, max_length)
        return self._local_storage.save(name, content, max_length)

    def delete(self, name):
        if self._cloudinary_available:
            resource_type = self._get_resource_type(name)
            try:
                import cloudinary.uploader
                cloudinary.uploader.destroy(name, resource_type=resource_type)
            except Exception as e:
                logger.warning(f"Cloudinary delete error for {name}: {e}")
        return self._local_storage.delete(name)

    def exists(self, name):
        # Nếu file tồn tại local → chắc chắn tồn tại
        if self._local_storage.exists(name):
            return True
        # Nếu Cloudinary available, kiểm tra qua API
        if self._cloudinary_available and self._cloudinary_module:
            try:
                resource_type = self._get_resource_type(name)
                self._cloudinary_module.api.resource(name, resource_type=resource_type)
                return True
            except Exception:
                return False
        return self._storage.exists(name)

    def listdir(self, path):
        return self._local_storage.listdir(path)

    def size(self, name):
        if self._cloudinary_available and self._local_storage.exists(name):
            return self._local_storage.size(name)
        return self._storage.size(name)

    def get_accessed_time(self, name):
        return self._local_storage.get_accessed_time(name)

    def get_created_time(self, name):
        return self._local_storage.get_created_time(name)

    def get_modified_time(self, name):
        return self._local_storage.get_modified_time(name)

    def get_available_name(self, name, max_length=None):
        return self._local_storage.get_available_name(name, max_length)

    def path(self, name):
        return self._local_storage.path(name)

    def generate_filename(self, filename):
        return self._local_storage.generate_filename(filename)