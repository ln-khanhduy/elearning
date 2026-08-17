import math
import os
from io import BytesIO

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from PIL import Image, ImageDraw, ImageFont


def get_font(size, bold=False):
    """
    Tìm font hỗ trợ tiếng Việt.
    Ưu tiên: DejaVuSans > Arial > NotoSans > fallback default.
    """
    font_variants = []
    if bold:
        font_variants = [
            "DejaVuSans-Bold.ttf",
            "DejaVuSans-BoldOblique.ttf",
            "arialbd.ttf",
            "arialb.ttf",
            "NotoSans-Bold.ttf",
            "NotoSansSC-Bold.otf",
        ]
    else:
        font_variants = [
            "DejaVuSans.ttf",
            "DejaVuSans-Oblique.ttf",
            "arial.ttf",
            "NotoSans-Regular.ttf",
            "NotoSansSC-Regular.otf",
        ]

    font_dirs = [
        "/usr/share/fonts/truetype/dejavu/",
        "/usr/share/fonts/truetype/",
        "/usr/share/fonts/",
        "C:/Windows/Fonts/",
        "/System/Library/Fonts/",
        "/Library/Fonts/",
    ]

    for font_dir in font_dirs:
        for font_name in font_variants:
            font_path = os.path.join(font_dir, font_name)
            if os.path.exists(font_path):
                try:
                    return ImageFont.truetype(font_path, size)
                except (IOError, OSError):
                    continue

    for font_dir in font_dirs:
        if os.path.isdir(font_dir):
            for f in os.listdir(font_dir):
                if f.endswith(".ttf") or f.endswith(".otf"):
                    try:
                        return ImageFont.truetype(os.path.join(font_dir, f), size)
                    except (IOError, OSError):
                        continue

    return ImageFont.load_default()


WIDTH = 1600
HEIGHT = 1100

# ===== Bảng màu cao cấp =====
NAVY = "#0f3d75"
GOLD = "#c9a24b"
GOLD_LIGHT = "#f5d78e"
MUTED = "#8a8578"
TEXT_COLOR = "#2b2b33"


# =============================================================================
# Helpers vẽ trang trí
# =============================================================================

def _lerp(a, b, t):
    return int(a + (b - a) * t)


def _make_gradient_background():
    """Tạo nền gradient từ cream xuống champagne nhạt."""
    gradient = Image.new("RGB", (1, HEIGHT))
    top = (253, 251, 247)
    bottom = (246, 241, 232)
    for y in range(HEIGHT):
        t = y / HEIGHT
        gradient.putpixel((0, y), (
            _lerp(top[0], bottom[0], t),
            _lerp(top[1], bottom[1], t),
            _lerp(top[2], bottom[2], t),
        ))
    return gradient.resize((WIDTH, HEIGHT))


def _draw_watermarks(draw):
    """Vẽ các vòng tròn mờ tạo chiều sâu cho nền."""
    wm_color = (235, 228, 210)
    draw.ellipse([-250, -320, 650, 580], outline=wm_color, width=2)
    draw.ellipse([1000, 550, 1900, 1450], outline=wm_color, width=2)
    draw.ellipse([-180, 650, 380, 1210], outline=wm_color, width=2)


def _draw_frame(draw):
    """Vẽ khung viền kép với kim cương vàng ở 4 góc."""
    # Outer frame - navy đậm
    draw.rectangle([16, 16, WIDTH - 16, HEIGHT - 16], outline=NAVY, width=8)
    # Inner frame - gold
    draw.rectangle([38, 38, WIDTH - 38, HEIGHT - 38], outline=GOLD, width=3)
    # Kim cương trang trí ở 4 góc
    r = 22
    for cx, cy in [(38, 38), (WIDTH - 38, 38), (38, HEIGHT - 38), (WIDTH - 38, HEIGHT - 38)]:
        draw.polygon(
            [(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)],
            fill=GOLD,
        )
        draw.polygon(
            [(cx, cy - r + 6), (cx + r - 6, cy), (cx, cy + r - 6), (cx - r + 6, cy)],
            fill=GOLD_LIGHT,
        )


def _draw_centered_text(draw, cx, y, text, font, fill, spacing=0):
    """Vẽ text căn giữa theo chiều ngang, hỗ trợ letter-spacing."""
    if not text:
        return
    if spacing == 0:
        bbox = draw.textbbox((0, 0), text, font=font)
        x = cx - (bbox[2] - bbox[0]) / 2 - bbox[0]
        draw.text((x, y), text, fill=fill, font=font)
        return

    total_w = sum(draw.textlength(ch, font=font) for ch in text) + spacing * (len(text) - 1)
    x = cx - total_w / 2
    for ch in text:
        draw.text((x, y), ch, fill=fill, font=font)
        x += draw.textlength(ch, font=font) + spacing


def _star_points(cx, cy, outer_r, inner_r):
    """Tạo điểm cho ngôi sao 5 cánh."""
    points = []
    for i in range(10):
        angle = -math.pi / 2 + i * math.pi / 5
        r = outer_r if i % 2 == 0 else inner_r
        points.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    return points


def _draw_badge(draw, cx, cy, radius=48):
    """Vẽ huy hiệu tròn vàng ở đầu chứng chỉ."""
    # Vòng ngoài màu vàng
    draw.ellipse(
        [cx - radius, cy - radius, cx + radius, cy + radius],
        fill=GOLD_LIGHT,
        outline=GOLD,
        width=5,
    )
    # Vòng trong mảnh
    draw.ellipse(
        [cx - radius + 10, cy - radius + 10, cx + radius - 10, cy + radius - 10],
        outline=GOLD,
        width=2,
    )
    # Ngôi sao ở giữa
    draw.polygon(_star_points(cx, cy, 24, 10), fill=NAVY)


def _draw_seal(draw, cx, cy, radius=88):
    """Vẽ con dấu vàng ở giữa dưới chứng chỉ."""
    # Vòng chính màu vàng
    draw.ellipse(
        [cx - radius, cy - radius, cx + radius, cy + radius],
        fill=(245, 215, 142),
        outline=GOLD,
        width=7,
    )
    # Vòng trong mảnh
    draw.ellipse(
        [cx - radius + 16, cy - radius + 16, cx + radius - 16, cy + radius - 16],
        outline=GOLD,
        width=3,
    )
    # Ngôi sao
    draw.polygon(_star_points(cx, cy - 12, 22, 9), fill=NAVY)
    # Text bên trong
    font_lbl = get_font(16, bold=True)
    _draw_centered_text(draw, cx, cy + 18, "FUTURE LMS", font_lbl, NAVY, spacing=1)
    _draw_centered_text(draw, cx, cy + 40, "E-LEARNING", font_lbl, NAVY, spacing=1)


def _fit_font(draw, text, font, max_width):
    """Giảm dần cỡ font nếu text vượt quá max_width."""
    current = font
    size = font.size
    while size > 18 and draw.textlength(text, font=current) > max_width:
        size -= 4
        current = get_font(size, bold=True)
    return current


# =============================================================================
# Generate ảnh chứng chỉ
# =============================================================================

