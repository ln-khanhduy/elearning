"""Voice Message - Cloudinary signed upload."""
import time

from cloudinary import utils
from django.conf import settings


def get_voice_upload_signature():
    """Tao Cloudinary signed upload params cho file voice (folder: voice/).

    Dùng `utils.api_sign_request(params_to_sign, api_secret)` tương thích
    với Cloudinary SDK >= 1.44 (hàm `sign_request` cũ đổi chữ ký cần options).
    """
    cfg = settings.CLOUDINARY_STORAGE
    if not cfg.get("CLOUD_NAME") or not cfg.get("API_KEY") or not cfg.get("API_SECRET"):
        raise ValueError("Cloudinary chua duoc cau hinh.")

    timestamp = int(time.time())
    # Cloudinary KHÔNG đưa `resource_type` vào chuỗi ký cho upload (xác định bởi endpoint).
    # Chỉ ký các tham số thực tế: folder + timestamp.
    params_to_sign = {
        "folder": "voice",
        "timestamp": timestamp,
    }

    signature = utils.api_sign_request(params_to_sign, cfg["API_SECRET"])

    return {
        "cloud_name": cfg["CLOUD_NAME"],
        "api_key": cfg["API_KEY"],
        "folder": "voice",
        "resource_type": "raw",
        "timestamp": timestamp,
        "signature": signature,
    }
