import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getLearningReportApi } from "../../api/instructorCourseAPI";

function LearningReportTab({ courseId }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getLearningReportApi(courseId);
        setReport(res?.data || {});
      } catch (error) {
        setReport({});
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

  return (
    <div className="learning-report-tab">
      <h5 className="mb-3">Báo cáo học tập của lớp</h5>
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card text-center p-3">
            <h3 className="text-primary mb-0">{report.total_students || 0}</h3>
            <small className="text-muted">Tổng học viên</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center p-3">
            <h3 className="text-success mb-0">{report.average_progress || 0}%</h3>
            <small className="text-muted">Tiến độ trung bình</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center p-3">
            <h3 className="text-warning mb-0">{report.completion_rate || 0}%</h3>
            <small className="text-muted">Tỷ lệ hoàn thành</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center p-3">
            <h3 className="text-info mb-0">{report.average_score || 0}</h3>
            <small className="text-muted">Điểm TB bài kiểm tra</small>
          </div>
        </div>
      </div>

      {report.recent_enrollments && report.recent_enrollments.length > 0 && (
        <>
          <h6 className="mb-2">Đăng ký gần đây</h6>
          <div className="table-responsive">
            <table className="table table-sm">
              <thead className="table-light">
                <tr>
                  <th>Học viên</th>
                  <th>Ngày đăng ký</th>
                  <th>Tiến độ</th>
                </tr>
              </thead>
              <tbody>
                {report.recent_enrollments.map((e, idx) => (
                  <tr key={e.id || idx}>
                    <td>{e.student_name || "N/A"}</td>
                    <td>{e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString("vi-VN") : "N/A"}</td>
                    <td>{e.progress !== undefined ? `${Math.round(e.progress)}%` : "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default LearningReportTab;