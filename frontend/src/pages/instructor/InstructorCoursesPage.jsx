import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getInstructorCourses } from "../../services/courseService";

const STATUS_MAP = {
  DRAFT: { label: "Bản nháp", color: "#6c757d", icon: "bi-pencil" },
  PUBLISHED: { label: "Đã đăng", color: "#198754", icon: "bi-globe" },
  HIDDEN: { label: "Đã ẩn", color: "#6f42c1", icon: "bi-eye-slash" },
};

function InstructorCoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getInstructorCourses({});
      setCourses(data?.data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách khóa học.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const getStatusBadge = (status) => {
    const s = STATUS_MAP[status] || { label: status, color: "#6c757d", icon: "bi-question" };
    return (
      <span
        className="course-status-badge"
        style={{ backgroundColor: s.color + "20", color: s.color, border: `1px solid ${s.color}40` }}
      >
        <i className={`bi ${s.icon} me-1`}></i>
        {s.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="instructor-courses-page">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="instructor-courses-page">
      <div className="courses-header">
        <div>
          <h2>Khóa học được phân công</h2>
          <p className="text-muted">Danh sách khóa học bạn được phân công giảng dạy.</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="courses-empty">
          <i className="bi bi-journal-bookmark"></i>
          <h4>Chưa có khóa học nào</h4>
          <p>Bạn chưa được phân công giảng dạy khóa học nào.</p>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => (
            <div key={course.id} className="course-card">
              <div className="course-card-thumb">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} />
                ) : (
                  <div className="course-card-thumb-placeholder">
                    <i className="bi bi-image"></i>
                  </div>
                )}
              </div>
              <div className="course-card-body">
                <div className="course-card-header">
                  <h5 className="course-card-title">{course.title}</h5>
                  {getStatusBadge(course.status)}
                </div>
                <p className="course-card-desc">
                  {course.description?.length > 100
                    ? course.description.substring(0, 100) + "..."
                    : course.description || "Chưa có mô tả"}
                </p>
                <div className="course-card-meta">
                  <span>
                    <i className="bi bi-currency-dollar me-1"></i>
                    {Number(course.price).toLocaleString("vi-VN")}đ
                  </span>
                  <span>
                    <i className="bi bi-people me-1"></i>
                    {course.student_count || 0} học viên
                  </span>
                  <span>
                    <i className="bi bi-calendar me-1"></i>
                    {new Date(course.created_at).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="course-card-actions">
                  <button
                    className="course-action-btn btn-view"
                    onClick={() => navigate(`/instructor/courses/${course.id}`)}
                  >
                    <i className="bi bi-eye"></i> Xem chi tiết
                  </button>
                  <button
                    className="course-action-btn btn-students"
                    onClick={() => navigate(`/instructor/courses/${course.id}/students`)}
                  >
                    <i className="bi bi-people"></i> Học viên
                  </button>
                  <button
                    className="course-action-btn btn-analytics"
                    onClick={() => navigate(`/instructor/courses/${course.id}/analytics`)}
                  >
                    <i className="bi bi-graph-up"></i> Phân tích
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default InstructorCoursesPage;
