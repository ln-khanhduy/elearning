import os
import logging
from django.conf import settings
from django.core.files.storage import Storage

logger = logging.getLogger(__name__)


def is_cloudinary_configured():
    try:
        c = getattr(settings, 'CLOUDINARY_STORAGE', {})
        return bool(c.get('CLOUD_NAME') and c.get('API_KEY') and c.get('API_SECRET'))
    except Exception:
        return False


class SmartMediaCloudinaryStorage(Storage):
    """
    Custom storage: chỉ upload lên Cloudinary, KHÔNG lưu local.
    Nếu Cloudinary lỗi, raise exception - không fallback local.

    Lưu ý resource_type:
    - Image files (.jpg, .png, ...): upload và serve với resource_type='image'
      Cloudinary tự động bỏ extension khỏi public_id.
    - Raw files (.pdf, .docx, ...): upload và serve với resource_type='raw'
    - _save() trả về name CÓ extension để DB lưu extension, giúp url()
      xác định đúng resource_type.
    - File cũ (không extension trong DB): url() detect bằng API Cloudinary.
    """

    IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'}
    RAW_EXTENSIONS = {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
                      '.zip', '.rar', '.txt', '.csv', '.mp4', '.avi', '.mov'}

    def __init__(self):
        c = getattr(settings, 'CLOUDINARY_STORAGE', {})
        if not c.get('CLOUD_NAME') or not c.get('API_KEY') or not c.get('API_SECRET'):
            raise RuntimeError(
                "Cloudinary chưa được cấu hình. Vui lòng kiểm tra CLOUDINARY_CLOUD_NAME, "
                "CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET trong .env"
            )
        import cloudinary
        cloudinary.config(
            cloud_name=c['CLOUD_NAME'],
            api_key=c['API_KEY'],
            api_secret=c['API_SECRET'],
            secure=True,
        )
        import cloudinary.uploader
        import cloudinary.api
        self._cloudinary = cloudinary
        self._cloudinary_uploader = cloudinary.uploader
        self._cloudinary_api = cloudinary.api
        # Cache detect resource_type cho file cũ (không extension)
        # {clean_name: 'image'|'raw'}
        self._type_cache = {}

    def _open(self, name, mode='rb'):
        raise NotImplementedError("Không hỗ trợ đọc file trực tiếp từ storage.")

    def _save(self, name, content):
        # Normalize Windows backslash -> forward slash (Cloudinary yêu cầu)
        public_id_with_ext = name.replace('\\', '/')
        if hasattr(content, 'seek'):
            content.seek(0)

        ext = os.path.splitext(public_id_with_ext)[1].lower()
        resource_type = 'raw'
        if ext in self.IMAGE_EXTENSIONS:
            resource_type = 'image'

        # Strip extension - Cloudinary public_id không lưu extension
        root, _ = os.path.splitext(public_id_with_ext)
        public_id = root

        result = self._cloudinary_uploader.upload(
            content,
            public_id=public_id,
            resource_type=resource_type,
            type='upload',
            overwrite=True,
            timeout=30,
        )
        uploaded_public_id = result.get('public_id', public_id)
        uploaded_root, _ = os.path.splitext(uploaded_public_id)

        # Trả về name có extension để DB lưu extension,
        # giúp url() sau này xác định đúng resource_type.
        if ext:
            return uploaded_root + ext
        return uploaded_root

    def _detect_resource_type(self, clean_name):
        """Detect resource_type cho file không có extension (file cũ) bằng API Cloudinary.
        Kết quả được cache để tránh gọi API nhiều lần."""
        if clean_name in self._type_cache:
            return self._type_cache[clean_name]

        # Thử image trước (phổ biến nhất: thumbnails, avatars, certificates)
        try:
            self._cloudinary_api.resource(
                clean_name,
                resource_type='image',
                type='upload',
            )
            self._type_cache[clean_name] = 'image'
            return 'image'
        except Exception:
            pass

        # Fallback sang raw
        try:
            self._cloudinary_api.resource(
                clean_name,
                resource_type='raw',
                type='upload',
            )
            self._type_cache[clean_name] = 'raw'
            return 'raw'
        except Exception:
            # Không tìm thấy resource nào → mặc định image
            self._type_cache[clean_name] = 'image'
            return 'image'

    def url(self, name):
        if not name:
            return None
        try:
            ext = os.path.splitext(name.replace('\\', '/'))[1].lower()
            clean_name, _ = os.path.splitext(name.replace('\\', '/'))

            if ext in self.IMAGE_EXTENSIONS:
                resource_type = 'image'
            elif ext in self.RAW_EXTENSIONS:
                resource_type = 'raw'
            else:
                # File cũ không có extension → detect bằng API
                resource_type = self._detect_resource_type(clean_name)

            # Với image: cloudinary_url() thêm extension tự động → dùng clean_name (không ext)
            # Với raw: cloudinary_url() không thêm extension → dùng name gốc để có ext
            if resource_type == 'raw' and ext in self.RAW_EXTENSIONS:
                url_name = name.replace('\\', '/')
            else:
                url_name = clean_name

            url_result, _ = self._cloudinary.utils.cloudinary_url(
                url_name,
                resource_type=resource_type,
                type='upload',
                secure=True,
            )

            # Raw URL không có extension → append để browser nhận dạng
            if resource_type == 'raw' and ext in self.RAW_EXTENSIONS:
                url_result = url_result.rstrip('/') + ext

            return url_result
        except Exception:
            logger.exception(f"Cloudinary URL error for {name}")
            raise

    def _get_resource_type(self, name):
        """Xác định resource_type dựa trên extension thật sự của file."""
        ext = os.path.splitext(name)[1].lower()
        if not ext:
            return 'image'
        if ext in self.IMAGE_EXTENSIONS:
            return 'image'
        if ext in self.RAW_EXTENSIONS:
            return 'raw'
        return 'image'

    def delete(self, name):
        if not name:
            return
        try:
            resource_type = self._get_resource_type(name)
            root, ext = os.path.splitext(name.replace('\\', '/'))
            if ext.lower() in self.IMAGE_EXTENSIONS:
                clean_name = root
            elif ext.lower() in self.RAW_EXTENSIONS:
                clean_name = name.replace('\\', '/')
            else:
                clean_name = name.replace('\\', '/')
            self._cloudinary_uploader.destroy(
                clean_name,
                resource_type=resource_type,
            )
        except Exception:
            logger.exception(f"Cloudinary delete failed for {name}")
            raise

    def exists(self, name):
        if not name:
            return False
        try:
            resource_type = self._get_resource_type(name)
            root, ext = os.path.splitext(name.replace('\\', '/'))
            if ext.lower() in self.IMAGE_EXTENSIONS:
                clean_name = root
            elif ext.lower() in self.RAW_EXTENSIONS:
                clean_name = name.replace('\\', '/')
            else:
                clean_name = name.replace('\\', '/')
            result = self._cloudinary_api.resource(
                clean_name,
                resource_type=resource_type,
            )
            return result is not None
        except Exception:
            return False

    def listdir(self, path):
        raise NotImplementedError("Không hỗ trợ listdir trên Cloudinary storage.")

    def size(self, name):
        raise NotImplementedError("Không hỗ trợ size trên Cloudinary storage.")

    def get_available_name(self, name, max_length=None):
        return name

    def path(self, name):
        raise NotImplementedError("Không hỗ trợ path trên Cloudinary storage.")