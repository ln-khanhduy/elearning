import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getMyCourses } from "../../services/enrollmentService";

function MyCoursesPage() {
  const STATUS_MAP = {
    PENDING_PAYMENT: { label: "Chờ thanh toán", color: "#ffc107" },
    ACTIVE: { label: "Đang học", color: "#198754" },
    COMPLETED: { label: "Hoàn thành", color: "#0d6efd" },
    CANCELLED: { label: "Đã hủy", color: "#dc3545" },
  };
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMyCourses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyCourses();
      setEnrollments(data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách khóa học của bạn.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyCourses();
  }, [loadMyCourses]);

  const getStatusBadge = (status) => {
    const s = STATUS_MAP[status] || { label: status, color: "#6c757d" };
    return (
      <span className="mycourse-status-badge" style={{ backgroundColor: s.color + "20", color: s.color }}>
        {s.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="my-courses-page">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-courses-page">
      <div className="my-courses-header">
        <div>
          <h2>Khóa học của tôi</h2>
          <p className="text-muted">Các khóa học bạn đã đăng ký.</p>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="my-courses-empty">
          <i className="bi bi-journal-bookmark"></i>
          <h4>Bạn chưa đăng ký khóa học nào</h4>
          <p>Hãy khám phá các khóa học và bắt đầu học ngay!</p>
          <Link to="/courses" className="mycourses-btn-primary">
            Khám phá khóa học
          </Link>
        </div>
      ) : (
        <div className="mycourses-grid">
          {enrollments.map((enr) => (
            <div key={enr.id} className="mycourse-card">
              <div className="mycourse-card-thumb">
                {enr.course_thumbnail ? (
                  <img src={enr.course_thumbnail} alt={enr.course_title} />
                ) : (
                  <div className="mycourse-card-thumb-placeholder">
                    <i className="bi bi-image"></i>
                  </div>
                )}
                {getStatusBadge(enr.status)}
              </div>
              <div className="mycourse-card-body">
                <h5 className="mycourse-card-title">{enr.course_title}</h5>
                <p className="mycourse-card-instructor">
                  <i className="bi bi-person"></i> {enr.instructor_name}
                </p>
                {enr.status === "ACTIVE" && (
                  <div className="mycourse-progress">
                    <div className="mycourse-progress-bar">
                      <div
                        className="mycourse-progress-fill"
                        style={{ width: `${Math.min(enr.progress_percent || 0, 100)}%` }}
                      ></div>
                    </div>
                    <span className="mycourse-progress-text">
                      {Math.round(enr.progress_percent || 0)}%
                    </span>
                  </div>
                )}
                <div className="mycourse-card-footer">
                  <span className="mycourse-date">
                    Đăng ký: {new Date(enr.enrolled_at || enr.created_at).toLocaleDateString("vi-VN")}
                  </span>
                  {(enr.status === "ACTIVE" || enr.status === "COMPLETED") && (
                    <Link to={`/courses/${enr.course}/learn`} className="mycourse-btn-study">
                      {enr.status === "COMPLETED" ? "Xem lại" : "Học tiếp"}
                    </Link>
                  )}

                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyCoursesPage;
