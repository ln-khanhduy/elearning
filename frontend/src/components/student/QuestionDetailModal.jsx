import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  getStudentQuestionDetailApi,
  replyStudentQuestionApi,
  closeStudentQuestionApi,
} from "../../api/qaAPI";

const STATUS_LABEL = {
  OPEN: "Chờ trả lời",
  ANSWERED: "Đã trả lời",
  CLOSED: "Đã đóng",
};
const STATUS_BADGE = {
  OPEN: "bg-warning text-dark",
  ANSWERED: "bg-success",
  CLOSED: "bg-secondary",
};

function QuestionDetailModal({ show, questionId, courseId, onClose, onReplied }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!questionId) return;
    setLoading(true);
    try {
      const res = await getStudentQuestionDetailApi(courseId, questionId);
      setDetail(res?.data || res);
    } catch (err) {
      toast.error("Không thể tải chi tiết câu hỏi.");
    } finally {
      setLoading(false);
    }
  }, [courseId, questionId]);

  useEffect(() => {
    if (show) loadDetail();
  }, [show, loadDetail]);

  if (!show) return null;

  const handleReply = async () => {
    if (!replyContent.trim()) {
      toast.warning("Vui lòng nhập nội dung.");
      return;
    }
    setSubmitting(true);
    try {
      await replyStudentQuestionApi(courseId, questionId, replyContent.trim());
      toast.success("Đã gửi câu trả lời.");
      setReplyContent("");
      loadDetail();
      onReplied();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (!window.confirm("Bạn có chắc muốn đóng câu hỏi này?")) return;
    try {
      await closeStudentQuestionApi(courseId, questionId);
      toast.success("Đã đóng câu hỏi.");
      loadDetail();
      onReplied();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Chi tiết câu hỏi</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {loading ? (
              <div className="text-center py-3">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
              </div>
            ) : detail ? (
              <>
                <div className="p-3 bg-light rounded mb-3">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <strong>{detail.title}</strong>
                    <span className={`badge ${STATUS_BADGE[detail.status]}`}>
                      {STATUS_LABEL[detail.status]}
                    </span>
                  </div>
                  <p className="mb-0 text-muted">{detail.content}</p>
                  <small className="text-muted">
                    <i className="bi bi-person me-1"></i>
                    {detail.student_name}
                    <span className="mx-2">|</span>
                    <i className="bi bi-clock me-1"></i>
                    {new Date(detail.created_at).toLocaleString("vi-VN")}
                  </small>
                </div>

                {detail.answers && detail.answers.length > 0 && (
                  <div className="mb-3">
                    <h6 className="fw-bold mb-2">
                      {detail.answers.length} câu trả lời
                    </h6>
                    {detail.answers.map((a) => (
                      <div
                        key={a.id}
                        className={`p-3 rounded mb-2 ${
                          a.is_instructor
                            ? "bg-primary bg-opacity-10 border-start border-primary border-3"
                            : "bg-light"
                        }`}
                      >
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <strong>{a.author_name}</strong>
                          {a.is_instructor && (
                            <span className="badge bg-primary">Giảng viên</span>
                          )}
                          <small className="text-muted ms-auto">
                            {new Date(a.created_at).toLocaleString("vi-VN")}
                          </small>
                        </div>
                        <p className="mb-0">{a.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {detail.status !== "CLOSED" && (
                  <div className="border-top pt-3">
                    <label className="form-label fw-bold">
                      Trả lời / Hỏi thêm
                    </label>
                    <textarea
                      className="form-control mb-2"
                      rows="3"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Nhập nội dung..."
                    ></textarea>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={handleReply}
                        disabled={submitting}
                      >
                        {submitting ? "Đang gửi..." : "Gửi"}
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={handleClose}
                      >
                        <i className="bi bi-lock me-1"></i>Đóng câu hỏi
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted">Không tìm thấy câu hỏi.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuestionDetailModal;
