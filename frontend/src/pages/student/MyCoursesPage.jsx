import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getMyEnrollmentsApi } from "../../api/enrollmentAPI";

function MyCoursesPage() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyEnrollmentsApi();
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

  if (enrollments.length === 0) {
    return (
      <div className="my-courses-page">
        <div className="my-courses-header">
          <h2>Khóa học của tôi</h2>
          <p className="text-muted">Bạn chưa đăng ký khóa học nào.</p>
        </div>
        <div className="text-center py-5">
          <button className="btn btn-primary" onClick={() => navigate("/courses")}>
            Khám phá khóa học
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-courses-page">
      <div className="my-courses-header">
        <h2>Khóa học của tôi</h2>
        <p className="text-muted">{enrollments.length} khóa học đã đăng ký</p>
      </div>
      <div className="my-courses-grid">
        {enrollments.map((enr) => (
          <div key={enr.id} className="my-course-card" onClick={() => navigate(`/courses/${enr.course}/learn`)}>
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
                  <div className="my-course-progress-fill" style={{ width: `${getProgressPercent(enr)}%`, background: getProgressColor(getProgressPercent(enr)) }}></div>
                </div>
              )}
            </div>
            <div className="my-course-body">
              <h3>{enr.course_title || "Khóa học"}</h3>
              <p className="text-muted small">{enr.instructor_name || ""}</p>
              {getProgressPercent(enr) > 0 && (
                <div className="d-flex align-items-center gap-2 mt-2">
                  <small className="fw-bold" style={{ color: getProgressColor(getProgressPercent(enr)) }}>
                    {getProgressPercent(enr)}%
                  </small>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default MyCoursesPage;