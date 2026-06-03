import { useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import "../../style/home.css";

function HomePage() {
  const navigate = useNavigate();

  const goToCourses = () => navigate("/courses");
  const goToRegister = () => navigate("/register");
  const goToBusiness = () => navigate("/contact");

  return (
    <div className="home-page">
      <Header />

      <main>
        <section className="hero-section">
          <div className="container-fluid hero-container">
            <div className="hero-content">
              <h1>Học tập không giới hạn, kiến tạo tương lai</h1>

              <p>
                Tiếp cận nền giáo dục đẳng cấp thế giới với các khóa học uy tín được cung cấp. Bắt đầu sự nghiệp mới hoặc nâng cao kỹ năng
                hiện có với các khóa học trực tuyến linh hoạt.
              </p>

              <div className="hero-actions">
                <button className="btn-start" onClick={goToCourses}>Bắt đầu ngay</button>
              </div>

              <div className="hero-features">
                <span><i className="bi bi-check-circle"></i>100% Trực tuyến</span>
                <span><i className="bi bi-check-circle"></i>Nội dung chất lượng cao</span>
                <span><i className="bi bi-check-circle"></i>Môi trường học tập tích cực</span>
              </div>
            </div>

            <div className="hero-image-box">
              <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3" alt="Learning" />
            </div>
          </div>
        </section>

        <section className="section categories-section">
          <div className="container-fluid">
            <div className="section-header">
              <div>
                <h2>Khám phá các lĩnh vực</h2>
                <p>Tìm kiếm khóa học phù hợp với định hướng nghề nghiệp của bạn</p>
              </div>

              <button type="button" className="link-button" onClick={goToCourses}>
                Xem tất cả <i className="bi bi-chevron-right"></i>
              </button>
            </div>

            <div className="category-grid">
              <button type="button" className="category-card" onClick={goToCourses}>
                <div className="category-icon blue"><i className="bi bi-database"></i></div>
                <h3>Data Science</h3>
              </button>

              <button type="button" className="category-card" onClick={goToCourses}>
                <div className="category-icon green"><i className="bi bi-briefcase"></i></div>
                <h3>Business</h3>
              </button>

              <button type="button" className="category-card" onClick={goToCourses}>
                <div className="category-icon yellow"><i className="bi bi-code"></i></div>
                <h3>Computer Science</h3>
              </button>

              <button type="button" className="category-card" onClick={goToCourses}>
                <div className="category-icon red"><i className="bi bi-hospital"></i></div>
                <h3>Health</h3>
              </button>
            </div>
          </div>
        </section>

        <section className="section popular-section">
          <div className="container-fluid">
            <div className="section-header">
              <div>
                <h2>Khóa học phổ biến nhất</h2>
                <p>Được bình chọn cao nhất bởi cộng đồng hơn 5 triệu học viên</p>
              </div>
            </div>

            <div className="course-grid">
              <CourseCard onClick={goToCourses} image="https://images.unsplash.com/photo-1551288049-bebda4e38f71" school="STANFORD UNIVERSITY" title="Machine Learning Specialization" rating="4.9" reviews="125,430" progress="85%" badge="HOÀN THÀNH KHÓA HỌC" />
              <CourseCard onClick={goToCourses} image="https://images.unsplash.com/photo-1642790106117-e829e14a795f" school="YALE UNIVERSITY" title="The Science of Well-Being" rating="5.0" reviews="98,201" progress="40%" badge="POPULAR" />
              <CourseCard onClick={goToCourses} image="https://images.unsplash.com/photo-1515879218367-8466d910aaa4" school="IBM SKILLS NETWORK" title="Python for Data Science and AI" rating="4.6" reviews="145,670" progress="15%" badge="IN DEMAND" />
            </div>
          </div>
        </section>

        <section className="section why-section">
          <div className="container-fluid">
            <div className="why-title">
              <h2>Tại sao chọn LMS Learn?</h2>
              <div></div>
            </div>

            <div className="why-grid">
              <div className="why-item">
                <div className="why-icon blue-light"><i className="bi bi-headset"></i></div>
                <h3>Giảng viên tâm huyết</h3>
                <p>Đội ngũ giảng viên được tuyển chọn kỹ lưỡng qua các chứng chỉ sư phạm và chuyên môn.</p>
              </div>

              <div className="why-item">
                <div className="why-icon green-light"><i className="bi bi-patch-check"></i></div>
                <h3>Kiến thức thực tiễn</h3>
                <p>Chương trình học tập trung vào việc cung cấp lượng kiến thức phù hợp.</p>
              </div>

              <div className="why-item">
                <div className="why-icon yellow-light"><i className="bi bi-clock"></i></div>
                <h3>Linh hoạt mọi lúc</h3>
                <p>Tự do sắp xếp thời gian học tập phù hợp với lịch trình cá nhân.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-box">
            <h2>Bắt đầu hành trình chinh phục tri thức ngay hôm nay</h2>
            <p>Tham gia cộng đồng học tập văn minh, cùng nhau chia sẻ kiến thức và phát triển kỹ năng mỗi ngày.</p>

            <div className="cta-actions">
              <button type="button" onClick={goToRegister}>Đăng ký miễn phí</button>
              <button type="button" className="outline" onClick={goToBusiness}>Tìm hiểu cho doanh nghiệp</button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function CourseCard({ image, school, title, rating, reviews, progress, badge, onClick }) {
  return (
    <button type="button" className="course-card" onClick={onClick}>
      <div className="course-image">
        <img src={image} alt={title} />
        <span>{badge}</span>
      </div>

      <div className="course-body">
        <p className="school">{school}</p>
        <h3>{title}</h3>

        <div className="rating">
          <span>★★★★★</span>
          <strong>{rating}</strong>
          <p>({reviews} đánh giá)</p>
        </div>

        <div className="progress-line">
          <div style={{ width: progress }}></div>
        </div>

        <small>{progress} HOÀN THÀNH</small>
      </div>
    </button>
  );
}

export default HomePage;