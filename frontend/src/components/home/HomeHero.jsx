import { Link } from "react-router-dom";


function HomeHero() {
  return (
    <section className="home-hero">
      <div className="home-hero-bg">
        <div className="home-hero-shape home-hero-shape-1" />
        <div className="home-hero-shape home-hero-shape-2" />
        <div className="home-hero-shape home-hero-shape-3" />
      </div>
      <div className="home-hero-container">
        <div className="home-hero-content">
          <span className="home-hero-badge">Nền tảng học trực tuyến hàng đầu</span>
          <h1 className="home-hero-title">
            Học tập không giới hạn,<br />
            <span className="home-hero-highlight">kiến tạo tương lai</span>
          </h1>
          <p className="home-hero-desc">
            Tiếp cận nền giáo dục đẳng cấp với các khóa học từ chuyên gia hàng đầu.
            Bắt đầu sự nghiệp mới hoặc nâng cao kỹ năng hiện có ngay hôm nay.
          </p>
          <div className="home-hero-actions">
            <Link to="/courses" className="home-hero-btn-primary">
              Khám phá khóa học
              <i className="bi bi-arrow-right" />
            </Link>
            <Link to="/register" className="home-hero-btn-secondary">
              Trở thành giảng viên
            </Link>
          </div>
          <div className="home-hero-stats">
            <div className="home-hero-stat">
              <span className="home-hero-stat-number">500+</span>
              <span className="home-hero-stat-label">Khóa học</span>
            </div>
            <div className="home-hero-stat-divider" />
            <div className="home-hero-stat">
              <span className="home-hero-stat-number">50K+</span>
              <span className="home-hero-stat-label">Học viên</span>
            </div>
            <div className="home-hero-stat-divider" />
            <div className="home-hero-stat">
              <span className="home-hero-stat-number">200+</span>
              <span className="home-hero-stat-label">Giảng viên</span>
            </div>
          </div>
        </div>
        <div className="home-hero-visual">
          <div className="home-hero-card">
            <div className="home-hero-card-header">
              <div className="home-hero-card-dots">
                <span /><span /><span />
              </div>
            </div>
            <div className="home-hero-card-body">
              <div className="home-hero-card-line wide" />
              <div className="home-hero-card-line" />
              <div className="home-hero-card-line medium" />
              <div className="home-hero-card-line short" />
              <div className="home-hero-card-line medium" />
              <div className="home-hero-card-line wide" />
              <div className="home-hero-card-line short" />
              <div className="home-hero-card-line" />
            </div>
            <div className="home-hero-card-footer">
              <div className="home-hero-card-avatar" />
              <div className="home-hero-card-info">
                <div className="home-hero-card-name" />
                <div className="home-hero-card-role" />
              </div>
            </div>
          </div>
          <div className="home-hero-floating home-hero-floating-1">
            <i className="bi bi-play-circle" />
            <span>Video bài giảng</span>
          </div>
          <div className="home-hero-floating home-hero-floating-2">
            <i className="bi bi-patch-check-fill" />
            <span>Chứng chỉ</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeHero;
