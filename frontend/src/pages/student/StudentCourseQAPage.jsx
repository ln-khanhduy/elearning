import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getStudentQuestionsApi } from "../../api/qaAPI";
import CreateQuestionModal from "../../components/student/CreateQuestionModal";
import QuestionDetailModal from "../../components/student/QuestionDetailModal";

const STATUS_LABEL = { OPEN: "Chờ trả lời", ANSWERED: "Đã trả lời", CLOSED: "Đã đóng" };
const STATUS_BADGE = { OPEN: "bg-warning text-dark", ANSWERED: "bg-success", CLOSED: "bg-secondary" };

function StudentCourseQAPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [detailQuestionId, setDetailQuestionId] = useState(null);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStudentQuestionsApi(courseId, { status: statusFilter || undefined, page, page_size: 20 });
      const d = res?.data || res;
      setQuestions(d?.questions || []);
      setTotal(d?.total || 0);
      setTotalPages(d?.total_pages || 1);
    } catch (err) { toast.error("Không thể tải danh sách câu hỏi."); }
    finally { setLoading(false); }
  }, [courseId, statusFilter, page]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const handleFilterChange = (newStatus) => { setStatusFilter(newStatus); setPage(1); };

  return (
    <div className="instructor-courses-page">
      <div className="courses-header">
        <div>
          <h2>Hỏi & Đáp</h2>
          <p className="text-muted">Đặt câu hỏi cho giảng viên về khóa học này</p>
        </div>
        <div className="d-flex gap-2">
          <button className="course-btn-outline" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-1"></i> Quay lại
          </button>
          <button className="course-btn-primary" onClick={() => setShowCreate(true)}>
            <i className="bi bi-plus-lg me-1"></i>Đặt câu hỏi
          </button>
        </div>
      </div>
      <div className="mb-3 d-flex gap-2">
        {["", "OPEN", "ANSWERED", "CLOSED"].map(s => (
          <button key={s} className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => handleFilterChange(s)}>
            {s ? STATUS_LABEL[s] : "Tất cả"}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-chat-dots" style={{ fontSize: "3rem", color: "#ccc" }}></i>
          <p className="text-muted mt-2">Chưa có câu hỏi nào.</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <i className="bi bi-plus-lg me-1"></i>Đặt câu hỏi đầu tiên
          </button>
        </div>
      ) : (
        <>
          <p className="text-muted mb-3">Tổng số: {total} câu hỏi</p>
          {questions.map(q => (
            <div key={q.id} className="card mb-2" role="button" onClick={() => setDetailQuestionId(q.id)} style={{ cursor: "pointer" }}>
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <strong>{q.title}</strong>
                  <span className={`badge ${STATUS_BADGE[q.status]}`}>{STATUS_LABEL[q.status]}</span>
                </div>
                <p className="mb-1 text-muted">{q.content}</p>
                <small className="text-muted">
                  <i className="bi bi-clock me-1"></i>{new Date(q.created_at).toLocaleString("vi-VN")}
                  {q.answer_count > 0 && <><span className="mx-2">|</span><i className="bi bi-chat-text me-1"></i>{q.answer_count} trả lời</>}
                  {q.last_answered_at && <><span className="mx-2">|</span>Trả lời gần nhất: {new Date(q.last_answered_at).toLocaleString("vi-VN")}</>}
                </small>
              </div>
            </div>
          ))}
          {totalPages > 1 && (
            <nav className="mt-3">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>Trước</button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <li key={p} className={`page-item ${page === p ? "active" : ""}`}>
                    <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                  </li>
                ))}
                <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Sau</button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}
      <CreateQuestionModal show={showCreate} courseId={courseId} onClose={() => setShowCreate(false)} onCreated={loadQuestions} />
      <QuestionDetailModal show={!!detailQuestionId} questionId={detailQuestionId} courseId={courseId} onClose={() => setDetailQuestionId(null)} onReplied={loadQuestions} />
    </div>
  );
}
export default StudentCourseQAPage;
