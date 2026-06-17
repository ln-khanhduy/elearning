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

    # Các thư mục có thể chứa font
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

    # Fallback: thử tìm font bất kỳ có đuôi .ttf
    for font_dir in font_dirs:
        if os.path.isdir(font_dir):
            for f in os.listdir(font_dir):
                if f.endswith(".ttf") or f.endswith(".otf"):
                    try:
                        return ImageFont.truetype(os.path.join(font_dir, f), size)
                    except (IOError, OSError):
                        continue

    return ImageFont.load_default()


class CertificateImageService:
    """Service tạo ảnh chứng chỉ bằng Pillow."""

    WIDTH = 1600
    HEIGHT = 1100
    BG_COLOR = "#ffffff"
    BORDER_COLOR = "#0f3d75"
    ACCENT_COLOR = "#f59e0b"
    TEXT_COLOR = "#1a1a2e"
    MUTED_COLOR = "#6c757d"

    @staticmethod
    def generate(certificate):
        """
        Tạo ảnh chứng chỉ PNG từ dữ liệu certificate.
        Trả về ContentFile để upload lên Cloudinary.
        """
        # Lấy dữ liệu từ DB
        student_name = (
            certificate.student.get_full_name()
            or certificate.student.email
        ).upper()

        course_name = certificate.course.title
        certificate_code = certificate.certificate_code
        issued_at = certificate.issued_at.strftime("%d/%m/%Y")

        # Tạo ảnh
        img = Image.new("RGB", (CertificateImageService.WIDTH, CertificateImageService.HEIGHT), CertificateImageService.BG_COLOR)
        draw = ImageDraw.Draw(img)

        # Fonts
        font_title = get_font(72, bold=True)
        font_name = get_font(56, bold=True)
        font_course_label = get_font(24)
        font_course_name = get_font(40, bold=True)
        font_info = get_font(28)
        font_code = get_font(20)
        font_footer = get_font(18)

        # === Vẽ border ===
        border_width = 20
        draw.rectangle(
            [border_width, border_width, CertificateImageService.WIDTH - border_width, CertificateImageService.HEIGHT - border_width],
            outline=CertificateImageService.BORDER_COLOR,
            width=border_width,
        )

        # === Vẽ border trong (accent) ===
        inner_border = 40
        draw.rectangle(
            [inner_border, inner_border, CertificateImageService.WIDTH - inner_border, CertificateImageService.HEIGHT - inner_border],
            outline=CertificateImageService.ACCENT_COLOR,
            width=4,
        )

        # === Vẽ đường kẻ trang trí ===
        line_y = 280
        draw.line(
            [(200, line_y), (CertificateImageService.WIDTH - 200, line_y)],
            fill=CertificateImageService.ACCENT_COLOR,
            width=3,
        )

        line_y2 = 820
        draw.line(
            [(200, line_y2), (CertificateImageService.WIDTH - 200, line_y2)],
            fill=CertificateImageService.ACCENT_COLOR,
            width=2,
        )

        # === Tiêu đề ===
        title_text = "CERTIFICATE OF COMPLETION"
        title_bbox = draw.textbbox((0, 0), title_text, font=font_title)
        title_x = (CertificateImageService.WIDTH - title_bbox[2]) // 2
        draw.text((title_x, 120), title_text, fill=CertificateImageService.BORDER_COLOR, font=font_title)

        # === Chữ "This is to certify that" ===
        certify_text = "This is to certify that"
        certify_bbox = draw.textbbox((0, 0), certify_text, font=font_info)
        certify_x = (CertificateImageService.WIDTH - certify_bbox[2]) // 2
        draw.text((certify_x, 340), certify_text, fill=CertificateImageService.MUTED_COLOR, font=font_info)

        # === Tên học viên ===
        name_bbox = draw.textbbox((0, 0), student_name, font=font_name)
        name_x = (CertificateImageService.WIDTH - name_bbox[2]) // 2
        draw.text((name_x, 400), student_name, fill=CertificateImageService.TEXT_COLOR, font=font_name)

        # === Chữ "has successfully completed the course" ===
        completed_text = "has successfully completed the course"
        completed_bbox = draw.textbbox((0, 0), completed_text, font=font_info)
        completed_x = (CertificateImageService.WIDTH - completed_bbox[2]) // 2
        draw.text((completed_x, 490), completed_text, fill=CertificateImageService.MUTED_COLOR, font=font_info)

        # === Tên khóa học ===
        course_bbox = draw.textbbox((0, 0), course_name, font=font_course_name)
        course_x = (CertificateImageService.WIDTH - course_bbox[2]) // 2
        draw.text((course_x, 550), course_name, fill=CertificateImageService.BORDER_COLOR, font=font_course_name)

        # === Ngày cấp ===
        date_text = f"Issued Date: {issued_at}"
        date_bbox = draw.textbbox((0, 0), date_text, font=font_info)
        date_x = (CertificateImageService.WIDTH - date_bbox[2]) // 2
        draw.text((date_x, 660), date_text, fill=CertificateImageService.TEXT_COLOR, font=font_info)

        # === Mã chứng chỉ ===
        code_text = f"Certificate ID: {certificate_code}"
        code_bbox = draw.textbbox((0, 0), code_text, font=font_code)
        code_x = (CertificateImageService.WIDTH - code_bbox[2]) // 2
        draw.text((code_x, 740), code_text, fill=CertificateImageService.MUTED_COLOR, font=font_code)

        # === Footer ===
        footer_text = "This certificate is issued by the E-Learning Platform"
        footer_bbox = draw.textbbox((0, 0), footer_text, font=font_footer)
        footer_x = (CertificateImageService.WIDTH - footer_bbox[2]) // 2
        draw.text((footer_x, 900), footer_text, fill=CertificateImageService.MUTED_COLOR, font=font_footer)

        # === Lưu vào buffer ===
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)

        return ContentFile(
            buffer.read(),
            name=f"certificate_{certificate.id}.png"
        )

    @staticmethod
    def upload(certificate):
        """
        Tạo ảnh chứng chỉ và upload lên Cloudinary.
        Dùng default_storage (SmartMediaCloudinaryStorage) để upload.
        Nếu certificate đã có image_url thì không làm gì.
        Trả về URL ảnh.
        """
        if certificate.image_url:
            return certificate.image_url

        image_file = CertificateImageService.generate(certificate)
        file_path = default_storage.save(
            f"certificates/certificate_{certificate.id}.png",
            image_file
        )
        image_url = default_storage.url(file_path)
        certificate.image_url = image_url
        certificate.save(update_fields=["image_url"])
        return image_url
