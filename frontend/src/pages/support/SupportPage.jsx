import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { createRequestApi, getMyRequestsApi, getMyRefundableTransactionsApi } from "../../api/supportAPI";
import { formatDate } from "../../utils/formatDate";

const formatPrice = (val) => {
  if (!val && val !== 0) return "0₫";
  return Number(val).toLocaleString("vi-VN") + "₫";
};

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

// Trang hỗ trợ: tạo yêu cầu hỗ trợ mới và xem danh sách yêu cầu của người dùng hiện tại
function SupportPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    request_type: "TECHNICAL",
    title: "",
    description: "",
    transaction_id: "",
  });
  const [refundableTransactions, setRefundableTransactions] = useState([]);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRefundableTransactions = useCallback(async () => {
    try {
      const res = await getMyRefundableTransactionsApi();
      const data = res?.data ?? res ?? [];
      setRefundableTransactions(Array.isArray(data) ? data : []);
    } catch {
      setRefundableTransactions([]);
    }
  }, []);

  // Tải danh sách yêu cầu hỗ trợ của người dùng từ server
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

  // Gửi yêu cầu hỗ trợ mới lên server
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) {
      toast.warning("Vui lòng nhập nội dung yêu cầu.");
      return;
    }
    if (form.request_type === "REFUND" && !form.transaction_id) {
      toast.warning("Vui lòng chọn giao dịch để hoàn tiền.");
      return;
    }
    try {
      await createRequestApi({
        request_type: form.request_type,
        title: form.title.trim(),
        description: form.description.trim(),
        transaction_id: form.transaction_id || null,
      });
      toast.success("Yêu cầu đã được gửi thành công!");
      setShowForm(false);
      setForm({ request_type: "TECHNICAL", title: "", description: "", transaction_id: "" });
      loadRequests();
    } catch (err) {
      toast.error(err.message || "Không thể gửi yêu cầu.");
    }
  };

  return (
    <div className="container-center py-4">
      <div className="support-container">
        <div className="support-header">
          <h3>Hỗ trợ & Yêu cầu</h3>
          <button className="support-btn support-btn-primary" onClick={() => {
            loadRefundableTransactions();
            setShowForm(!showForm);
          }}>
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
              {form.request_type === "REFUND" && (
                <div className="mb-3">
                  <label className="form-label">Chọn giao dịch hoàn tiền <span className="text-danger">*</span></label>
                  <select
                    className="support-select w-100"
                    value={form.transaction_id}
                    onChange={(e) => setForm({ ...form, transaction_id: e.target.value })}
                  >
                    <option value="">-- Chọn giao dịch --</option>
                    {refundableTransactions.map((tx) => (
                      <option key={tx.id} value={tx.id}>
                        {tx.course_title} - {formatPrice(tx.gross_amount)} ({tx.status})
                      </option>
                    ))}
                  </select>
                  {refundableTransactions.length === 0 && (
                    <small className="text-muted">Bạn chưa có giao dịch nào đủ điều kiện hoàn tiền.</small>
                  )}
                </div>
              )}
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