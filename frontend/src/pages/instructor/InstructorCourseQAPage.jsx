import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getInstructorQuestionsApi, replyInstructorQuestionApi } from "../../api/qaAPI";
import { getInstructorCourseDetailApi } from "../../api/courseAPI";

const STATUS_LABEL = { OPEN: "Chờ trả lời", ANSWERED: "Đã trả lời", CLOSED: "Đã đóng" };
const STATUS_BADGE = { OPEN: "bg-warning text-dark", ANSWERED: "bg-success", CLOSED: "bg-secondary" };

function QuestionReplyModal({ show, question, onClose, onReplied }) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { courseId } = useParams();
  if (!show) return null;
  const handleSubmit = async () => {
    if (!content.trim()) { toast.warning("Vui lòng nhập nội dung trả lời."); return; }
    setSubmitting(true);
    try {
      await replyInstructorQuestionApi(courseId, question.id, content.trim());
      toast.success("Đã trả lời câu hỏi.");
      setContent("");
      onReplied();
      onClose();
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };
  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Trả lời câu hỏi</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3 p-3 bg-light rounded">
              <strong>{question.student_name}</strong>
              <p className="mb-1 mt-1"><strong>{question.title}</strong></p>
              <p className="mb-0 text-muted">{question.content}</p>
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Nội dung trả lời</label>
              <textarea className="form-control" rows="4" value={content} onChange={e => setContent(e.target.value)} placeholder="Nhập câu trả lời..."></textarea>
            </div>
          </div>
          <div className="modal-footer">
            <button className="qa-modal-btn-secondary" onClick={onClose}>Hủy</button>
            <button className="qa-modal-btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Đang gửi..." : "Gửi trả lời"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InstructorCourseQAPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [replyQuestion, setReplyQuestion] = useState(null);

  const loadCourse = useCallback(async () => {
    try {
      const res = await getInstructorCourseDetailApi(courseId);
      setCourse(res?.data || res);
    } catch (err) { toast.error("Không thể tải thông tin khóa học."); }
  }, [courseId]);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInstructorQuestionsApi(courseId, { status: statusFilter || undefined, page, page_size: 20 });
      const d = res?.data || res;
      setQuestions(d?.questions || []);
      setTotal(d?.total || 0);
      setTotalPages(d?.total_pages || 1);
    } catch (err) { toast.error("Không thể tải danh sách câu hỏi."); }
    finally { setLoading(false); }
  }, [courseId, statusFilter, page]);

  useEffect(() => { loadCourse(); }, [loadCourse]);
  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const handleFilterChange = (newStatus) => { setStatusFilter(newStatus); setPage(1); };

  return (
    <div className="instructor-courses-page">
      <div className="courses-header">
        <div>
          <h2>Hỏi & Đáp</h2>
          <p className="text-muted">{course?.title || "Đang tải..."} — Quản lý câu hỏi từ học viên</p>
        </div>
        <button className="qa-back-btn" onClick={() => navigate(`/instructor/courses/${courseId}`)}>
          <i className="bi bi-arrow-left me-1"></i> Quay lại
        </button>
      </div>
      <div className="mb-3 d-flex gap-2">
        {["", "OPEN", "ANSWERED", "CLOSED"].map(s => (
          <button key={s} className={`qa-filter-btn ${statusFilter === s ? "qa-filter-btn--active" : ""}`}
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
          <p className="text-muted mt-2">Chưa có câu hỏi nào từ học viên.</p>
        </div>
      ) : (
        <>
          <p className="text-muted mb-3">Tổng số: {total} câu hỏi</p>
          {questions.map(q => (
            <div key={q.id} className="card mb-2">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <strong>{q.title}</strong>
                      <span className={`badge ${STATUS_BADGE[q.status]}`}>{STATUS_LABEL[q.status]}</span>
                    </div>
                    <p className="mb-1 text-muted">{q.content}</p>
                    <small className="text-muted">
                      <i className="bi bi-person me-1"></i>{q.student_name}
                      {q.lesson_title && <><span className="mx-2">|</span><i className="bi bi-book me-1"></i>{q.lesson_title}</>}
                      <span className="mx-2">|</span><i className="bi bi-clock me-1"></i>{new Date(q.created_at).toLocaleString("vi-VN")}
                      {q.answer_count > 0 && <><span className="mx-2">|</span><i className="bi bi-chat-text me-1"></i>{q.answer_count} trả lời</>}
                    </small>
                  </div>
                  {q.status !== "CLOSED" && (
                    <button className="qa-reply-btn ms-3" onClick={() => setReplyQuestion(q)}>
                      <i className="bi bi-reply me-1"></i>Trả lời
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {totalPages > 1 && (
            <nav className="mt-3 qa-pagination">
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
      <QuestionReplyModal show={!!replyQuestion} question={replyQuestion} onClose={() => setReplyQuestion(null)} onReplied={loadQuestions} />
    </div>
  );
}
export default InstructorCourseQAPage;