import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getInstructorCourseStudents } from "../../services/courseService";

function InstructorCourseStudentsPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getInstructorCourseStudents(courseId);
        setStudents(res?.data?.items || res?.data || res || []);
      } catch (error) {
        toast.error("Không thể tải danh sách học viên.");
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
          <h2>Danh sách học viên</h2>
          <p className="text-muted">Học viên đã đăng ký khóa học này.</p>
        </div>
        <button className="course-btn-outline" onClick={() => navigate(`/instructor/courses/${courseId}`)}>
          <i className="bi bi-arrow-left me-1"></i> Quay lại
        </button>
      </div>

      {students.length === 0 ? (
        <div className="courses-empty">
          <i className="bi bi-people"></i>
          <h4>Chưa có học viên</h4>
          <p>Khóa học chưa có học viên nào đăng ký.</p>
        </div>
      ) : (
        <div className="admin-courses-table-wrapper mt-4">
          <table className="admin-courses-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Ngày đăng ký</th>
                <th>Tiến độ</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.id || index}>
                  <td>{index + 1}</td>
                  <td>{student.get_full_name || student.username || student.email || "N/A"}</td>
                  <td>{student.email || "N/A"}</td>
                  <td>
                    {student.enrolled_at
                      ? new Date(student.enrolled_at).toLocaleDateString("vi-VN")
                      : "N/A"}
                  </td>
                  <td>
                    {student.progress !== undefined ? (
                      <div className="d-flex align-items-center">
                        <div className="progress flex-grow-1 me-2" style={{ height: 8 }}>
                          <div
                            className="progress-bar"
                            style={{ width: `${student.progress}%` }}
                          ></div>
                        </div>
                        <small>{student.progress}%</small>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default InstructorCourseStudentsPage;
