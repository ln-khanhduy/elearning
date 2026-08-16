import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  getChatReportsApi,
  reviewChatReportApi,
  resolveChatReportApi,
} from "../../api/chatAPI";

const ACTIONS = [
  ["WARNING", "Cảnh cáo"],
  ["LOCK_3D", "Khóa 3 ngày"],
  ["LOCK_7D", "Khóa 1 tuần"],
  ["LOCK_FOREVER", "Khóa vĩnh viễn"],
];

const STATUS = { PENDING: "Chờ xử lý", REVIEWED: "Đã xác minh", RESOLVED: "Đã xử lý" };

function AdminChatReportsPage() {
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = async (status) => {
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
  };

  useEffect(() => {
    load(statusFilter);
  }, []);

  const act = async (fn, okMsg) => {
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
  };

  const review = (id) => act(() => reviewChatReportApi(id), "Đã xác minh báo cáo.");

  const resolve = (id, action) => {
    const note = window.prompt("Ghi chú (tùy chọn):", "") ?? "";
    act(() => resolveChatReportApi(id, action, note), "Đã xử lý báo cáo.");
  };

  return (
    <div className="p-4">
      <h4 className="mb-3"><i className="bi bi-flag me-2"></i>Báo cáo vi phạm chat</h4>
      <select
        className="form-select form-select-sm mb-3"
        style={{ maxWidth: 200 }}
        value={statusFilter}
        onChange={(e) => { setStatusFilter(e.target.value); load(e.target.value); }}
      >
        <option value="">Tất cả</option>
        <option value="PENDING">Chờ xử lý</option>
        <option value="REVIEWED">Đã xác minh</option>
        <option value="RESOLVED">Đã xử lý</option>
      </select>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
      ) : reports.length === 0 ? (
        <div className="text-center py-5 text-muted">Chưa có báo cáo nào.</div>
      ) : (
        <table className="table table-bordered table-hover align-middle">
          <thead className="table-light">
            <tr><th>Người báo cáo</th><th>Người vi phạm</th><th>Nội dung</th><th>Khóa</th><th>Lý do</th><th>Trạng thái</th><th>Xử lý</th></tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id}>
                <td>{r.reporter?.name}</td>
                <td>{r.message?.sender?.name}</td>
                <td className="text-truncate" style={{ maxWidth: 200 }}>{r.message?.content || "(voice)"}</td>
                <td>{r.course_title || "—"}</td>
                <td className="text-truncate" style={{ maxWidth: 160 }}>{r.reason}</td>
                <td>
                  <span className="badge bg-secondary">{STATUS[r.status] || r.status}</span>
                  {r.action_taken && <div className="small text-muted">{ACTIONS.find(([a]) => a === r.action_taken)?.[1]}</div>}
                </td>
                <td>
                  {r.status !== "RESOLVED" && (
                    <div className="d-flex flex-column gap-1">
                      {r.status === "PENDING" && (
                        <button className="btn btn-sm btn-outline-primary" disabled={busy} onClick={() => review(r.id)}>Xác minh</button>
                      )}
                      {ACTIONS.map(([action, label]) => (
                        <button key={action} className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => resolve(r.id, action)}>{label}</button>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminChatReportsPage;