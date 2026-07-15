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
BG_COLOR = "#ffffff"
BORDER_COLOR = "#0f3d75"
ACCENT_COLOR = "#f59e0b"
TEXT_COLOR = "#1a1a2e"
MUTED_COLOR = "#6c757d"


def generate(certificate):
    """
    Tạo ảnh chứng chỉ PNG từ dữ liệu certificate.
    Trả về ContentFile để upload lên Cloudinary.
    """
    student_name = (
        certificate.student.get_full_name()
        or certificate.student.email
    ).upper()

    course_name = certificate.course.title
    issued_at = certificate.issued_at.strftime("%d/%m/%Y")
    cert_code = certificate.certificate_code

    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    font_logo = get_font(36, bold=True)
    font_title = get_font(72, bold=True)
    font_name = get_font(56, bold=True)
    font_course_name = get_font(40, bold=True)
    font_info = get_font(28)
    font_footer = get_font(18)
    font_small = get_font(16)

    # === Vẽ border ===
    border_width = 20
    draw.rectangle(
        [border_width, border_width, WIDTH - border_width, HEIGHT - border_width],
        outline=BORDER_COLOR,
        width=border_width,
    )

    # === Vẽ border trong (accent) ===
    inner_border = 40
    draw.rectangle(
        [inner_border, inner_border, WIDTH - inner_border, HEIGHT - inner_border],
        outline=ACCENT_COLOR,
        width=4,
    )

    # === Vẽ đường kẻ trang trí ===
    line_y = 300
    draw.line(
        [(200, line_y), (WIDTH - 200, line_y)],
        fill=ACCENT_COLOR,
        width=3,
    )

    line_y2 = 840
    draw.line(
        [(200, line_y2), (WIDTH - 200, line_y2)],
        fill=ACCENT_COLOR,
        width=2,
    )

    # === Logo & Tên web ===
    logo_text = "Future LMS"
    logo_bbox = draw.textbbox((0, 0), logo_text, font=font_logo)
    logo_x = (WIDTH - logo_bbox[2]) // 2
    draw.text((logo_x, 70), logo_text, fill=ACCENT_COLOR, font=font_logo)

    # === Tiêu đề ===
    title_text = "CERTIFICATE OF COMPLETION"
    title_bbox = draw.textbbox((0, 0), title_text, font=font_title)
    title_x = (WIDTH - title_bbox[2]) // 2
    draw.text((title_x, 130), title_text, fill=BORDER_COLOR, font=font_title)

    # === Chữ "This is to certify that" ===
    certify_text = "This is to certify that"
    certify_bbox = draw.textbbox((0, 0), certify_text, font=font_info)
    certify_x = (WIDTH - certify_bbox[2]) // 2
    draw.text((certify_x, 350), certify_text, fill=MUTED_COLOR, font=font_info)

    # === Tên học viên ===
    name_bbox = draw.textbbox((0, 0), student_name, font=font_name)
    name_x = (WIDTH - name_bbox[2]) // 2
    draw.text((name_x, 410), student_name, fill=TEXT_COLOR, font=font_name)

    # === Chữ "has successfully completed the course" ===
    completed_text = "has successfully completed the course"
    completed_bbox = draw.textbbox((0, 0), completed_text, font=font_info)
    completed_x = (WIDTH - completed_bbox[2]) // 2
    draw.text((completed_x, 500), completed_text, fill=MUTED_COLOR, font=font_info)

    # === Tên khóa học ===
    course_bbox = draw.textbbox((0, 0), course_name, font=font_course_name)
    course_x = (WIDTH - course_bbox[2]) // 2
    draw.text((course_x, 560), course_name, fill=BORDER_COLOR, font=font_course_name)

    # === Ngày cấp ===
    date_text = f"Issued Date: {issued_at}"
    date_bbox = draw.textbbox((0, 0), date_text, font=font_info)
    date_x = (WIDTH - date_bbox[2]) // 2
    draw.text((date_x, 670), date_text, fill=TEXT_COLOR, font=font_info)

    # === Mã chứng chỉ — góc dưới bên trái ===
    code_text = f"Certificate No: {cert_code}"
    draw.text((80, 940), code_text, fill=MUTED_COLOR, font=font_small)

    # === Footer ===
    footer_text = "This certificate is issued by Future LMS - E-Learning Platform"
    footer_bbox = draw.textbbox((0, 0), footer_text, font=font_footer)
    footer_x = (WIDTH - footer_bbox[2]) // 2
    draw.text((footer_x, 910), footer_text, fill=MUTED_COLOR, font=font_footer)

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