def generate(certificate):
    """
    Tạo ảnh chứng chỉ PNG cao cấp từ dữ liệu certificate.
    Trả về ContentFile để upload lên Cloudinary.
    """
    student_name = (
        certificate.student.get_full_name()
        or certificate.student.email
    ).upper()

    course_name = certificate.course.title
    issued_at = certificate.issued_at.strftime("%d/%m/%Y")
    cert_code = certificate.certificate_code

    img = _make_gradient_background()
    draw = ImageDraw.Draw(img)

    # Fonts
    font_brand = get_font(32, bold=True)
    font_title = get_font(68, bold=True)
    font_name = get_font(62, bold=True)
    font_course = get_font(42, bold=True)
    font_body = get_font(30)
    font_info = get_font(26)
    font_footer = get_font(18)
    font_small = get_font(17)

    # === Background trang trí ===
    _draw_watermarks(draw)
    _draw_frame(draw)

    # === Header: huy hiệu + tên web ===
    _draw_badge(draw, WIDTH // 2, 125)
    _draw_centered_text(draw, WIDTH // 2, 195, "FUTURE LMS", font_brand, GOLD, spacing=12)

    # === Tiêu đề chính ===
    _draw_centered_text(draw, WIDTH // 2, 260, "CERTIFICATE", font_title, NAVY, spacing=6)
    _draw_centered_text(draw, WIDTH // 2, 345, "OF COMPLETION", font_title, NAVY, spacing=6)

    # === Đường gạch trang trí dưới tiêu đề ===
    line_y = 440
    center_lw = 130
    draw.line(
        [(WIDTH // 2 - center_lw, line_y), (WIDTH // 2 + center_lw, line_y)],
        fill=GOLD,
        width=4,
    )
    for dx in (-center_lw, 0, center_lw):
        draw.polygon(
            [
                (WIDTH // 2 + dx, line_y - 7),
                (WIDTH // 2 + dx + 7, line_y),
                (WIDTH // 2 + dx, line_y + 7),
                (WIDTH // 2 + dx - 7, line_y),
            ],
            fill=GOLD,
        )

    # === Chữ xác nhận ===
    _draw_centered_text(draw, WIDTH // 2, 490, "THIS IS TO CERTIFY THAT", font_body, MUTED, spacing=4)

    # === Tên học viên ===
    font_name_actual = _fit_font(draw, student_name, font_name, WIDTH - 300)
    if font_name_actual is not font_name:
        # Căn lại vị trí nếu giảm font
        pass
    _draw_centered_text(draw, WIDTH // 2, 548, student_name, font_name_actual, NAVY)

    # === Chữ đã hoàn thành ===
    _draw_centered_text(draw, WIDTH // 2, 652, "HAS SUCCESSFULLY COMPLETED THE COURSE", font_body, MUTED, spacing=3)

    # === Tên khóa học trong khung bo tròn ===
    course_font = _fit_font(draw, course_name, font_course, WIDTH - 440)
    course_w = draw.textlength(course_name, font=course_font)
    box_pad_x = 52
    box_pad_y = 20
    box_x1 = WIDTH // 2 - course_w / 2 - box_pad_x
    box_x2 = WIDTH // 2 + course_w / 2 + box_pad_x
    box_y1 = 704
    cbox = draw.textbbox((0, 0), course_name, font=course_font)
    text_h = cbox[3] - cbox[1]
    box_y2 = box_y1 + text_h + 2 * box_pad_y
    draw.rounded_rectangle([box_x1, box_y1, box_x2, box_y2], radius=18, outline=GOLD, width=3)
    _draw_centered_text(draw, WIDTH // 2, box_y1 + box_pad_y - cbox[1], course_name, course_font, NAVY)

    # === Hàng dưới: chữ ký | con dấu | ngày cấp ===
    bottom_y = 900

    # Chữ ký (bên trái)
    sig_y = bottom_y + 32
    draw.line([(220, sig_y), (520, sig_y)], fill=TEXT_COLOR, width=3)
    _draw_centered_text(draw, 370, sig_y + 14, "Authorized Signature", font_small, MUTED)
    _draw_centered_text(draw, 370, sig_y + 38, "FUTURE LMS", font_small, NAVY)

    # Con dấu (chính giữa)
    _draw_seal(draw, WIDTH // 2, bottom_y + 28)

    # Ngày cấp (bên phải)
    _draw_centered_text(draw, 1230, bottom_y + 8, "DATE OF ISSUE", font_small, GOLD, spacing=3)
    _draw_centered_text(draw, 1230, bottom_y + 40, issued_at, font_info, NAVY)

    # === Footer ===
    _draw_centered_text(
        draw,
        WIDTH // 2,
        HEIGHT - 82,
        "This certificate is issued by Future LMS - E-Learning Platform",
        font_footer,
        MUTED,
    )

    # === Mã chứng chỉ — góc dưới bên trái ===
    draw.text((70, HEIGHT - 58), f"Certificate No: {cert_code}", fill=MUTED, font=font_small)

    # === Lưu vào buffer ===
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    return ContentFile(
        buffer.read(),
        name=f"certificate_{certificate.id}.png"
    )


def upload(certificate):
    """
    Tạo ảnh chứng chỉ và upload lên Cloudinary.
    Dùng default_storage (SmartMediaCloudinaryStorage) để upload.
    Nếu certificate đã có image_url thì không làm gì.
    Trả về URL ảnh.
    """
    if certificate.image_url:
        return certificate.image_url

    image_file = generate(certificate)
    file_path = default_storage.save(
        f"certificates/certificate_{certificate.id}.png",
        image_file
    )
    image_url = default_storage.url(file_path)
    certificate.image_url = image_url
    certificate.save(update_fields=["image_url"])
    return image_url