import { useState } from "react";
import { toast } from "react-toastify";
import { createStudentQuestionApi } from "../../api/qaAPI";

function CreateQuestionModal({ show, courseId, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!show) return null;

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.warning("Vui lòng nhập tiêu đề.");
      return;
    }
    if (!content.trim()) {
      toast.warning("Vui lòng nhập nội dung.");
      return;
    }
    setSubmitting(true);
    try {
      await createStudentQuestionApi(courseId, {
        title: title.trim(),
        content: content.trim(),
      });
      toast.success("Đã gửi câu hỏi thành công.");
      setTitle("");
      setContent("");
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Đặt câu hỏi mới</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label fw-bold">Tiêu đề</label>
              <input
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tóm tắt câu hỏi của bạn..."
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Nội dung</label>
              <textarea
                className="form-control"
                rows="5"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Mô tả chi tiết câu hỏi..."
              ></textarea>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Đang gửi..." : "Gửi câu hỏi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateQuestionModal;
