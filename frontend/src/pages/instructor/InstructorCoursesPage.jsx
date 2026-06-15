import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCourses,
  deleteCourse,
  submitForReview,
  publishCourse,
  hideCourse,
  unhideCourse,
} from "../../services/courseService";
import { useUser } from "../../context/UserContext";

const STATUS_MAP = {
  PENDING: { label: "Chờ duyệt", color: "#ffc107", icon: "bi-clock-history" },
  APPROVED: { label: "Đã duyệt", color: "#0d6efd", icon: "bi-check-circle" },
  REJECTED: { label: "Bị từ chối", color: "#dc3545", icon: "bi-x-circle" },
  PUBLISHED: { label: "Đã đăng", color: "#198754", icon: "bi-globe" },
  HIDDEN: { label: "Đã ẩn", color: "#6f42c1", icon: "bi-eye-slash" },
};

function InstructorCoursesPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCourses({});
      const allCourses = data?.data?.items || data || [];
      // Lọc khóa học của instructor hiện tại
      const myCourses = allCourses.filter(
        (c) => c.instructor_name === user?.get_full_name || c.instructor === user?.id
      );
      setCourses(allCourses);
    } catch (error) {
      toast.error("Không thể tải danh sách khóa học.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleDelete = async (courseId) => {
    if (!window.confirm("Bạn có chắc muốn xóa khóa học này?")) return;
    try {
      setActionLoading(`delete-${courseId}`);
      await deleteCourse(courseId);
      toast.success("Xóa khóa học thành công.");
      loadCourses();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitReview = async (courseId) => {
    try {
      setActionLoading(`submit-${courseId}`);
      await submitForReview(courseId);
      toast.success("Đã gửi khóa học chờ duyệt.");
      loadCourses();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublish = async (courseId) => {
    try {
      setActionLoading(`publish-${courseId}`);
      await publishCourse(courseId);
      toast.success("Đã đăng khóa học thành công.");
      loadCourses();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleHide = async (courseId) => {
    try {
      setActionLoading(`hide-${courseId}`);
      await hideCourse(courseId);
      toast.success("Đã ẩn khóa học.");
      loadCourses();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnhide = async (courseId) => {
    try {
      setActionLoading(`unhide-${courseId}`);
      await unhideCourse(courseId);
      toast.success("Đã hiện lại khóa học.");
      loadCourses();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(null);
    }
  };

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

  const getActions = (course) => {
    const actions = [];
    const isLoading = actionLoading && actionLoading.endsWith(course.id);

    if (course.status === "REJECTED") {
      actions.push(
        <button
          key="edit"
          className="course-action-btn btn-edit"
          onClick={() => navigate(`/instructor/courses/${course.id}/edit`)}
          disabled={isLoading}
        >
          <i className="bi bi-pencil"></i> Sửa
        </button>
      );
      actions.push(
        <button
          key="submit"
          className="course-action-btn btn-submit"
          onClick={() => handleSubmitReview(course.id)}
          disabled={actionLoading === `submit-${course.id}`}
        >
          {actionLoading === `submit-${course.id}` ? (
            <span className="spinner-border spinner-border-sm me-1"></span>
          ) : (
            <i className="bi bi-send"></i>
          )}
          Gửi duyệt
        </button>
      );
      actions.push(
        <button
          key="delete"
          className="course-action-btn btn-delete"
          onClick={() => handleDelete(course.id)}
          disabled={actionLoading === `delete-${course.id}`}
        >
          <i className="bi bi-trash"></i> Xóa
        </button>
      );
    } else if (course.status === "PENDING") {
      actions.push(
        <button key="view" className="course-action-btn btn-view" disabled>
          <i className="bi bi-clock"></i> Đang chờ duyệt
        </button>
      );
    } else if (course.status === "APPROVED") {
      actions.push(
        <button
          key="publish"
          className="course-action-btn btn-publish"
          onClick={() => handlePublish(course.id)}
          disabled={actionLoading === `publish-${course.id}`}
        >
          {actionLoading === `publish-${course.id}` ? (
            <span className="spinner-border spinner-border-sm me-1"></span>
          ) : (
            <i className="bi bi-globe"></i>
          )}
          Đăng khóa học
        </button>
      );
      actions.push(
        <button
          key="edit"
          className="course-action-btn btn-edit"
          onClick={() => navigate(`/instructor/courses/${course.id}/edit`)}
        >
          <i className="bi bi-pencil"></i> Sửa
        </button>
      );
    } else if (course.status === "PUBLISHED") {
      actions.push(
        <button
          key="hide"
          className="course-action-btn btn-hide"
          onClick={() => handleHide(course.id)}
          disabled={actionLoading === `hide-${course.id}`}
        >
          <i className="bi bi-eye-slash"></i> Ẩn
        </button>
      );
      actions.push(
        <button
          key="edit"
          className="course-action-btn btn-edit"
          onClick={() => navigate(`/instructor/courses/${course.id}/edit`)}
        >
          <i className="bi bi-pencil"></i> Sửa
        </button>
      );
    } else if (course.status === "HIDDEN") {
      actions.push(
        <button
          key="unhide"
          className="course-action-btn btn-publish"
          onClick={() => handleUnhide(course.id)}
          disabled={actionLoading === `unhide-${course.id}`}
        >
          <i className="bi bi-eye"></i> Hiện lại
        </button>
      );
    }

    return actions;
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
          <h2>Quản lý khóa học</h2>
          <p className="text-muted">Tạo và quản lý các khóa học của bạn.</p>
        </div>
        <button
          className="courses-btn-create"
          onClick={() => navigate("/instructor/courses/create")}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Tạo khóa học mới
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="courses-empty">
          <i className="bi bi-journal-bookmark"></i>
          <h4>Chưa có khóa học nào</h4>
          <p>Bắt đầu tạo khóa học đầu tiên của bạn ngay!</p>
          <button
            className="courses-btn-create"
            onClick={() => navigate("/instructor/courses/create")}
          >
            <i className="bi bi-plus-lg me-2"></i>
            Tạo khóa học mới
          </button>
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
                    <i className="bi bi-calendar me-1"></i>
                    {new Date(course.created_at).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                {course.approval_note && (
                  <div className="course-card-note">
                    <i className="bi bi-info-circle me-1"></i>
                    {course.approval_note}
                  </div>
                )}
                <div className="course-card-actions">{getActions(course)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default InstructorCoursesPage;
