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

    def _open(self, name, mode='rb'):
        raise NotImplementedError("Không hỗ trợ đọc file trực tiếp từ storage.")

    def _save(self, name, content):
        # Normalize Windows backslash -> forward slash (Cloudinary yêu cầu)
        public_id_with_ext = name.replace('\\', '/')
        # Reset stream
        if hasattr(content, 'seek'):
            content.seek(0)

        ext = os.path.splitext(public_id_with_ext)[1].lower()
        resource_type = 'raw'
        if ext in self.IMAGE_EXTENSIONS:
            resource_type = 'image'

        # QUAN TRỌNG: Cloudinary tự động bỏ đuôi file khỏi public_id cho images.
        # Đối với image: strip extension để đồng bộ với Cloudinary.
        # Đối với raw (PDF, DOC, ...): GIỮ extension để _get_resource_type()
        # có thể xác định đúng resource_type khi gọi url().
        if resource_type == 'image':
            root, _ = os.path.splitext(public_id_with_ext)
            public_id = root
        else:
            public_id = public_id_with_ext

        result = self._cloudinary_uploader.upload(
            content,
            public_id=public_id,
            resource_type=resource_type,
            type='upload',
            overwrite=True,
            timeout=30,
        )
        # Với image: strip extension khỏi public_id để đồng bộ
        # Với raw: giữ nguyên public_id (có extension) để url() hoạt động
        uploaded_public_id = result.get('public_id', public_id)
        if resource_type == 'image':
            uploaded_root, _ = os.path.splitext(uploaded_public_id)
            return uploaded_root
        return uploaded_public_id

    def url(self, name):
        if not name:
            return None
        try:
            # Xác định resource_type dựa trên tên gốc hoặc extension
            resource_type = self._get_resource_type(name)

            # Với image: Cloudinary tự động thêm extension, strip để đồng bộ
            # Với raw: Cloudinary yêu cầu public_id phải có extension trong URL
            root, ext = os.path.splitext(name.replace('\\', '/'))
            if resource_type == 'raw' and ext.lower() in self.RAW_EXTENSIONS:
                # Raw files: giữ extension vì _save lưu public_id có extension
                clean_name = name.replace('\\', '/')
            elif ext.lower() in self.IMAGE_EXTENSIONS:
                # Image files: strip extension vì _save đã strip
                clean_name = root
            else:
                clean_name = name.replace('\\', '/')

            url_result, _ = self._cloudinary.utils.cloudinary_url(
                clean_name,
                resource_type=resource_type,
                type='upload',
                secure=True,
            )
            return url_result
        except Exception:
            logger.exception(f"Cloudinary URL error for {name}")
            raise

    def _get_resource_type(self, name):
        """Xác định resource_type dựa trên extension thật sự của file.
        
        Chỉ coi phần đuôi là extension nếu nó nằm trong danh sách IMAGE_EXTENSIONS
        hoặc RAW_EXTENSIONS. Nếu không (VD: C_.Net có extension giả .Net),
        hoặc không có extension, mặc định là 'image'.
        """
        ext = os.path.splitext(name)[1].lower()
        if not ext:
            return 'image'
        if ext in self.IMAGE_EXTENSIONS:
            return 'image'
        if ext in self.RAW_EXTENSIONS:
            return 'raw'
        # Nếu extension không nằm trong danh sách nào, coi như không có extension
        # và mặc định là image (vì đây thường là public_id đã strip extension 
        # nhưng vẫn còn dấu chấm trong tên file như C_.Net)
        return 'image'

    def delete(self, name):
        if not name:
            return
        try:
            resource_type = self._get_resource_type(name)
            # Với image: strip extension để đồng bộ với _save
            # Với raw: GIỮ extension vì _save lưu public_id có extension
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
        """
        Kiểm tra file có tồn tại trên Cloudinary không.
        """
        if not name:
            return False
        try:
            resource_type = self._get_resource_type(name)
            # Với image: strip extension để đồng bộ với _save
            # Với raw: GIỮ extension vì _save lưu public_id có extension
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
        """
        Cloudinary cho phép overwrite, nên luôn trả về tên gốc.
        """
        return name

    def path(self, name):
        raise NotImplementedError("Không hỗ trợ path trên Cloudinary storage.")