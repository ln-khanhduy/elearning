import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { getInstructorCourseQuizResultsApi } from "../../api/instructorCourseAPI";

function QuizResultsTab({ courseId }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getInstructorCourseQuizResultsApi(courseId);
        setResults(res?.data || res || []);
      } catch (error) {
        toast.error("Không thể tải kết quả bài kiểm tra.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  // Danh sách sinh viên duy nhất cho bộ lọc (tên + email)
  const studentOptions = useMemo(() => {
    const map = new Map();
    results.forEach((r) => {
      const key = r.student_email || r.id;
      if (!map.has(key)) map.set(key, { name: r.student_name || "", email: r.student_email || "" });
    });
    return Array.from(map.values());
  }, [results]);

  // Lọc kết quả theo tên/email chứa chuỗi nhập
  const filteredResults = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return results;
    return results.filter(
      (r) =>
        (r.student_name || "").toLowerCase().includes(q) ||
        (r.student_email || "").toLowerCase().includes(q)
    );
  }, [results, filter]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-4">
        <i className="bi bi-check2-square fs-1 text-muted"></i>
        <p className="mt-2 text-muted">Chưa có học viên nào làm bài kiểm tra.</p>
      </div>
    );
  }

  const formatDate = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "—");

  return (
    <div className="quiz-results-tab">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h5 className="mb-0">Kết quả bài kiểm tra</h5>
        <div className="quiz-results-filter">
          <input
            className="quiz-results-filter-input"
            type="text"
            list="quiz-results-students"
            placeholder="Lọc sinh viên"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <datalist id="quiz-results-students">
            {studentOptions.map((s) => (
              <option key={s.email || s.name} value={s.email || s.name}>{s.name}</option>
            ))}
          </datalist>
        </div>
      </div>

      {filteredResults.length === 0 ? (
        <div className="text-center py-4 text-muted">Không tìm thấy kết quả phù hợp.</div>
      ) : (
      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>#</th>
              <th>Học viên</th>
              <th>Email</th>
              <th>Bài kiểm tra</th>
              <th>Bài học</th>
              <th>Điểm</th>
              <th>Kết quả</th>
              <th>Nộp lúc</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((r, index) => {
              const passed = r.score >= r.passing_score;
              return (
                <tr key={r.id || index}>
                  <td>{index + 1}</td>
                  <td>{r.student_name || "N/A"}</td>
                  <td>{r.student_email || "N/A"}</td>
                  <td>{r.quiz_title || "N/A"}</td>
                  <td>{r.lesson_title || "—"}</td>
                  <td>
                    <strong>{Number(r.score).toFixed(1)}</strong>
                    <small className="text-muted"> / {Number(r.passing_score).toFixed(1)}</small>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        r.status === "GRADED"
                          ? passed
                            ? "bg-success"
                            : "bg-danger"
                          : "bg-warning text-dark"
                      }`}
                    >
                      {r.status === "GRADED" ? (passed ? "Đạt" : "Không đạt") : "Chờ chấm"}
                    </span>
                  </td>
                  <td>{formatDate(r.submitted_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}

export default QuizResultsTab;