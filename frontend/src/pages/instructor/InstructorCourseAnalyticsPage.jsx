import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getInstructorCourseAnalytics } from "../../services/courseService";

function InstructorCourseAnalyticsPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getInstructorCourseAnalytics(courseId);
        setAnalytics(res?.data || res);
      } catch (error) {
        toast.error("Không thể tải dữ liệu phân tích.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

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
          <h2>Phân tích khóa học</h2>
          <p className="text-muted">Dữ liệu thống kê về khóa học.</p>
        </div>
        <button className="course-btn-outline" onClick={() => navigate(`/instructor/courses/${courseId}`)}>
          <i className="bi bi-arrow-left me-1"></i> Quay lại
        </button>
      </div>

      <div className="row mt-4">
        <div className="col-md-3 mb-3">
          <div className="card text-center p-4">
            <h3 className="text-primary">{analytics?.total_students || 0}</h3>
            <p className="text-muted mb-0">Tổng học viên</p>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card text-center p-4">
            <h3 className="text-success">{analytics?.average_progress || 0}%</h3>
            <p className="text-muted mb-0">Tiến độ trung bình</p>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card text-center p-4">
            <h3 className="text-warning">{analytics?.completion_rate || 0}%</h3>
            <p className="text-muted mb-0">Tỷ lệ hoàn thành</p>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card text-center p-4">
            <h3 className="text-info">{Number(analytics?.total_revenue || 0).toLocaleString("vi-VN")}đ</h3>
            <p className="text-muted mb-0">Doanh thu</p>
          </div>
        </div>
      </div>

      {analytics?.recent_enrollments && analytics.recent_enrollments.length > 0 && (
        <div className="mt-4">
          <h5>Đăng ký gần đây</h5>
          <div className="admin-courses-table-wrapper mt-2">
            <table className="admin-courses-table">
              <thead>
                <tr>
                  <th>Học viên</th>
                  <th>Ngày đăng ký</th>
                  <th>Tiến độ</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recent_enrollments.map((enrollment, index) => (
                  <tr key={enrollment.id || index}>
                    <td>{enrollment.student_name || enrollment.student?.get_full_name || "N/A"}</td>
                    <td>
                      {enrollment.enrolled_at
                        ? new Date(enrollment.enrolled_at).toLocaleDateString("vi-VN")
                        : "N/A"}
                    </td>
                    <td>{enrollment.progress !== undefined ? `${enrollment.progress}%` : "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default InstructorCourseAnalyticsPage;
