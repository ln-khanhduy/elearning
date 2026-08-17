import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  getChatReportsApi,
  reviewChatReportApi,
  resolveChatReportApi,
} from "../../api/chatAPI";
import "../../style/chat/admin-chat-reports.css";

const ACTIONS = [
  ["WARNING", "Cảnh cáo"],
  ["LOCK_3D", "Khóa 3 ngày"],
  ["LOCK_7D", "Khóa 1 tuần"],
  ["LOCK_FOREVER", "Khóa vĩnh viễn"],
];

const STATUS = {
  PENDING: "Chờ xử lý",
  REVIEWED: "Đã xác minh",
  RESOLVED: "Đã xử lý",
};

const STATUS_BADGE = {
  PENDING: "acr-badge--pending",
  REVIEWED: "acr-badge--reviewed",
  RESOLVED: "acr-badge--resolved",
};

function AdminChatReportsPage() {
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [resolveTarget, setResolveTarget] = useState(null); // { id, action, label }
  const [resolveNote, setResolveNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (status) => {
    setLoading(true);
    try {
      const res = await getChatReportsApi(status || "", 1, 100);
      const data = res?.data ?? res ?? {};
      setReports(Array.isArray(data.items) ? data.items : []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(statusFilter);
  }, []);

  const act = useCallback(
    async (fn, okMsg) => {
      setBusy(true);
      try {
        await fn();
        toast.success(okMsg);
        load(statusFilter);
      } catch (e) {
        toast.error(e.message || "Lỗi");
      } finally {
        setBusy(null);
      }
    },
    [load, statusFilter]
  );

  const review = (id) => act(() => reviewChatReportApi(id), "Đã xác minh báo cáo.");

  const openResolve = (id, action, label) => {
    setResolveTarget({ id, action, label });
    setResolveNote("");
  };

  const closeResolve = () => {
    if (submitting) return;
    setResolveTarget(null);
    setResolveNote("");
  };

  const submitResolve = async () => {
    if (!resolveTarget) return;
    setSubmitting(true);
    try {
      await resolveChatReportApi(resolveTarget.id, resolveTarget.action, resolveNote.trim());
      toast.success("Đã xử lý báo cáo.");
      setResolveTarget(null);
      setResolveNote("");
      load(statusFilter);
    } catch (e) {
      toast.error(e.message || "Lỗi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="acr-page">
      <div className="acr-header">
        <div>
          <h4 className="acr-title">
            <i className="bi bi-flag-fill"></i>
            Báo cáo vi phạm chat
          </h4>
          <p className="acr-subtitle">
            Xem xét và xử lý các báo cáo vi phạm tin nhắn của người dùng.
          </p>
        </div>
        <select
          className="acr-filter"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            load(e.target.value);
          }}
        >
          <option value="">Tất cả</option>
          <option value="PENDING">Chờ xử lý</option>
          <option value="REVIEWED">Đã xác minh</option>
          <option value="RESOLVED">Đã xử lý</option>
        </select>
      </div>

      {loading ? (
        <div className="acr-empty">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="acr-empty">
          <i className="bi bi-inbox"></i>
          <p className="mb-0">Chưa có báo cáo nào.</p>
        </div>
      ) : (
        <div className="acr-table-wrap">
          <table className="acr-table">
            <thead>
              <tr>
                <th>Người báo cáo</th>
                <th>Người vi phạm</th>
                <th>Nội dung</th>
                <th>Khóa</th>
                <th>Lý do</th>
                <th>Trạng thái</th>
                <th>Xử lý</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td className="acr-user">{r.reporter?.name || "—"}</td>
                  <td className="acr-user">{r.message?.sender?.name || "—"}</td>
                  <td className="acr-content">{r.message?.content || "(voice)"}</td>
                  <td>{r.course_title || "—"}</td>
                  <td className="acr-reason">{r.reason || "—"}</td>
                  <td>
                    <span className={`acr-badge ${STATUS_BADGE[r.status] || "acr-badge--pending"}`}>
                      {STATUS[r.status] || r.status}
                    </span>
                    {r.action_taken && (
                      <div className="acr-action-taken">
                        {ACTIONS.find(([a]) => a === r.action_taken)?.[1]}
                      </div>
                    )}
                  </td>
                  <td>
                    {r.status !== "RESOLVED" ? (
                      <div className="acr-actions">
                        {r.status === "PENDING" && (
                          <button
                            className="acr-btn acr-btn--verify"
                            disabled={busy}
                            onClick={() => review(r.id)}
                          >
                            <i className="bi bi-check2-circle"></i> Xác minh
                          </button>
                        )}
                        {ACTIONS.map(([action, label]) => (
                          <button
                            key={action}
                            className="acr-btn acr-btn--danger"
                            disabled={busy}
                            onClick={() => openResolve(r.id, action, label)}
                          >
                            <i className="bi bi-shield-exclamation"></i> {label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted">Đã xử lý</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal ghi chú xử lý */}
      {resolveTarget && (
        <div className="acr-modal-overlay" onClick={closeResolve}>
          <div className="acr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="acr-modal-header">
              <i className="bi bi-shield-exclamation"></i>
              <span>Xử lý báo cáo — {resolveTarget.label}</span>
              <button
                type="button"
                className="acr-modal-close"
                onClick={closeResolve}
                disabled={submitting}
                aria-label="Đóng"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="acr-modal-body">
              <p className="acr-modal-hint">
                Ghi chú xử lý (tùy chọn):
              </p>
              <textarea
                className="acr-modal-textarea"
                rows={4}
                maxLength={500}
                placeholder="Nhập ghi chú..."
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                autoFocus
              />
            </div>
            <div className="acr-modal-footer">
              <button
                type="button"
                className="acr-modal-cancel"
                onClick={closeResolve}
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="acr-modal-submit"
                onClick={submitResolve}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg me-1"></i> Xác nhận
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminChatReportsPage;