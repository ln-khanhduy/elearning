import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getInstructorCoursesApi } from "../../api/instructorCourseAPI";

function InstructorCoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getInstructorCoursesApi();
      setCourses(res?.data || res || []);
    } catch (err) {
      toast.error("Không thể tải danh sách khóa học.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const getStatusBadge = (status) => {
    const m = { PUBLISHED: "success", DRAFT: "secondary", HIDDEN: "warning" };
    return m[status] || "secondary";
  };

  const getStatusText = (status) => {
    const m = { PUBLISHED: "Đã đăng", DRAFT: "Bản nháp", HIDDEN: "Đã ẩn" };
    return m[status] || status;
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

  if (courses.length === 0) {
    return (
      <div className="instructor-courses-page">
        <div className="instructor-courses-header">
          <div>
            <h2>Khóa học giảng dạy</h2>
            <p>Bạn chưa được phân công giảng dạy khóa học nào.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="instructor-courses-page">
      <div className="instructor-courses-header">
        <div>
          <h2>Khóa học giảng dạy ({courses.length})</h2>
          <p>Quản lý các khóa học bạn được phân công giảng dạy</p>
        </div>
      </div>

      <div className="instructor-courses-grid">
        {courses.map((course) => (
          <div className="instructor-course-card" key={course.id}>
            <Link to={`/instructor/courses/${course.id}`}>
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="instructor-course-thumb"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="instructor-course-thumb-placeholder">
                  <i className="bi bi-play-circle"></i>
                </div>
              )}
            </Link>
            <div className="instructor-course-body">
              <h5><Link to={`/instructor/courses/${course.id}`} className="text-decoration-none text-dark">{course.title}</Link></h5>
              <p>{course.description?.slice(0, 100)}</p>
              <div className="instructor-course-meta">
                <span className={`instructor-course-status bg-${getStatusBadge(course.status)}`}>{getStatusText(course.status)}</span>
                <span>{course.student_count || 0} học viên</span>
              </div>
              <div className="instructor-course-actions">
                <button className="course-btn-sm course-btn-outline" onClick={() => navigate(`/instructor/courses/${course.id}`)}>
                  <i className="bi bi-eye me-1"></i>Chi tiết
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default InstructorCoursesPage;