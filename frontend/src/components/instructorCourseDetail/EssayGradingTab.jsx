import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getEssaySubmissionsApi, gradeEssayApi } from "../../api/instructorCourseAPI";

function EssayGradingTab({ courseId }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradingData, setGradingData] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getEssaySubmissionsApi(courseId);
        setSubmissions(res?.data || []);
      } catch (error) {
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  const handleScoreChange = (answerId, value) => {
    setGradingData(prev => ({ ...prev, [answerId]: value }));
  };

  const handleGrade = async (answerId) => {
    try {
      const score = gradingData[answerId];
      const submission = submissions.find(s => s.answer_id === answerId);
      const maxScore = submission?.max_score || 10;

      if (score === undefined || score === "" || score < 0 || score > maxScore) {
        toast.warning(`Vui lòng nhập điểm hợp lệ (0 đến ${maxScore}).`);
        return;
      }

      await gradeEssayApi(courseId, answerId, parseFloat(score));
      toast.success("Chấm điểm thành công!");
      setSubmissions(prev => prev.map(s =>
        s.answer_id === answerId ? { ...s, status: "GRADED", score: parseFloat(score) } : s
      ));
      setGradingData(prev => {
        const newData = { ...prev };
        delete newData[answerId];
        return newData;
      });
    } catch (err) {
      const errorMessage = err.message || "Không thể chấm điểm. Vui lòng thử lại.";
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  const pendingSubmissions = submissions.filter(s => s.status === "SUBMITTED");
  const gradedSubmissions = submissions.filter(s => s.status === "GRADED");

  const renderSubmission = (sub, idx, isPending) => (
    <div key={sub.answer_id || idx} className={`card mb-3 ${isPending ? "border-warning" : "border-success"}`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <strong>{sub.student_name || "Học viên"}</strong>
            <span className="text-muted ms-2 small">{sub.quiz_title || ""}</span>
          </div>
          {isPending ? (
            <span className="badge bg-warning text-dark">Chờ chấm</span>
          ) : (
            <span className="badge bg-success">Đã chấm: {sub.score}/{sub.max_score || 10}</span>
          )}
        </div>
        <p className="mb-1"><strong>Câu hỏi:</strong> {sub.question_prompt || ""}</p>
        <p className="mb-2"><strong>Câu trả lời:</strong></p>
        <div className="bg-light p-3 rounded mb-2" style={{ whiteSpace: "pre-wrap" }}>
          {sub.answer_text || "Không có câu trả lời"}
        </div>
        {isPending && (
          <div className="d-flex align-items-center gap-2">
            <label className="fw-bold">Điểm:</label>
            <input
              type="number"
              className="form-control form-control-sm"
              style={{ width: 100 }}
              min="0"
              max={sub.max_score || 10}
              step="0.5"
              value={gradingData[sub.answer_id] ?? ""}
              onChange={(e) => handleScoreChange(sub.answer_id, e.target.value)}
              placeholder={`0-${sub.max_score || 10}`}
            />
            <span className="text-muted small">/ {sub.max_score || 10}</span>
            <button className="course-action-btn btn-submit" onClick={() => handleGrade(sub.answer_id)}>
              <i className="bi bi-check-lg me-1"></i>Chấm điểm
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="essay-grading-tab">
      <h5 className="mb-3">Chấm điểm câu hỏi tự luận (Essay)</h5>

      {pendingSubmissions.length > 0 && (
        <>
          <h6 className="text-warning mb-2">
            <i className="bi bi-exclamation-triangle me-1"></i>Chưa chấm ({pendingSubmissions.length})
          </h6>
          {pendingSubmissions.map((sub, idx) => renderSubmission(sub, idx, true))}
        </>
      )}

      {gradedSubmissions.length > 0 && (
        <>
          <h6 className="text-success mb-2 mt-4">
            <i className="bi bi-check-circle me-1"></i>Đã chấm ({gradedSubmissions.length})
          </h6>
          {gradedSubmissions.map((sub, idx) => renderSubmission(sub, idx, false))}
        </>
      )}

      {submissions.length === 0 && (
        <div className="text-center py-4">
          <i className="bi bi-pencil-square fs-1 text-muted"></i>
          <p className="mt-2 text-muted">Chưa có bài tự luận nào cần chấm.</p>
        </div>
      )}
    </div>
  );
}

export default EssayGradingTab;