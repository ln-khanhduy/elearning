import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { createRequestApi, getMyRequestsApi } from "../../api/supportAPI";

const REQUEST_TYPE_LABELS = {
  REFUND: "Yêu cầu hoàn tiền",
  TECHNICAL: "Báo cáo kỹ thuật",
  COMPLAINT: "Khiếu nại",
  OTHER: "Khác",
};

const STATUS_LABELS = {
  PENDING: "Chờ xử lý",
  PROCESSING: "Đang xử lý",
  RESOLVED: "Đã giải quyết",
  REJECTED: "Từ chối",
};

const STATUS_CLASSES = {
  PENDING: "badge-warning-bg",
  PROCESSING: "badge-info-bg",
  RESOLVED: "badge-success-bg",
  REJECTED: "badge-danger-bg",
};

function SupportPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    request_type: "TECHNICAL",
    title: "",
    description: "",
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await getMyRequestsApi();
      const data = res?.data ?? res ?? [];
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) {
      toast.warning("Vui lòng nhập nội dung yêu cầu.");
      return;
    }
    try {
      await createRequestApi({
        request_type: form.request_type,
        title: form.title.trim(),
        description: form.description.trim(),
      });
      toast.success("Yêu cầu đã được gửi thành công!");
      setShowForm(false);
      setForm({ request_type: "TECHNICAL", title: "", description: "" });
      loadRequests();
    } catch (err) {
      toast.error(err.message || "Không thể gửi yêu cầu.");
    }
  };

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("vi-VN");
  };

  return (
    <div className="container-center py-4">
      <div className="support-container">
        <div className="support-header">
          <h3>Hỗ trợ & Yêu cầu</h3>
          <button className="support-btn support-btn-primary" onClick={() => setShowForm(!showForm)}>
            <i className="bi bi-plus-lg"></i> Tạo yêu cầu mới
          </button>
        </div>

        {showForm && (
          <div className="support-card">
            <h5>Tạo yêu cầu hỗ trợ</h5>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Loại yêu cầu <span className="text-danger">*</span></label>
                <select
                  className="support-select w-100"
                  value={form.request_type}
                  onChange={(e) => setForm({ ...form, request_type: e.target.value })}
                >
                  {Object.entries(REQUEST_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Tiêu đề</label>
                <input
                  type="text"
                  className="support-input"
                  placeholder="Tiêu đề yêu cầu..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Nội dung <span className="text-danger">*</span></label>
                <textarea
                  className="support-textarea"
                  rows={5}
                  placeholder="Mô tả chi tiết yêu cầu của bạn..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="support-form-actions">
                <button type="button" className="support-btn support-btn-outline" onClick={() => setShowForm(false)}>Hủy</button>
                <button type="submit" className="support-btn support-btn-primary">
                  <i className="bi bi-send"></i> Gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        )}

        <h5 className="support-section-title">Yêu cầu của tôi</h5>
        {loading ? (
          <div className="support-loading">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="support-empty">
            <i className="bi bi-inbox"></i>
            <p>Bạn chưa có yêu cầu nào.</p>
          </div>
        ) : (
          <div>
            {requests.map((req) => (
              <div key={req.id} className="support-list-item">
                <div className="support-list-item-top">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h6>{req.title || REQUEST_TYPE_LABELS[req.request_type]}</h6>
                    <p>{req.description}</p>
                    <div className="support-list-meta">
                      <span>
                        <i className="bi bi-tag"></i>{REQUEST_TYPE_LABELS[req.request_type]}
                      </span>
                      <span>
                        <i className="bi bi-calendar"></i>{formatDate(req.created_at)}
                      </span>
                    </div>
                  </div>
                  <span className={STATUS_CLASSES[req.status] || "badge-secondary-bg"}>
                    {STATUS_LABELS[req.status] || req.status}
                  </span>
                </div>
                {req.resolution_note && (
                  <div className="support-resolution">
                    <strong>Phản hồi:</strong> {req.resolution_note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SupportPage;