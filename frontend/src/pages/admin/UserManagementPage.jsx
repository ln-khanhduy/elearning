import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { getUsersApi, toggleUserActiveApi } from "../../api/userManagementAPI";

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);
  const [processingId, setProcessingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { id, full_name, is_active }
  const [lockReason, setLockReason] = useState("");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getUsersApi({
        search: search || undefined,
        role: roleFilter,
        status: statusFilter,
        page,
        page_size: pageSize,
      });
      if (!mountedRef.current) return;
      const data = res.data || res;
      setUsers(data.results || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.message || "Không thể tải danh sách người dùng.");
      setUsers([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset về trang 1 khi thay đổi search hoặc filter
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  const handleToggleActive = async () => {
    if (!confirmModal) return;
    const { id, is_active } = confirmModal;

    // Nếu đang active (cần khóa) thì phải có lý do
    if (is_active && !lockReason.trim()) {
      toast.error("Vui lòng nhập lý do khóa tài khoản.");
      return;
    }

    setProcessingId(id);
    try {
      const res = await toggleUserActiveApi(id, is_active ? lockReason.trim() : undefined);
      const data = res.data || res;
      toast.success(data.message || "Thao tác thành công!");
      setConfirmModal(null);
      setLockReason("");
      fetchUsers();
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra.");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const getInitial = (fullName) => {
    return (fullName || "U").charAt(0).toUpperCase();
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "STUDENT":
        return "Học viên";
      case "INSTRUCTOR":
        return "Giảng viên";
      default:
        return role || "—";
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      fetchUsers();
    }
  };

  const openConfirmModal = (user) => {
    setLockReason("");
    setConfirmModal({
      id: user.id,
      full_name: user.full_name,
      is_active: user.is_active,
    });
  };

  const closeConfirmModal = () => {
    if (processingId) return;
    setConfirmModal(null);
    setLockReason("");
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    pages.push(
      <button
        key="prev"
        className="inst-pagination-btn"
        disabled={page <= 1}
        onClick={() => setPage((p) => Math.max(1, p - 1))}
      >
        <i className="bi bi-chevron-left"></i>
      </button>
    );

    if (start > 1) {
      pages.push(
        <button key={1} className="inst-pagination-btn" onClick={() => setPage(1)}>
          1
        </button>
      );
      if (start > 2) {
        pages.push(
          <span key="dots-start" className="inst-pagination-dots">
            ...
          </span>
        );
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          className={`inst-pagination-btn ${i === page ? "active" : ""}`}
          onClick={() => setPage(i)}
        >
          {i}
        </button>
      );
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push(
          <span key="dots-end" className="inst-pagination-dots">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          className="inst-pagination-btn"
          onClick={() => setPage(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    pages.push(
      <button
        key="next"
        className="inst-pagination-btn"
        disabled={page >= totalPages}
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
      >
        <i className="bi bi-chevron-right"></i>
      </button>
    );

    return <div className="inst-pagination">{pages}</div>;
  };

  return (
    <div className="admin-instructor-list-page">
      {/* Header */}
      <div className="inst-page-header">
        <div>
          <h2>Quản lý người dùng</h2>
          <p>Quản lý tài khoản học viên và giảng viên trong hệ thống.</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="inst-toolbar">
        <div className="inst-search-box">
          <i className="bi bi-search inst-search-icon"></i>
          <input
            type="text"
            className="inst-search-input"
            placeholder="Tìm theo tên hoặc email"
            value={search}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
          />
          {search && (
            <button
              className="inst-search-clear"
              onClick={() => setSearch("")}
              title="Xóa tìm kiếm"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>
        <div className="inst-filter-group">
          {/* Role filter */}
          <button
            className={`inst-filter-btn ${roleFilter === "all" ? "active" : ""}`}
            onClick={() => setRoleFilter("all")}
          >
            Tất cả
          </button>
          <button
            className={`inst-filter-btn ${roleFilter === "student" ? "active" : ""}`}
            onClick={() => setRoleFilter("student")}
          >
            Học viên
          </button>
          <button
            className={`inst-filter-btn ${roleFilter === "instructor" ? "active" : ""}`}
            onClick={() => setRoleFilter("instructor")}
          >
            Giảng viên
          </button>
        </div>
        <div className="inst-filter-group">
          {/* Status filter */}
          <button
            className={`inst-filter-btn ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            Tất cả
          </button>
          <button
            className={`inst-filter-btn ${statusFilter === "active" ? "active" : ""}`}
            onClick={() => setStatusFilter("active")}
          >
            Đang hoạt động
          </button>
          <button
            className={`inst-filter-btn ${statusFilter === "locked" ? "active" : ""}`}
            onClick={() => setStatusFilter("locked")}
          >
            Đã khóa
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="inst-loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-2 text-muted">Đang tải danh sách người dùng...</p>
        </div>
      ) : error ? (
        <div className="inst-error">
          <i className="bi bi-exclamation-triangle" style={{ fontSize: 36, color: "#dc3545" }}></i>
          <p className="mt-2 text-danger">{error}</p>
          <button className="inst-retry-btn" onClick={fetchUsers}>
            <i className="bi bi-arrow-clockwise me-1"></i> Thử lại
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="inst-empty">
          <i className="bi bi-people" style={{ fontSize: 48, color: "#c3c6d0" }}></i>
          <p className="mt-2 text-muted">
            {search || roleFilter !== "all" || statusFilter !== "all"
              ? "Không tìm thấy người dùng phù hợp."
              : "Chưa có người dùng nào trong hệ thống."}
          </p>
        </div>
      ) : (
        <>
          <div className="inst-table-wrapper">
            <table className="inst-table">
              <thead>
                <tr>
                  <th>Avatar</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Ngày tham gia</th>
                  <th>Lần đăng nhập cuối</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="inst-user-info">
                        <div className="inst-user-avatar">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" />
                          ) : (
                            <span className="inst-user-initial">
                              {getInitial(user.full_name)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="inst-user-name">{user.full_name}</div>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.phone || "—"}</td>
                    <td>
                      <span className={`inst-badge ${user.role === "INSTRUCTOR" ? "inst-badge-instructor" : "inst-badge-student"}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td>
                      {user.is_active ? (
                        <span className="inst-badge inst-badge-active">Đang hoạt động</span>
                      ) : (
                        <span className="inst-badge inst-badge-locked">Đã khóa</span>
                      )}
                    </td>
                    <td className="inst-date-cell">{formatDate(user.date_joined)}</td>
                    <td className="inst-date-cell">{user.last_login ? formatDate(user.last_login) : "—"}</td>
                    <td>
                      <div className="inst-actions">
                        {user.is_active ? (
                          <button
                            className="inst-btn-lock"
                            onClick={() => openConfirmModal(user)}
                            disabled={processingId === user.id}
                            title="Khóa tài khoản"
                          >
                            {processingId === user.id ? (
                              <span className="spinner-border spinner-border-sm" role="status"></span>
                            ) : (
                              <><i className="bi bi-lock me-1"></i> Khóa</>
                            )}
                          </button>
                        ) : (
                          <button
                            className="inst-btn-unlock"
                            onClick={() => openConfirmModal(user)}
                            disabled={processingId === user.id}
                            title="Mở khóa tài khoản"
                          >
                            {processingId === user.id ? (
                              <span className="spinner-border spinner-border-sm" role="status"></span>
                            ) : (
                              <><i className="bi bi-unlock me-1"></i> Mở khóa</>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Info & Pagination */}
          <div className="inst-table-footer">
            <div className="inst-total-info">
              Tổng số: <strong>{total}</strong> người dùng
            </div>
            {renderPagination()}
          </div>
        </>
      )}

      {/* Confirm Lock Modal - yêu cầu nhập lý do */}
      {confirmModal && confirmModal.is_active && (
        <div className="inst-modal-overlay" onClick={closeConfirmModal}>
          <div className="inst-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="inst-modal-header">
              <h3 className="inst-modal-title">Xác nhận khóa tài khoản</h3>
              <button
                className="inst-modal-close"
                onClick={closeConfirmModal}
                disabled={processingId === confirmModal.id}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="inst-modal-body">
              <p>
                Bạn có chắc muốn khóa tài khoản của{" "}
                <strong>"{confirmModal.full_name}"</strong>?
              </p>
              <div className="inst-modal-field">
                <label className="inst-modal-label">
                  Lý do khóa <span className="text-danger">*</span>
                </label>
                <textarea
                  className="inst-modal-textarea"
                  placeholder="Nhập lý do khóa tài khoản..."
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  rows={3}
                  disabled={processingId === confirmModal.id}
                />
              </div>
            </div>
            <div className="inst-modal-footer">
              <button
                className="inst-btn-cancel"
                onClick={closeConfirmModal}
                disabled={processingId === confirmModal.id}
              >
                Hủy
              </button>
              <button
                className="inst-btn-confirm btn-danger"
                onClick={handleToggleActive}
                disabled={processingId === confirmModal.id || !lockReason.trim()}
              >
                {processingId === confirmModal.id
                  ? "Đang xử lý..."
                  : "Xác nhận khóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Unlock Modal - không cần lý do */}
      {confirmModal && !confirmModal.is_active && (
        <div className="inst-modal-overlay" onClick={closeConfirmModal}>
          <div className="inst-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="inst-modal-header">
              <h3 className="inst-modal-title">Xác nhận mở khóa tài khoản</h3>
              <button
                className="inst-modal-close"
                onClick={closeConfirmModal}
                disabled={processingId === confirmModal.id}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="inst-modal-body">
              <p>
                Bạn có chắc muốn mở khóa tài khoản của{" "}
                <strong>"{confirmModal.full_name}"</strong>?
              </p>
            </div>
            <div className="inst-modal-footer">
              <button
                className="inst-btn-cancel"
                onClick={closeConfirmModal}
                disabled={processingId === confirmModal.id}
              >
                Hủy
              </button>
              <button
                className="inst-btn-confirm btn-success"
                onClick={handleToggleActive}
                disabled={processingId === confirmModal.id}
              >
                {processingId === confirmModal.id
                  ? "Đang xử lý..."
                  : "Xác nhận mở khóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagementPage;
