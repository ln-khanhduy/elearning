import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getAdminCourses,
  deleteAdminCourse,
  publishAdminCourse,
  hideAdminCourse,
} from "../../services/courseService";
import ConfirmModal from "../../components/common/ConfirmModal";

const STATUS_MAP = {
  DRAFT: { label: "Bản nháp", color: "#6c757d", icon: "bi-pencil" },
  PUBLISHED: { label: "Đã đăng", color: "#198754", icon: "bi-globe" },
  HIDDEN: { label: "Đã ẩn", color: "#6f42c1", icon: "bi-eye-slash" },
};

function AdminCourseListPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    variant: "primary",
    confirmLabel: "Xác nhận",
    onConfirm: () => {},
  });

  const showConfirm = ({ title, message, variant = "primary", confirmLabel = "Xác nhận", onConfirm }) => {
    setConfirmModal({ show: true, title, message, variant, confirmLabel, onConfirm });
  };

  const hideConfirm = () => {
    setConfirmModal((prev) => ({ ...prev, show: false }));
  };

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminCourses({});
      setCourses(data?.data?.items || data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách khóa học.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleDelete = (courseId) => {
    showConfirm({
      title: "Xóa khóa học",
      message: "Bạn có chắc muốn xóa khóa học này? Hành động này không thể hoàn tác.",
      variant: "danger",
      confirmLabel: "Xóa",
      onConfirm: async () => {
        hideConfirm();
        try {
          setActionLoading(`delete-${courseId}`);
          await deleteAdminCourse(courseId);
          toast.success("Xóa khóa học thành công.");
          loadCourses();
        } catch (error) {
          toast.error(error.message);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handlePublish = async (courseId) => {
    try {
      setActionLoading(`publish-${courseId}`);
      await publishAdminCourse(courseId);
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
      await hideAdminCourse(courseId);
      toast.success("Đã ẩn khóa học.");
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

    if (course.status === "DRAFT") {
      actions.push(
        <button
          key="edit"
          className="course-action-btn btn-edit"
          onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
        >
          <i className="bi bi-pencil"></i> Sửa
        </button>
      );
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
          Đăng
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
    } else if (course.status === "PUBLISHED") {
      actions.push(
        <button
          key="edit"
          className="course-action-btn btn-edit"
          onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
        >
          <i className="bi bi-pencil"></i> Sửa
        </button>
      );
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
          key="assign"
          className="course-action-btn btn-assign"
          onClick={() => navigate(`/admin/courses/${course.id}/assign`)}
        >
          <i className="bi bi-person-plus"></i> Phân công
        </button>
      );
    } else if (course.status === "HIDDEN") {
      actions.push(
        <button
          key="edit"
          className="course-action-btn btn-edit"
          onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
        >
          <i className="bi bi-pencil"></i> Sửa
        </button>
      );
      actions.push(
        <button
          key="publish"
          className="course-action-btn btn-publish"
          onClick={() => handlePublish(course.id)}
          disabled={actionLoading === `publish-${course.id}`}
        >
          <i className="bi bi-eye"></i> Hiện lại
        </button>
      );
    }

    return actions;
  };

  if (loading) {
    return (
      <div className="admin-courses-page">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-courses-page">
      <div className="admin-courses-header">
        <div>
          <h2>Quản lý khóa học</h2>
          <p className="text-muted">Tạo và quản lý các khóa học.</p>
        </div>
        <button
          className="courses-btn-create"
          onClick={() => navigate("/admin/courses/create")}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Tạo khóa học mới
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="admin-courses-empty">
          <i className="bi bi-journal-bookmark"></i>
          <h4>Chưa có khóa học nào</h4>
          <p>Bắt đầu tạo khóa học đầu tiên ngay!</p>
          <button
            className="courses-btn-create"
            onClick={() => navigate("/admin/courses/create")}
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
                    <i className="bi bi-person me-1"></i>
                    {course.assigned_instructor_name || "Chưa phân công"}
                  </span>
                  <span>
                    <i className="bi bi-calendar me-1"></i>
                    {new Date(course.created_at).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="course-card-actions">{getActions(course)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm}
        onCancel={hideConfirm}
      />
    </div>
  );
}

export default AdminCourseListPage;
