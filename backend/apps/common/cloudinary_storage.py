import os
from cloudinary_storage.storage import MediaCloudinaryStorage, RESOURCE_TYPES


class SmartMediaCloudinaryStorage(MediaCloudinaryStorage):
    """
    Storage tự động chọn resource_type dựa trên extension file.
    - Ảnh (jpg, jpeg, png, gif, webp, svg, bmp, ico): dùng resource_type='image'
    - Còn lại (pdf, doc, docx, zip, v.v.): dùng resource_type='raw'
    """

    IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'}

    def _get_resource_type(self, name):
        ext = os.path.splitext(name)[1].lower()
        if ext in self.IMAGE_EXTENSIONS:
            return RESOURCE_TYPES['IMAGE']
        else:
            return RESOURCE_TYPES['RAW']
