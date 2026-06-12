import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCourses, getCategories } from "../../services/courseService";
import "../../style/home.css";

function HomePage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [coursesData, categoriesData] = await Promise.all([
          getCourses({ status: "PUBLISHED" }),
          getCategories(),
        ]);
        setCourses(coursesData || []);
        setCategories(categoriesData || []);
      } catch (error) {
        console.error("Lỗi tải dữ liệu homepage:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const featuredCourses = courses.slice(0, 6);

  return (
    <div className="home-page">
      {/* ===== HERO ===== */}
      <section className="hero-section">
        <div className="container-fluid hero-container">
          <div className="hero-content">
            <h1>Học tập không giới hạn, kiến tạo tương lai</h1>
            <p>
              Tiếp cận nền giáo dục đẳng cấp thế giới với các khóa học uy tín được cung cấp. Bắt đầu sự nghiệp mới hoặc nâng cao kỹ năng
              hiện có với các khóa học trực tuyến linh hoạt.
            </p>
            <div className="hero-actions">
              <Link to="/courses" className="btn-start">Bắt đầu ngay</Link>
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

      {/* ===== STATS BANNER ===== */}
      <section className="stats-banner">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <i className="bi bi-book"></i>
              <div>
                <strong>500+</strong>
                <span>Khóa học chất lượng</span>
              </div>
            </div>
            <div className="stat-item">
              <i className="bi bi-people"></i>
              <div>
                <strong>50.000+</strong>
                <span>Học viên đăng ký</span>
              </div>
            </div>
            <div className="stat-item">
              <i className="bi bi-person-badge"></i>
              <div>
                <strong>200+</strong>
                <span>Giảng viên chuyên nghiệp</span>
              </div>
            </div>
            <div className="stat-item">
              <i className="bi bi-award"></i>
              <div>
                <strong>95%</strong>
                <span>Học viên hài lòng</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="section categories-section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-tag">Danh mục</span>
              <h2>Khám phá các lĩnh vực</h2>
              <p>Tìm kiếm khóa học phù hợp với định hướng nghề nghiệp của bạn</p>
            </div>
            <Link to="/courses" className="btn btn-outline-primary">
              Xem tất cả <i className="bi bi-chevron-right"></i>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : (
            <div className="category-grid">
              {categories.map((cat, index) => {
                const icons = [
                  "bi-code-slash", "bi-graph-up", "bi-brush", "bi-megaphone",
                  "bi-calculator", "bi-heart-pulse", "bi-globe", "bi-camera-video",
                ];
                const colors = [
                  "#4361ee", "#2ec4b6", "#ff6b6b", "#f77f00",
                  "#7209b7", "#06d6a0", "#118ab2", "#ef476f",
                ];
                return (
                  <Link
                    key={cat.id}
                    to={`/courses?category=${cat.id}`}
                    className="category-card"
                  >
                    <div className="category-icon" style={{ background: `${colors[index % colors.length]}15` }}>
                      <i className={`bi ${icons[index % icons.length]}`} style={{ color: colors[index % colors.length] }}></i>
                    </div>
                    <h3>{cat.name}</h3>
                    <span className="category-count">{Math.floor(Math.random() * 30) + 5} khóa học</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ===== FEATURED COURSES ===== */}
      <section className="section featured-section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-tag">Khóa học nổi bật</span>
              <h2>Khóa học được yêu thích nhất</h2>
              <p>Được hàng nghìn học viên lựa chọn và đánh giá cao</p>
            </div>
            <Link to="/courses" className="btn btn-outline-primary">
              Xem tất cả <i className="bi bi-chevron-right"></i>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : featuredCourses.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-journal-bookmark" style={{ fontSize: 48, color: "#ccc" }}></i>
              <p className="text-muted mt-2">Chưa có khóa học nào.</p>
            </div>
          ) : (
            <div className="course-grid">
              {featuredCourses.map((course) => (
                <div key={course.id} className="course-card">
                  <div className="course-card-image">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} />
                    ) : (
                      <div className="course-card-placeholder">
                        <i className="bi bi-image"></i>
                      </div>
                    )}
                    <span className="course-card-badge">{course.category_name || "Đa năng"}</span>
                  </div>
                  <div className="course-card-body">
                    <h3>{course.title}</h3>
                    <p className="course-card-instructor">
                      <i className="bi bi-person"></i> {course.instructor_name || "Giảng viên"}
                    </p>
                    <p className="course-card-desc">
                      {course.description?.substring(0, 100)}...
                    </p>
                    <div className="course-card-footer">
                      <span className="course-card-price">
                        {Number(course.price).toLocaleString("vi-VN")}₫
                      </span>
                      <Link to={`/courses/${course.id}`} className="btn btn-sm btn-primary">
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== WHY US ===== */}
      <section className="section why-section">
        <div className="container">
          <div className="section-header text-center">
            <div>
              <span className="section-tag">Tại sao chọn chúng tôi</span>
              <h2>Lợi ích khi học tại LMS Learn</h2>
              <p>Cam kết mang đến trải nghiệm học tập tốt nhất cho bạn</p>
            </div>
          </div>
          <div className="why-grid">
            <div className="why-card">
              <div className="why-icon" style={{ background: "#e8f4fd" }}>
                <i className="bi bi-person-video3" style={{ color: "#1976d2" }}></i>
              </div>
              <h3>Giảng viên chất lượng</h3>
              <p>Đội ngũ giảng viên giàu kinh nghiệm, được tuyển chọn kỹ lưỡng từ các trường đại học và doanh nghiệp hàng đầu.</p>
            </div>
            <div className="why-card">
              <div className="why-icon" style={{ background: "#e8f5e9" }}>
                <i className="bi bi-file-earmark-text" style={{ color: "#388e3c" }}></i>
              </div>
              <h3>Nội dung thực tế</h3>
              <p>Chương trình học được thiết kế bám sát nhu cầu thị trường, giúp bạn áp dụng ngay vào công việc.</p>
            </div>
            <div className="why-card">
              <div className="why-icon" style={{ background: "#fff3e0" }}>
                <i className="bi bi-clock-history" style={{ color: "#f57c00" }}></i>
              </div>
              <h3>Học mọi lúc, mọi nơi</h3>
              <p>Truy cập khóa học 24/7 từ bất kỳ thiết bị nào. Học theo tốc độ của riêng bạn, không áp lực thời gian.</p>
            </div>
            <div className="why-card">
              <div className="why-icon" style={{ background: "#fce4ec" }}>
                <i className="bi bi-patch-check" style={{ color: "#c62828" }}></i>
              </div>
              <h3>Chứng chỉ có giá trị</h3>
              <p>Nhận chứng chỉ hoàn thành khóa học được công nhận, giúp nâng cao giá trị hồ sơ của bạn.</p>
            </div>
            <div className="why-card">
              <div className="why-icon" style={{ background: "#f3e5f5" }}>
                <i className="bi bi-chat-dots" style={{ color: "#7b1fa2" }}></i>
              </div>
              <h3>Hỗ trợ tận tình</h3>
              <p>Đội ngũ hỗ trợ sẵn sàng giải đáp mọi thắc mắc của bạn trong suốt quá trình học tập.</p>
            </div>
            <div className="why-card">
              <div className="why-icon" style={{ background: "#e0f7fa" }}>
                <i className="bi bi-currency-dollar" style={{ color: "#00838f" }}></i>
              </div>
              <h3>Giá cả hợp lý</h3>
              <p>Học phí cạnh tranh với nhiều chương trình ưu đãi và học bổng hấp dẫn dành cho học viên.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="section testimonials-section">
        <div className="container">
          <div className="section-header text-center">
            <div>
              <span className="section-tag">Cảm nhận</span>
              <h2>Học viên nói gì về chúng tôi</h2>
              <p>Những trải nghiệm thực tế từ cộng đồng học viên</p>
            </div>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
              </div>
              <p>"Khóa học rất chất lượng, kiến thức được trình bày dễ hiểu. Tôi đã áp dụng ngay được vào công việc sau khi hoàn thành."</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{ background: "#1976d2" }}>N</div>
                <div>
                  <strong>Nguyễn Văn A</strong>
                  <span>Học viên khóa Python</span>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
              </div>
              <p>"Môi trường học tập chuyên nghiệp, giảng viên nhiệt tình. Tôi đã hoàn thành 3 khóa học và sẽ tiếp tục học thêm."</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{ background: "#388e3c" }}>T</div>
                <div>
                  <strong>Trần Thị B</strong>
                  <span>Học viên khóa Business</span>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-half"></i>
              </div>
              <p>"Nội dung cập nhật, thực tế và rất hữu ích. Giao diện dễ sử dụng, học mọi lúc mọi nơi rất tiện lợi."</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{ background: "#f57c00" }}>L</div>
                <div>
                  <strong>Lê Văn C</strong>
                  <span>Học viên khóa Data Science</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-box">
            <h2>Bắt đầu hành trình học tập của bạn ngay hôm nay</h2>
            <p>Tham gia cộng đồng hơn 50.000 học viên đang phát triển kỹ năng mỗi ngày cùng LMS Learn.</p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-light btn-lg">
                Đăng ký miễn phí <i className="bi bi-arrow-right"></i>
              </Link>
              <Link to="/courses" className="btn btn-outline-light btn-lg">
                Khám phá khóa học
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;