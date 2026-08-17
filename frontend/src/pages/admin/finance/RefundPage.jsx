import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { getFinanceRefundsApi, processFinanceRefundApi } from "../../../api/supportAPI";
import { formatDate } from "../../../utils/formatDate";
import { formatPrice } from "../../../utils/formatPrice";
import "../../../style/finance/finance-refund.css";
import "../../../style/finance/finance-payout.css";
import "../../../style/payment/payment.css";


const REQUEST_STATUS_LABELS = {
  PENDING: "Chờ duyệt",
  PROCESSING: "Đang xử lý",
  RESOLVED: "Đã hoàn tiền",
  REJECTED: "Từ chối",
};

// Số ngày từ thời điểm thanh toán đến thời điểm gửi đơn yêu cầu hoàn tiền
const getDaysSincePaid = (paidAt, requestCreatedAt) => {
  if (!paidAt) return null;
  const base = requestCreatedAt ? new Date(requestCreatedAt) : new Date();
  const diffMs = base - new Date(paidAt);
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

// Trang Finance duyệt hoàn tiền: xem và duyệt/từ chối yêu cầu hoàn tiền của học viên
function FinanceRefundPage() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [modal, setModal] = useState(null); // { request, action: "RESOLVED" | "REJECTED" }
  const [resolutionNote, setResolutionNote] = useState("");

  const loadRefunds = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getFinanceRefundsApi();
      const data = res?.data ?? res ?? [];
      setRefunds(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message || "Không thể tải danh sách hoàn tiền.");
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadRefunds(); }, [loadRefunds]);

  const openModal = (request, action) => {
    setModal({ request, action });
    setResolutionNote("");
  };

  const handleProcess = async () => {
    if (!modal) return;
    if (!resolutionNote.trim()) {
      toast.warning("Vui lòng nhập nội dung phản hồi.");
      return;
    }
    setProcessingId(modal.request.id);
    try {
      await processFinanceRefundApi(modal.request.id, {
        status: modal.action,
        resolution_note: resolutionNote.trim(),
      });
      toast.success(modal.action === "RESOLVED" ? "Đã duyệt hoàn tiền thành công!" : "Đã từ chối yêu cầu hoàn tiền.");
      setModal(null);
      loadRefunds();
    } catch (err) {
      toast.error(err.message || "Không thể xử lý yêu cầu hoàn tiền.");
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = refunds.filter((r) => r.status === "PENDING" || r.status === "PROCESSING").length;
  const totalRefundAmount = refunds
    .filter((r) => r.status === "PENDING" || r.status === "PROCESSING")
    .reduce((s, r) => s + Number(r.transaction_gross_amount || 0), 0);

  return (
    <div className="container-center py-4">
      <div className="finance-refund-container">
        <h3 className="finance-refund-title">Duyệt hoàn tiền</h3>
        <p className="finance-refund-subtitle">
          Xem và xử lý các yêu cầu hoàn tiền của học viên.
        </p>

        <div className="payout-summary-row">
            <div className="payout-summary-card">
              <div className="finance-refund-summary-icon finance-refund-summary-icon--pending">
                <i className="bi bi-hourglass-split"></i>
              </div>
              <div>
                <div className="payout-summary-label">Yêu cầu chờ duyệt</div>
                <div className="payout-summary-value">{pendingCount}</div>
              </div>
            </div>
            <div className="payout-summary-card">
              <div className="finance-refund-summary-icon finance-refund-summary-icon--amount">
                <i className="bi bi-arrow-counterclockwise"></i>
              </div>
              <div>
                <div className="payout-summary-label">Tổng tiền chờ hoàn</div>
                <div className="payout-summary-value" style={{ color: "#ef4444" }}>{formatPrice(totalRefundAmount)}</div>
              </div>
            </div>
          </div>

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
        ) : refunds.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-inbox" style={{ fontSize: 48 }}></i>
            <p className="mt-2 mb-1">Không có yêu cầu hoàn tiền nào.</p>
          </div>
        ) : (
          <div className="finance-table-wrap">
            <table className="payout-table">
              <thead>
                <tr>
                  <th>Học viên</th>
                  <th>Khóa học</th>
                  <th>Số tiền</th>
                  <th>Ngày thanh toán</th>
                  <th>Lý do</th>
                  <th>Ngày gửi</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.user_name || "—"}</strong>
                      <div className="finance-refund-email">{r.user_email}</div>
                    </td>
                    <td>{r.transaction_course_title || "—"}</td>
                    <td style={{ fontWeight: 600 }}>{formatPrice(r.transaction_gross_amount)}</td>
                    <td>
                      <div>{formatDate(r.transaction_paid_at)}</div>
                      {r.transaction_paid_at && (
                        <small className="text-muted">Tạo: {formatDate(r.transaction_created_at)}</small>
                      )}
                      {r.transaction_paid_at && (
                        <div className="mt-1">
                          <span className={getDaysSincePaid(r.transaction_paid_at, r.created_at) > 7 ? "text-danger fw-semibold" : "text-success"}>
                            {getDaysSincePaid(r.transaction_paid_at, r.created_at)} ngày
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="finance-refund-desc">{r.description}</td>
                    <td>{formatDate(r.created_at)}</td>
                    <td>
                      <span className={`status-badge ${String(r.status || "").toLowerCase()}`}>
                        {REQUEST_STATUS_LABELS[r.status] || r.status}
                      </span>
                    </td>
                    <td>
                      {r.status === "PENDING" || r.status === "PROCESSING" ? (
                        <div className="finance-refund-actions">
                          <button
                            className="payout-btn payout-btn--sm"
                            onClick={() => openModal(r, "RESOLVED")}
                            disabled={processingId === r.id}
                          >
                            <i className="bi bi-check-lg"></i> Duyệt
                          </button>
                          <button
                            className="payout-btn-cancel payout-btn--sm"
                            onClick={() => openModal(r, "REJECTED")}
                            disabled={processingId === r.id}
                          >
                            <i className="bi bi-x-lg"></i> Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted">
                          {r.status === "RESOLVED" ? "Đã xử lý" : r.status === "REJECTED" ? "Đã từ chối" : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal xác nhận */}
      {modal && (
        <div className="payout-modal-overlay" onClick={() => !processingId && setModal(null)}>
          <div className="payout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payout-modal-header">
              <h4>{modal.action === "RESOLVED" ? "Xác nhận duyệt hoàn tiền" : "Xác nhận từ chối hoàn tiền"}</h4>
              <button className="payout-modal-close" onClick={() => !processingId && setModal(null)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="payout-modal-body">
              <div className="payout-modal-info">
                <div><strong>Học viên:</strong> {modal.request.user_name}</div>
                <div><strong>Khóa học:</strong> {modal.request.transaction_course_title || "—"}</div>
                <div className="payout-modal-amount">
                  <strong>Số tiền hoàn:</strong>{" "}
                  <span style={{ color: modal.action === "RESOLVED" ? "#ef4444" : "#16a34a" }}>
                    {formatPrice(modal.request.transaction_gross_amount)}
                  </span>
                </div>
                <div>
                  <strong>Ngày thanh toán:</strong>{" "}
                  {modal.request.transaction_paid_at
                    ? formatDate(modal.request.transaction_paid_at)
                    : "—"}
                </div>
                <div>
                  <strong>Ngày gửi đơn:</strong> {formatDate(modal.request.created_at)}
                </div>
                {modal.request.transaction_paid_at && (
                  <div>
                    <strong>Số ngày thanh toán đến khi gửi đơn:</strong>{" "}
                    <span className={getDaysSincePaid(modal.request.transaction_paid_at, modal.request.created_at) > 7 ? "text-danger fw-semibold" : "text-success"}>
                      {getDaysSincePaid(modal.request.transaction_paid_at, modal.request.created_at)} ngày
                    </span>
                    {getDaysSincePaid(modal.request.transaction_paid_at, modal.request.created_at) > 7 && (
                      <div className="text-danger small mt-1">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        Đã quá 7 ngày kể từ khi thanh toán.
                      </div>
                    )}
                  </div>
                )}
                <div><strong>Lý do học viên:</strong> {modal.request.description}</div>
              </div>
              <div className="payout-modal-confirm">
                <div className="payout-modal-section-title">Phản hồi {modal.action === "RESOLVED" ? "(ghi chú duyệt)" : "(lý do từ chối)"} <span className="text-danger">*</span></div>
                <textarea
                  className="payout-modal-textarea"
                  rows={4}
                  placeholder="Nhập nội dung phản hồi..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  disabled={!!processingId}
                />
                {modal.action === "RESOLVED" && (
                  <div className="finance-refund-warning">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    Hoàn tiền sẽ được thực hiện qua Stripe. Số tiền sẽ bị trừ khỏi balance Stripe.
                  </div>
                )}
              </div>
            </div>
            <div className="payout-modal-footer">
              <button className="payout-btn-cancel" onClick={() => !processingId && setModal(null)} disabled={!!processingId}>Hủy</button>
              <button
                className={modal.action === "RESOLVED" ? "payout-btn" : "payout-btn-cancel"}
                style={modal.action === "REJECTED" ? { borderColor: "#ef4444", color: "#ef4444" } : undefined}
                onClick={handleProcess}
                disabled={!!processingId}
              >
                {processingId ? (
                  <><span className="spinner-border spinner-border-sm me-1"></span> Đang xử lý...</>
                ) : (
                  modal.action === "RESOLVED" ? "Xác nhận hoàn tiền" : "Xác nhận từ chối"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinanceRefundPage;