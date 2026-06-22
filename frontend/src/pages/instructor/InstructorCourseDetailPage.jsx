import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getInstructorCourseDetail } from "../../services/courseService";

function InstructorCourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getInstructorCourseDetail(courseId);
        setCourse(res?.data || res);
      } catch (error) {
        toast.error("Không thể tải thông tin khóa học.");
        navigate("/instructor/courses");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, navigate]);

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

  if (!course) return null;

  return (
    <div className="instructor-courses-page">
      <div className="courses-header">
        <div>
          <h2>{course.title}</h2>
          <p className="text-muted">Chi tiết khóa học được phân công giảng dạy</p>
        </div>
        <button className="course-btn-outline" onClick={() => navigate("/instructor/courses")}>
          <i className="bi bi-arrow-left me-1"></i> Quay lại
        </button>
      </div>

      <div className="course-form-card mt-4">
        <div className="row">
          <div className="col-md-4">
            {course.thumbnail_url ? (
              <img src={course.thumbnail_url} alt={course.title} className="img-fluid rounded" />
            ) : (
              <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ height: 200 }}>
                <i className="bi bi-image fs-1 text-muted"></i>
              </div>
            )}
          </div>
          <div className="col-md-8">
            <h4>{course.title}</h4>
            <p className="text-muted">{course.description}</p>
            <div className="mt-3">
              <p><strong>Giá:</strong> {Number(course.price).toLocaleString("vi-VN")}đ</p>
              <p><strong>Danh mục:</strong> {course.category_name || course.category || "Chưa phân loại"}</p>
              <p><strong>Trạng thái:</strong> {course.status}</p>
              {course.published_at && (
                <p><strong>Ngày đăng:</strong> {new Date(course.published_at).toLocaleDateString("vi-VN")}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="course-form-actions mt-4">
        <button className="course-btn-outline" onClick={() => navigate("/instructor/courses")}>
          <i className="bi bi-arrow-left me-2"></i>Quay về danh sách
        </button>
        <button
          className="course-btn-primary ms-2"
          onClick={() => navigate(`/instructor/courses/${courseId}/students`)}
        >
          <i className="bi bi-people me-2"></i>Xem học viên
        </button>
        <button
          className="course-btn-primary ms-2"
          onClick={() => navigate(`/instructor/courses/${courseId}/analytics`)}
        >
          <i className="bi bi-graph-up me-2"></i>Xem phân tích
        </button>
      </div>
    </div>
  );
}

export default InstructorCourseDetailPage;
