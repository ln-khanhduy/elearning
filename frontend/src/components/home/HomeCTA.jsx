import { Link } from "react-router-dom";

/**
 * CTA cuối trang - nền primary, kêu gọi hành động.
 * Nội dung tĩnh, không hard-code dữ liệu động.
 */
function HomeCTA() {
  return (
    <section className="home-cta-section">
      <div className="home-container">
        <div className="home-cta-box">
          <h2 className="home-cta-title">
            Bắt đầu hành trình học tập ngay hôm nay
          </h2>
          <p className="home-cta-desc">
            Tham gia cộng đồng hơn 50.000 học viên đang phát triển kỹ năng mỗi ngày cùng LMS Learn.
          </p>
          <div className="home-cta-actions">
            <Link to="/courses" className="home-cta-btn-primary">
              Khám phá khóa học
              <i className="bi bi-arrow-right" />
            </Link>
            <Link to="/register" className="home-cta-btn-secondary">
              Đăng ký miễn phí
            </Link>
            <Link to="/instructor/apply" className="home-cta-btn-outline">
              <i className="bi bi-mortarboard me-2"></i>
              Trở thành giảng viên
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeCTA;
