import os
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

# Kiểm tra Cloudinary config
_cloudinary_available = all([
    getattr(settings, 'CLOUDINARY_STORAGE', {}).get('CLOUD_NAME'),
    getattr(settings, 'CLOUDINARY_STORAGE', {}).get('API_KEY'),
    getattr(settings, 'CLOUDINARY_STORAGE', {}).get('API_SECRET'),
])

if _cloudinary_available:
    import cloudinary
    from cloudinary_storage.storage import MediaCloudinaryStorage, RESOURCE_TYPES
else:
    from django.core.files.storage import FileSystemStorage
    cloudinary = None
    RESOURCE_TYPES = {'IMAGE': 'image', 'RAW': 'raw'}


class SmartMediaCloudinaryStorage:
    """
    Storage thông minh: dùng Cloudinary nếu có config, fallback về local storage.
    Tự động chọn resource_type dựa trên extension file.
    """

    IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'}

    def __init__(self):
        if _cloudinary_available:
            self._storage = MediaCloudinaryStorage()
        else:
            self._storage = FileSystemStorage(location=settings.MEDIA_ROOT, base_url=settings.MEDIA_URL)

    def _get_resource_type(self, name):
        ext = os.path.splitext(name)[1].lower()
        if not ext:
            return RESOURCE_TYPES.get('IMAGE', 'image')
        if ext in self.IMAGE_EXTENSIONS:
            return RESOURCE_TYPES.get('IMAGE', 'image')
        return RESOURCE_TYPES.get('RAW', 'raw')

    def url(self, name):
        if not name:
            return None
        if _cloudinary_available and cloudinary:
            try:
                resource_type = self._get_resource_type(name)
                url, _ = cloudinary.utils.cloudinary_url(
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
