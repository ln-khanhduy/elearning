import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getInstructorCourseStudentsApi } from "../../api/instructorCourseAPI";

function StudentListTab({ courseId }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getInstructorCourseStudentsApi(courseId);
        setStudents(res?.data || res || []);
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
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-4">
        <i className="bi bi-people fs-1 text-muted"></i>
        <p className="mt-2 text-muted">Khóa học chưa có học viên nào.</p>
      </div>
    );
  }

  return (
    <div className="student-list-tab">
      <h5 className="mb-3">Danh sách học viên ({students.length})</h5>
      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>#</th>
              <th>Học viên</th>
              <th>Email</th>
              <th>Ngày đăng ký</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={student.id || index}>
                <td>{index + 1}</td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    {student.avatar ? (
                      <img src={student.avatar} alt="" className="rounded-circle" width="28" height="28" style={{ objectFit: "cover" }} />
                    ) : (
                      <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white" style={{ width: 28, height: 28, fontSize: 12 }}>
                        {(student.name || student.email || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span>{student.name || "N/A"}</span>
                  </div>
                </td>
                <td>{student.email || "N/A"}</td>
                <td>{student.enrolled_at ? new Date(student.enrolled_at).toLocaleDateString("vi-VN") : "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StudentListTab;