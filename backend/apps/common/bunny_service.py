import hashlib
import time
from urllib.parse import urlparse

import requests
from django.conf import settings

BUNNY_API_BASE = "https://video.bunnycdn.com"
TUS_UPLOAD_URL = "https://video.bunnycdn.com/tusupload"
BUNNY_EMBED_BASE = "https://iframe.mediadelivery.net/embed"


def _config():
    c = getattr(settings, "BUNNY_CONFIG", {})
    if not c.get("LIBRARY_ID") or not c.get("API_KEY"):
        raise RuntimeError("Bunny Stream chưa được cấu hình.")
    return c


def _headers():
    return {"AccessKey": _config()["API_KEY"], "Content-Type": "application/json"}


def extract_bunny_video_id(video_url):
    """
    Trích xuất Bunny Video ID từ URL.

    Hỗ trợ cả URL có/không token:
      https://iframe.mediadelivery.net/embed/{LIBRARY_ID}/{VIDEO_ID}
      https://iframe.mediadelivery.net/play/{LIBRARY_ID}/{VIDEO_ID}

    Trả về VIDEO_ID (vd: bee22255-3aff-406d-99a4-0988d635ecf2) hoặc None.
    Không bao giờ trả token làm video ID.
    """
    if not video_url:
        return None
    try:
        parsed = urlparse(str(video_url).strip())
    except (ValueError, AttributeError):
        return None
    if "mediadelivery.net" not in parsed.netloc:
        return None
    parts = [p for p in parsed.path.split("/") if p]
    # Path dạng: /embed/{LIBRARY_ID}/{VIDEO_ID} hoặc /play/{LIBRARY_ID}/{VIDEO_ID}
    if len(parts) < 3:
        return None
    return parts[-1] or None


def extract_bunny_library_id(video_url):
    """
    Trích xuất Bunny Library ID từ URL.

        https://iframe.mediadelivery.net/embed/{LIBRARY_ID}/{VIDEO_ID}?token=...

    Trả về LIBRARY_ID (vd: 721512) hoặc None.
    """
    if not video_url:
        return None
    try:
        parsed = urlparse(str(video_url).strip())
    except (ValueError, AttributeError):
        return None
    if "mediadelivery.net" not in parsed.netloc:
        return None
    parts = [p for p in parsed.path.split("/") if p]
    if len(parts) < 3:
        return None
    return parts[1] or None


def normalize_bunny_video_url(video_url):
    """
    Chuẩn hóa URL Bunny về dạng embed KHÔNG token:

        https://iframe.mediadelivery.net/embed/{LIBRARY_ID}/{VIDEO_ID}

    - Giữ NGUYÊN Library ID và Video ID từ URL gốc.
    - Xóa toàn bộ query parameters (token, expires, ...).
    - Không phụ thuộc settings (an toàn khi chạy migration/normalize).
    - URL không hợp lệ / không phải Bunny → trả về nguyên bản.
    """
    video_id = extract_bunny_video_id(video_url)
    library_id = extract_bunny_library_id(video_url)
    if not video_id or not library_id:
        return video_url
    return f"{BUNNY_EMBED_BASE}/{library_id}/{video_id}"


def generate_bunny_embed_url(video_url, expires_in=3600):
    """
    Tạo signed embed URL cho Bunny Stream (runtime, sau khi đã kiểm tra quyền).

    Công thức chính thức Bunny Stream — Embed View Token Authentication:

        token = SHA256(BUNNY_TOKEN_KEY + VIDEO_ID + EXPIRES)
        EXPIRES = Unix timestamp (giây) trong tương lai

    - Giữ NGUYÊN Library ID và Video ID từ URL gốc.
    - Chỉ cần BUNNY_TOKEN_KEY (không cần BUNNY_API_KEY để sign embed).
    - Nếu chưa cấu hình BUNNY_TOKEN_KEY → trả URL không token (không ký được).

    Trả về:
        https://iframe.mediadelivery.net/embed/{LIBRARY_ID}/{VIDEO_ID}?token=...&expires=...
    """
    if not video_url:
        return None

    video_id = extract_bunny_video_id(video_url)
    library_id = extract_bunny_library_id(video_url)
    if not video_id or not library_id:
        return video_url

    cfg = getattr(settings, "BUNNY_CONFIG", {})
    token_key = cfg.get("TOKEN_KEY")
    if not token_key:
        # Không có token key → không ký được, trả URL không token
        return f"{BUNNY_EMBED_BASE}/{library_id}/{video_id}"

    expires = int(time.time()) + int(expires_in)

    # Bunny Embed View Token Authentication:
    # token = SHA256(token_key + video_id + expires)
    raw = f"{token_key}{video_id}{expires}"
    token = hashlib.sha256(raw.encode("utf-8")).hexdigest()

    return (
        f"{BUNNY_EMBED_BASE}/{library_id}/{video_id}"
        f"?token={token}&expires={expires}"
    )


def make_playback_url(video_id, signed=False, expires_in=3600):
    """
    Tạo embed URL cho một video.

    - signed=False (MẶC ĐỊNH): trả URL KHÔNG token — dùng để LƯU DATABASE.
    - signed=True: trả URL có token — chỉ dùng RUNTIME sau khi authorization.
    """
    cfg = _config()
    library_id = cfg["LIBRARY_ID"]
    base = f"{BUNNY_EMBED_BASE}/{library_id}/{video_id}"
    if not signed:
        return base
    return generate_bunny_embed_url(base, expires_in=expires_in)


def create_video(title):
    cfg = _config()
    resp = requests.post(
        f"{BUNNY_API_BASE}/library/{cfg['LIBRARY_ID']}/videos",
        json={"title": title or "Video"},
        headers=_headers(),
        timeout=30,
    )
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Bunny create video failed: {resp.status_code} {resp.text[:200]}")
    data = resp.json()
    return data.get("guid") or data.get("videoId")


def make_tus_signature(video_id, expiration_time):
    """Sinh signature cho TUS upload theo tài liệu chính thức Bunny Stream:
    SHA256(library_id + api_key + expiration_time + video_id)
    """
    cfg = _config()
    library_id = str(cfg["LIBRARY_ID"])
    api_key = cfg["API_KEY"]
    signature_string = f"{library_id}{api_key}{expiration_time}{video_id}"
    return hashlib.sha256(signature_string.encode()).hexdigest()


def init_tus_upload(title):
    """Tạo video trên Bunny Stream và trả về thông tin cần thiết để frontend thực hiện TUS upload.

    playback_url trả về là URL KHÔNG token (unsigned) — frontend lưu trực tiếp vào
    Lesson.video_url / Course.preview_video_url. Signed URL chỉ được tạo ở runtime.
    """
    cfg = _config()
    video_id = create_video(title)
    expiration_time = int(time.time()) + 24 * 3600
    signature = make_tus_signature(video_id, expiration_time)
    return {
        "video_id": video_id,
        "library_id": cfg["LIBRARY_ID"],
        "tus_upload_url": TUS_UPLOAD_URL,
        "signature": signature,
        "expiration_time": expiration_time,
        "playback_url": make_playback_url(video_id),
    }


def delete_video(video_id):
    cfg = _config()
    resp = requests.delete(
        f"{BUNNY_API_BASE}/library/{cfg['LIBRARY_ID']}/videos/{video_id}",
        headers=_headers(),
        timeout=30,
    )
    return resp.status_code in (200, 204)