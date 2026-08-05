import { useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../../api/apiClient";

function SendNotificationTab({ courseId }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim()) {
      toast.warning("Vui lòng nhập tiêu đề thông báo.");
      return;
    }
    if (!body.trim()) {
      toast.warning("Vui lòng nhập nội dung thông báo.");
      return;
    }
    setSending(true);
    try {
      await apiClient.post(`/api/courses/instructor/${courseId}/send-notification/`, {
        title: title.trim(),
        body: body.trim(),
      });
      toast.success("Gửi thông báo thành công!");
      setTitle("");
      setBody("");
    } catch (error) {
      toast.error("Không thể gửi thông báo.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="send-notification-tab">
      <h5 className="mb-3">Gửi thông báo tới học viên</h5>
      <div className="card">
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label fw-bold">Tiêu đề</label>
            <input
              type="text"
              className="form-control"
              placeholder="VD: Thông báo lịch học tuần này"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold">Nội dung</label>
            <textarea
              className="form-control"
              rows="5"
              placeholder="Nhập nội dung thông báo..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            ></textarea>
          </div>
          <button className="course-action-btn btn-publish" onClick={handleSend} disabled={sending}>
            {sending ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                Đang gửi...
              </>
            ) : (
              <>
                <i className="bi bi-send me-1"></i>Gửi thông báo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SendNotificationTab;