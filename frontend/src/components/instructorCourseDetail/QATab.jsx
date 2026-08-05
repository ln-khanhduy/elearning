import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getCourseQAApi, replyCourseQAApi } from "../../api/instructorCourseAPI";

function QATab({ courseId }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});
  const [sendingReply, setSendingReply] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getCourseQAApi(courseId);
        setQuestions(res?.data?.questions || []);
      } catch (error) {
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  const handleReply = async (questionId) => {
    const reply = replyText[questionId];
    if (!reply || !reply.trim()) {
      toast.warning("Vui lòng nhập câu trả lời.");
      return;
    }
    setSendingReply(prev => ({ ...prev, [questionId]: true }));
    try {
      await replyCourseQAApi(courseId, questionId, reply.trim());
      toast.success("Đã trả lời câu hỏi!");
      setReplyText(prev => ({ ...prev, [questionId]: "" }));

      // Refresh
      const res = await getCourseQAApi(courseId);
      setQuestions(res?.data?.questions || []);
    } catch (error) {
      toast.error("Không thể gửi câu trả lời.");
    } finally {
      setSendingReply(prev => ({ ...prev, [questionId]: false }));
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

  return (
    <div className="qa-tab">
      <h5 className="mb-3">Hỏi & Đáp / Thảo luận</h5>

      {questions.length === 0 ? (
        <div className="text-center py-4">
          <i className="bi bi-chat-dots fs-1 text-muted"></i>
          <p className="mt-2 text-muted">Chưa có câu hỏi nào từ học viên.</p>
        </div>
      ) : (
        questions.map((q, idx) => (
          <div key={q.id || idx} className="card mb-3">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <strong>{q.student_name || "Học viên"}</strong>
                  <span className="text-muted ms-2 small">{q.created_at ? new Date(q.created_at).toLocaleDateString("vi-VN") : ""}</span>
                </div>
                {q.lesson_title && <span className="badge bg-info">{q.lesson_title}</span>}
              </div>
              <p className="mb-2">{q.content}</p>

              {q.replies && q.replies.length > 0 && (
                <div className="ms-4 mt-2 p-3 bg-light rounded">
                  {q.replies.map((r, rIdx) => (
                    <div key={r.id || rIdx} className="mb-2">
                      <strong className="text-primary">{r.instructor_name || "Giảng viên"}:</strong>
                      <p className="mb-0">{r.content}</p>
                      <small className="text-muted">{r.created_at ? new Date(r.created_at).toLocaleDateString("vi-VN") : ""}</small>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-2 d-flex gap-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Nhập câu trả lời..."
                  value={replyText[q.id] || ""}
                  onChange={(e) => setReplyText(prev => ({ ...prev, [q.id]: e.target.value }))}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleReply(q.id)}
                  disabled={sendingReply[q.id]}
                >
                  {sendingReply[q.id] ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <i className="bi bi-send"></i>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default QATab;