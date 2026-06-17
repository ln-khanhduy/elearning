import { Link } from "react-router-dom";

/**
 * Categories section - hiển thị danh mục khóa học.
 * Dữ liệu từ API categories. Nếu không có API hoặc danh sách rỗng thì ẩn section.
 * Không hard-code category.
 */
function HomeCategories({ categories, loading }) {
  // Ẩn section nếu không có categories
  if (!loading && (!categories || categories.length === 0)) {
    return null;
  }

  const categoryIcons = [
    "bi-code-slash", "bi-graph-up", "bi-brush", "bi-megaphone",
    "bi-calculator", "bi-heart-pulse", "bi-globe", "bi-camera-video",
    "bi-music-note", "bi-book", "bi-building", "bi-cpu",
  ];

  const categoryColors = [
    "#4361ee", "#2ec4b6", "#ff6b6b", "#f77f00",
    "#7209b7", "#06d6a0", "#118ab2", "#ef476f",
    "#e36414", "#0f4c5c", "#5f0f40", "#2d6a4f",
  ];

  return (
    <section className="home-section home-categories-section">
      <div className="home-container">
        <div className="home-section-header">
          <div className="home-section-header-left">
            <span className="home-section-tag">Danh mục</span>
            <h2 className="home-section-title">Khám phá các lĩnh vực</h2>
            <p className="home-section-desc">
              Tìm kiếm khóa học phù hợp với định hướng nghề nghiệp của bạn
            </p>
          </div>
          <Link to="/courses" className="home-section-link">
            Xem tất cả <i className="bi bi-chevron-right" />
          </Link>
        </div>

        {loading ? (
          <div className="home-category-grid">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="home-category-skeleton">
                <div className="skeleton-pulse" style={{ width: 48, height: 48, borderRadius: 12, background: "#eef0f4", margin: "0 auto 12px" }} />
                <div className="skeleton-line" style={{ width: "60%", margin: "0 auto" }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="home-category-grid">
            {categories.map((cat, index) => (
              <Link
                key={cat.id}
                to={`/courses?category=${cat.id}`}
                className="home-category-card"
              >
                <div
                  className="home-category-icon"
                  style={{ background: `${categoryColors[index % categoryColors.length]}15` }}
                >
                  <i
                    className={`bi ${categoryIcons[index % categoryIcons.length]}`}
                    style={{ color: categoryColors[index % categoryColors.length] }}
                  />
                </div>
                <h3 className="home-category-name">{cat.name}</h3>
                <span className="home-category-count">
                  {cat.course_count || 0} khóa học
                </span>

              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default HomeCategories;
