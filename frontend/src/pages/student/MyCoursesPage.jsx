import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getMyCoursesApi } from "../../api/enrollmentAPI";
import ConfirmModal from "../../components/common/ConfirmModal";

function MyCoursesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const loadEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyCoursesApi();
      setEnrollments(res?.data || res || []);
    } catch (err) {
      toast.error("Không thể tải danh sách khóa học.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  const getProgressPercent = (enr) => {
    if (enr.progress_percent !== undefined && enr.progress_percent !== null) {
      return Math.round(Number(enr.progress_percent));
    }
    return 0;
  };

  const getProgressColor = (percent) => {
    if (percent >= 80) return "#198754";
    if (percent >= 40) return "#ffc107";
    return "#dc3545";
  };

  // Filter + search + sort
  const filteredEnrollments = useMemo(() => {
    let result = [...enrollments];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (enr) =>
          (enr.course_title || "").toLowerCase().includes(q) ||
          (enr.instructor_name || "").toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter === "in-progress") {
      result = result.filter((enr) => getProgressPercent(enr) > 0 && getProgressPercent(enr) < 100);
    } else if (statusFilter === "completed") {
      result = result.filter((enr) => getProgressPercent(enr) >= 100);
    } else if (statusFilter === "not-started") {
      result = result.filter((enr) => getProgressPercent(enr) === 0);
    }

    // Sort
    if (sortBy === "recent") {
      result.sort((a, b) => new Date(b.enrolled_at || b.created_at) - new Date(a.enrolled_at || a.created_at));
    } else if (sortBy === "progress-asc") {
      result.sort((a, b) => getProgressPercent(a) - getProgressPercent(b));
    } else if (sortBy === "progress-desc") {
      result.sort((a, b) => getProgressPercent(b) - getProgressPercent(a));
    } else if (sortBy === "name") {
      result.sort((a, b) => (a.course_title || "").localeCompare(b.course_title || ""));
    }

    return result;
  }, [enrollments, searchQuery, statusFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredEnrollments.length / pageSize);
  const paginatedEnrollments = filteredEnrollments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  if (loading) {
    return (
      <div className="my-courses-page">
        <div className="my-courses-skeleton-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="my-course-card skeleton">
              <div className="skeleton-thumb" style={{ height: 160, background: "#e0e0e0", borderRadius: "8px 8px 0 0" }}></div>
              <div className="my-course-body">
                <div className="skeleton-text" style={{ height: 20, width: "70%", background: "#e0e0e0", marginBottom: 8, borderRadius: 4 }}></div>
                <div className="skeleton-text" style={{ height: 14, width: "40%", background: "#e0e0e0", borderRadius: 4 }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="my-courses-page">
      <div className="my-courses-header">
        <div>
          <h2>Khóa học của tôi</h2>
          <p className="text-muted">{filteredEnrollments.length} khóa học {statusFilter !== "all" ? `(${statusFilter === "in-progress" ? "đang học" : statusFilter === "completed" ? "đã hoàn thành" : "chưa bắt đầu"})` : ""}</p>
        </div>
      </div>

      {/* Search + Filter + Sort */}
      <div className="my-courses-toolbar">
        <form className="my-courses-search" onSubmit={handleSearchSubmit}>
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Tìm khóa học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="btn-clear" onClick={() => setSearchQuery("")}>
              <i className="bi bi-x"></i>
            </button>
          )}
        </form>
        <div className="my-courses-filters">
          <div className="filter-tabs">
            {[
              { key: "all", label: "Tất cả" },
              { key: "in-progress", label: "Đang học" },
              { key: "completed", label: "Đã hoàn thành" },
              { key: "not-started", label: "Chưa bắt đầu" },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`filter-tab ${statusFilter === tab.key ? "active" : ""}`}
                onClick={() => setStatusFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="recent">Gần đây</option>
            <option value="progress-asc">Tiến độ tăng dần</option>
            <option value="progress-desc">Tiến độ giảm dần</option>
            <option value="name">Tên A-Z</option>
          </select>
        </div>
      </div>

      {/* Empty state */}
      {filteredEnrollments.length === 0 && (
        <div className="my-courses-empty text-center py-5">
          <h4>
            {searchQuery
              ? "Không tìm thấy khóa học phù hợp"
              : statusFilter !== "all"
              ? "Không có khóa học nào ở trạng thái này"
              : "Bạn chưa đăng ký khóa học nào"}
          </h4>
          <p>Hãy khám phá các khóa học và bắt đầu hành trình học tập ngay hôm nay.</p>
          <button className="my-courses-btn-primary" onClick={() => navigate("/courses")}>
            Khám phá khóa học
          </button>
        </div>
      )}

      {/* Course grid */}
      {filteredEnrollments.length > 0 && (
        <>
          <div className="my-courses-grid">
            {paginatedEnrollments.map((enr) => (
              <div
                key={enr.id}
                className="my-course-card"
                onClick={() => navigate(`/courses/${enr.course}/learn`)}
              >
                <div className="my-course-thumb">
                  {enr.course_thumbnail ? (
                    <img src={enr.course_thumbnail} alt={enr.course_title} loading="lazy" />
                  ) : (
                    <div className="my-course-thumb-placeholder">
                      <i className="bi bi-play-circle"></i>
                    </div>
                  )}
                  {getProgressPercent(enr) > 0 && (
                    <div className="my-course-progress-bar">
                      <div
                        className="my-course-progress-fill"
                        style={{
                          width: `${getProgressPercent(enr)}%`,
                          background: getProgressColor(getProgressPercent(enr)),
                        }}
                      ></div>
                    </div>
                  )}
                </div>
                <div className="my-course-body">
                  <h3>{enr.course_title || "Khóa học"}</h3>
                  <p className="text-muted small">{enr.instructor_name || ""}</p>
                  <div className="my-course-meta">
                    <small className="text-muted">
                      <i className="bi bi-check-circle me-1"></i>
                      {enr.completed_lessons_count || 0}/{enr.total_lessons_count || 0} bài
                    </small>
                    {getProgressPercent(enr) > 0 && (
                      <small className="fw-bold" style={{ color: getProgressColor(getProgressPercent(enr)) }}>
                        {getProgressPercent(enr)}%
                      </small>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="my-courses-pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              <span>{currentPage} / {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
export default MyCoursesPage;