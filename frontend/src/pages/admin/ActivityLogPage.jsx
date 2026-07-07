import { useState, useEffect, useCallback } from "react";
import { getActivityLogsApi, getActivityLogTypesApi } from "../../api/systemAPI";

const ACTION_TYPE_LABELS = {
  USER_LOCK: "Khóa tài khoản",
  USER_UNLOCK: "Mở khóa tài khoản",
  USER_CHANGE_ROLE: "Đổi role",
  ROLE_CREATE: "Tạo role",
  ROLE_UPDATE: "Sửa role",
  ROLE_DELETE: "Xóa role",
  ROLE_PERMISSION_ASSIGN: "Gán quyền cho role",
  DASHBOARD_VIEW: "Xem dashboard",
  COURSE_CREATE: "Tạo khóa học",
  COURSE_UPDATE: "Sửa khóa học",
  COURSE_DELETE: "Xóa khóa học",
  COURSE_PUBLISH: "Xuất bản khóa học",
  COURSE_HIDE: "Ẩn khóa học",
  COURSE_ASSIGN_INSTRUCTOR: "Phân công giảng viên",
  COURSE_REMOVE_INSTRUCTOR: "Gỡ giảng viên",
  LESSON_CREATE: "Tạo bài học/chương/quiz",
  LESSON_UPDATE: "Sửa bài học/chương/quiz",
  LESSON_DELETE: "Xóa bài học/chương/quiz",
  LESSON_REORDER: "Sắp xếp bài học",
  INSTRUCTOR_APPROVE: "Duyệt hồ sơ giảng viên",
  INSTRUCTOR_REJECT: "Từ chối hồ sơ giảng viên",
  SYSTEM_CONFIG_UPDATE: "Cập nhật cấu hình hệ thống",
};

function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionTypes, setActionTypes] = useState([]);
  const [filterType, setFilterType] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getActivityLogsApi({
        action_type: filterType || undefined,
        date: filterDate || undefined,
        page,
        page_size: pageSize,
      });
      const data = result.data || result;
      setLogs(data.results || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterDate, page]);

  const fetchActionTypes = useCallback(async () => {
    try {
      const result = await getActivityLogTypesApi();
      const data = result.data || result;
      setActionTypes(Array.isArray(data) ? data : []);
    } catch (err) {}
  }, []);

  useEffect(() => {
    fetchActionTypes();
  }, [fetchActionTypes]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPage(1);
  }, [filterType, filterDate]);

  const getActionLabel = (type) => ACTION_TYPE_LABELS[type] || type;

  const formatDateTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("vi-VN", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  };

  return (
    <div className="admin-instructor-list-page">
      <div className="inst-page-header">
        <div>
          <h2>Nhật ký hoạt động</h2>
          <p>Lịch sử hoạt động của admin trong hệ thống.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="inst-toolbar">
        <select
          className="inst-search-input"
          style={{ maxWidth: 220, height: 40 }}
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
        >
          <option value="">Tất cả loại</option>
          {actionTypes.map((t) => (
            <option key={t} value={t}>{getActionLabel(t)}</option>
          ))}
        </select>
        <input
          type="date"
          className="inst-search-input"
          style={{ maxWidth: 180, height: 40 }}
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        {(filterType || filterDate) && (
          <button
            className="inst-filter-btn"
            onClick={() => { setFilterType(""); setFilterDate(""); }}
          >
            <i className="bi bi-x-lg"></i> Xóa lọc
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="inst-loading"><div className="spinner-border text-primary" role="status"></div></div>
      ) : logs.length === 0 ? (
        <div className="inst-empty"><p className="text-muted">Không có nhật ký nào.</p></div>
      ) : (
        <>
          <div className="inst-table-wrapper">
            <table className="inst-table">
              <thead>
                <tr>
                  <th style={{ whiteSpace: "nowrap", minWidth: 140 }}>Thời gian</th>
                  <th style={{ whiteSpace: "nowrap", minWidth: 150 }}>Admin</th>
                  <th style={{ whiteSpace: "nowrap", minWidth: 120 }}>Loại</th>
                  <th style={{ whiteSpace: "nowrap", minWidth: 100 }}>Đối tượng</th>
                  <th>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="inst-date-cell">{formatDateTime(log.created_at)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{log.admin_name} ({log.admin_email})</td>
                    <td><span className="inst-badge inst-badge-instructor">{getActionLabel(log.action_type)}</span></td>
                    <td>{log.target_type ? `${log.target_type}#${log.target_id ? log.target_id.substring(0, 8) : ""}` : "—"}</td>
                    <td style={{ whiteSpace: "normal", wordBreak: "break-word", maxWidth: 400 }}>{log.detail || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="inst-table-footer">
            <div className="inst-total-info">Tổng: <strong>{total}</strong> nhật ký</div>
            {totalPages > 1 && (
              <div className="inst-pagination">
                <button className="inst-pagination-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <i className="bi bi-chevron-left"></i>
                </button>
                <span style={{ padding: "0 12px", fontSize: 13 }}>Trang {page}/{totalPages}</span>
                <button className="inst-pagination-btn" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ActivityLogPage;