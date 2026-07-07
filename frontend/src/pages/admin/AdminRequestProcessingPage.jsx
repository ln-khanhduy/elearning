import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getAdminRequestsApi, processRequestApi } from "../../api/supportAPI";

const REQUEST_TYPE_LABELS = {
  REFUND: "Hoàn tiền",
  TECHNICAL: "Kỹ thuật",
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

function AdminRequestProcessingPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [processForm, setProcessForm] = useState({
    status: "RESOLVED",
    resolution_note: "",
  });

  useEffect(() => {
    loadRequests();
  }, [filterType]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = filterType ? { request_type: filterType } : {};
      const res = await getAdminRequestsApi(params);
      const data = res?.data ?? res ?? [];
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (requestId) => {
    if (!processForm.resolution_note.trim()) {
      toast.warning("Vui lòng nhập nội dung phản hồi.");
      return;
    }
    try {
      await processRequestApi(requestId, processForm);
      toast.success("Đã xử lý yêu cầu!");
      setProcessingId(null);
      setProcessForm({ status: "RESOLVED", resolution_note: "" });
      loadRequests();
    } catch (err) {
      toast.error(err.message || "Không thể xử lý yêu cầu.");
    }
  };

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("vi-VN");
  };

  return (
    <div className="container-center py-4">
      <div className="support-container-wide">
        <h3 style={{ marginBottom: 24, fontSize: 22, fontWeight: 600, color: "var(--course-text, #1a1a2e)" }}>Xử lý yêu cầu</h3>

        <div className="support-filter">
          <select
            className="support-select w-100"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Tất cả yêu cầu</option>
            <option value="REFUND">Hoàn tiền</option>
            <option value="TECHNICAL">Kỹ thuật</option>
            <option value="COMPLAINT">Khiếu nại</option>
            <option value="OTHER">Khác</option>
          </select>
        </div>

        {loading ? (
          <div className="support-loading">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="support-empty">
            <i className="bi bi-inbox"></i>
            <p>Không có yêu cầu nào.</p>
          </div>
        ) : (
          <div>
            {requests.map((req) => (
              <div key={req.id} className="support-list-item">
                <div className="support-list-item-top" style={{ marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h6>{req.title || REQUEST_TYPE_LABELS[req.request_type]}</h6>
                    <p>{req.description}</p>
                    <div className="support-list-meta">
                      <span>
                        <i className="bi bi-person"></i>{req.user_name || req.user_email}
                      </span>
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
                  <div className="support-resolution" style={{ marginBottom: 8 }}>
                    <strong>Phản hồi:</strong> {req.resolution_note}
                  </div>
                )}

                {processingId === req.id ? (
                  <div className="support-process-form">
                    <h6>Xử lý yêu cầu</h6>
                    <div className="mb-2">
                      <select
                        className="support-select"
                        style={{ maxWidth: 200 }}
                        value={processForm.status}
                        onChange={(e) => setProcessForm({ ...processForm, status: e.target.value })}
                      >
                        <option value="PROCESSING">Đang xử lý</option>
                        <option value="RESOLVED">Đã giải quyết</option>
                        <option value="REJECTED">Từ chối</option>
                      </select>
                    </div>
                    <div className="mb-2">
                      <textarea
                        className="support-textarea"
                        rows={3}
                        placeholder="Nhập phản hồi..."
                        value={processForm.resolution_note}
                        onChange={(e) => setProcessForm({ ...processForm, resolution_note: e.target.value })}
                      />
                    </div>
                    <div className="support-form-actions">
                      <button className="support-btn support-btn-primary support-btn-sm" onClick={() => handleProcess(req.id)}>
                        <i className="bi bi-check-lg"></i> Xác nhận
                      </button>
                      <button className="support-btn support-btn-outline support-btn-sm" onClick={() => { setProcessingId(null); setProcessForm({ status: "RESOLVED", resolution_note: "" }); }}>
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  req.status !== "RESOLVED" && req.status !== "REJECTED" && (
                    <button
                      className="support-btn support-btn-outline-primary support-btn-sm"
                      onClick={() => setProcessingId(req.id)}
                    >
                      <i className="bi bi-gear"></i> Xử lý
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminRequestProcessingPage;