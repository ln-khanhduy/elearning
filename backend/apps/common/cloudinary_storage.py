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
    """

    IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'}

    def __init__(self):
        self._cloudinary_available = _is_cloudinary_configured()
        if self._cloudinary_available:
            from cloudinary_storage.storage import MediaCloudinaryStorage
            import cloudinary
            self._cloudinary_module = cloudinary
            self._storage = MediaCloudinaryStorage()
        else:
            from django.core.files.storage import FileSystemStorage
            self._cloudinary_module = None
            self._storage = FileSystemStorage(location=settings.MEDIA_ROOT, base_url=settings.MEDIA_URL)

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
                resource_type = self._get_resource_type(name)
                url, _ = self._cloudinary_module.utils.cloudinary_url(
                    name, resource_type=resource_type, type='upload', secure=True
                )
                return url
            except Exception as e:
                logger.warning(f"Cloudinary URL error for {name}: {e}")
                return self._storage.url(name)
        return self._storage.url(name)

    def open(self, name, mode='rb'):
        return self._storage.open(name, mode)

    def save(self, name, content, max_length=None):
        return self._storage.save(name, content, max_length)

    def delete(self, name):
        return self._storage.delete(name)

    def exists(self, name):
        return self._storage.exists(name)

    def listdir(self, path):
        return self._storage.listdir(path)

    def size(self, name):
        return self._storage.size(name)

    def get_accessed_time(self, name):
        return self._storage.get_accessed_time(name)

    def get_created_time(self, name):
        return self._storage.get_created_time(name)

    def get_modified_time(self, name):
        return self._storage.get_modified_time(name)

    def get_available_name(self, name, max_length=None):
        return self._storage.get_available_name(name, max_length)

    def path(self, name):
        return self._storage.path(name)

    def generate_filename(self, filename):
        return self._storage.generate_filename(filename)