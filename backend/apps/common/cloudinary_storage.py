import os
import cloudinary
from cloudinary_storage.storage import MediaCloudinaryStorage, RESOURCE_TYPES


class SmartMediaCloudinaryStorage(MediaCloudinaryStorage):
    """
    Storage tự động chọn resource_type dựa trên extension file.
    - Ảnh (jpg, jpeg, png, gif, webp, svg, bmp, ico): dùng resource_type='image'
    - Còn lại (pdf, doc, docx, zip, v.v.): dùng resource_type='raw'
    """

    IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico',}

    def _get_resource_type(self, name):
        ext = os.path.splitext(name)[1].lower()
        if not ext:
            return RESOURCE_TYPES['IMAGE']
        if ext in self.IMAGE_EXTENSIONS:
            return RESOURCE_TYPES['IMAGE']
        # pdf, doc, docx, zip, txt, csv, xlsx, ppt, pptx, v.v. -> raw
        return RESOURCE_TYPES['RAW']

    def url(self, name):
        """
        Override url() để tạo URL Cloudinary với đúng resource_type dựa trên extension file.
        Mặc định MediaCloudinaryStorage không truyền resource_type khi tạo URL,
        dẫn đến lỗi "File format is not supported" khi click vào ảnh xem file PDF (raw).
        """
        resource_type = self._get_resource_type(name)
        # Sử dụng cloudinary.utils.cloudinary_url để tạo URL với đúng resource_type
        url, _ = cloudinary.utils.cloudinary_url(
            name,
            resource_type=resource_type,
            type='upload',
            secure=True
        )
        return url
