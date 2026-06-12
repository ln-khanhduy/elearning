import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  getPendingCourses,
  approveCourse,
  rejectCourse,
} from "../../services/courseService";

function AdminPendingCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, courseId: null });
  const [rejectNote, setRejectNote] = useState("");

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPendingCourses();
      setCourses(data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách khóa học chờ duyệt.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleApprove = async (courseId) => {
    if (!window.confirm("Xác nhận duyệt khóa học này?")) return;
    try {
      setActionLoading(`approve-${courseId}`);
      await approveCourse(courseId);
      toast.success("Duyệt khóa học thành công!");
      loadCourses();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectNote.trim()) {
      toast.error("Vui lòng nhập lý do từ chối.");
      return;
    }
    try {
      setActionLoading(`reject-${rejectModal.courseId}`);
      await rejectCourse(rejectModal.courseId, rejectNote.trim());
      toast.success("Đã từ chối khóa học.");
      setRejectModal({ open: false, courseId: null });
      setRejectNote("");
      loadCourses();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(null);
    }
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
          <h2>Khóa học chờ duyệt</h2>
          <p className="text-muted">Duyệt hoặc từ chối các khóa học do giảng viên gửi lên.</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="admin-courses-empty">
          <i className="bi bi-check2-all"></i>
          <h4>Không có khóa học nào chờ duyệt</h4>
          <p>Tất cả khóa học đã được xử lý.</p>
        </div>
      ) : (
        <div className="admin-courses-table-wrapper">
          <table className="admin-courses-table">
            <thead>
              <tr>
                <th>Khóa học</th>
                <th>Giảng viên</th>
                <th>Giá</th>
                <th>Ngày gửi</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <div className="admin-course-info">
                      <div className="admin-course-thumb">
                        {course.thumbnail_url ? (
                          <img src={course.thumbnail_url} alt={course.title} />
                        ) : (
                          <div className="admin-course-thumb-placeholder">
                            <i className="bi bi-image"></i>
                          </div>
                        )}
                      </div>
                      <div>
                        <strong>{course.title}</strong>
                        <small className="d-block text-muted">
                          {course.description?.substring(0, 80)}...
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>{course.instructor_name}</td>
                  <td>{Number(course.price).toLocaleString("vi-VN")}đ</td>
                  <td>{new Date(course.created_at).toLocaleDateString("vi-VN")}</td>
                  <td>
                    <div className="admin-course-actions">
                      <button
                        className="admin-btn-approve"
                        onClick={() => handleApprove(course.id)}
                        disabled={actionLoading === `approve-${course.id}`}
                      >
                        {actionLoading === `approve-${course.id}` ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          <><i className="bi bi-check-lg"></i> Duyệt</>
                        )}
                      </button>
                      <button
                        className="admin-btn-reject"
                        onClick={() => setRejectModal({ open: true, courseId: course.id })}
                        disabled={actionLoading === `reject-${course.id}`}
                      >
                        <i className="bi bi-x-lg"></i> Từ chối
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="admin-modal-overlay" onClick={() => setRejectModal({ open: false, courseId: null })}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h5>Từ chối khóa học</h5>
              <button className="admin-modal-close" onClick={() => setRejectModal({ open: false, courseId: null })}>
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="course-form-group">
                <label className="course-form-label">
                  Lý do từ chối <span className="text-danger">*</span>
                </label>
                <textarea
                  className="course-form-textarea"
                  rows={4}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Nhập lý do từ chối khóa học..."
                  maxLength={500}
                />
                <small className="text-muted">{rejectNote.length}/500</small>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="course-btn-outline" onClick={() => setRejectModal({ open: false, courseId: null })}>
                Hủy
              </button>
              <button className="admin-btn-reject" onClick={handleReject} disabled={!rejectNote.trim()}>
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPendingCoursesPage;
