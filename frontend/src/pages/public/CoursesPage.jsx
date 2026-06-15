import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getCourses, getCategories } from "../../services/courseService";

function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const categoryFilter = searchParams.get("category") || "";
  const searchQuery = searchParams.get("q") || "";

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const params = { status: "PUBLISHED", page, page_size: 12 };
      if (categoryFilter) params.category = categoryFilter;
      if (searchQuery) params.q = searchQuery;

      const data = await getCourses(params);
      // data = { success: true, data: { items: [...], total, page, page_size, total_pages } }
      const result = data?.data || data;
      setCourses(result?.items || []);
      setTotal(result?.total || 0);
      setTotalPages(result?.total_pages || 0);
    } catch (error) {
      console.error("Lỗi tải khóa học:", error);
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter, searchQuery]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data?.data || data || []);
      } catch (error) {
        console.error("Lỗi tải danh mục:", error);
      }
    };
    loadCategories();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = e.target.search.value.trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (categoryFilter) params.set("category", categoryFilter);
    params.set("page", "1");
    setSearchParams(params);
  };

  const handleCategoryClick = (catId) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (catId) params.set("category", catId);
    params.set("page", "1");
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
  };

  return (
    <div className="courses-page">
      {/* Header */}
      <section className="courses-page-header">
        <div className="container">
          <h1>Khám phá khóa học</h1>
          <p>Học tập không giới hạn, kiến tạo tương lai</p>
          <form className="courses-search-form" onSubmit={handleSearch}>
            <div className="search-input-wrapper">
              <i className="bi bi-search"></i>
              <input
                type="text"
                name="search"
                defaultValue={searchQuery}
                placeholder="Tìm kiếm khóa học..."
              />
            </div>
            <button type="submit" className="btn-search">Tìm kiếm</button>
          </form>
        </div>
      </section>

      <div className="container">
        <div className="courses-layout">
          {/* Sidebar - Categories */}
          <aside className="courses-sidebar">
            <div className="sidebar-section">
              <h3>Danh mục</h3>
              <ul className="category-list">
                <li>
                  <button
                    className={`category-item ${!categoryFilter ? "active" : ""}`}
                    onClick={() => handleCategoryClick("")}
                  >
                    Tất cả
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      className={`category-item ${categoryFilter === String(cat.id) ? "active" : ""}`}
                      onClick={() => handleCategoryClick(cat.id)}
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <main className="courses-main">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
              </div>
            ) : courses.length === 0 ? (
              <div className="courses-empty">
                <i className="bi bi-journal-bookmark"></i>
                <h4>Không tìm thấy khóa học</h4>
                <p>Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác.</p>
              </div>
            ) : (
              <>
                <div className="courses-count">
                  Hiển thị <strong>{courses.length}</strong> / {total} khóa học
                </div>
                <div className="courses-grid">
                  {courses.map((course) => (
                    <div key={course.id} className="course-card">
                      <div className="course-card-image">
                        {course.thumbnail_url ? (
                          <img src={course.thumbnail_url} alt={course.title} />
                        ) : (
                          <div className="course-card-placeholder">
                            <i className="bi bi-image"></i>
                          </div>
                        )}
                        <span className="course-card-badge">
                          {course.category_name || "Đa năng"}
                        </span>
                      </div>
                      <div className="course-card-body">
                        <h3>{course.title}</h3>
                        <p className="course-card-instructor">
                          <i className="bi bi-person"></i>{" "}
                          {course.instructor_name || "Giảng viên"}
                        </p>
                        <p className="course-card-desc">
                          {course.description?.substring(0, 100)}...
                        </p>
                        <div className="course-card-footer">
                          <span className="course-card-price">
                            {Number(course.price).toLocaleString("vi-VN")}₫
                          </span>
                          <Link
                            to={`/courses/${course.id}`}
                            className="btn btn-sm btn-primary"
                          >
                            Xem chi tiết
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="courses-pagination">
                    <button
                      className="page-btn"
                      disabled={page <= 1}
                      onClick={() => handlePageChange(page - 1)}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          className={`page-btn ${p === page ? "active" : ""}`}
                          onClick={() => handlePageChange(p)}
                        >
                          {p}
                        </button>
                      )
                    )}
                    <button
                      className="page-btn"
                      disabled={page >= totalPages}
                      onClick={() => handlePageChange(page + 1)}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default CoursesPage;
