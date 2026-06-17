import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { getManagedInstructorsApi, lockInstructorApi, unlockInstructorApi } from "../../api/instructorManagerAPI";

function InstructorListPage() {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
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

  const fetchInstructors = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getManagedInstructorsApi({
        search: search || undefined,
        status: statusFilter,
        page,
        page_size: pageSize,
      });
      if (!mountedRef.current) return;
      const data = res.data || res;
      setInstructors(data.results || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.message || "Không thể tải danh sách giảng viên.");
      setInstructors([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [search, statusFilter, page, pageSize]);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  // Reset về trang 1 khi thay đổi search hoặc filter
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleLock = async () => {
    if (!confirmModal) return;
    if (!lockReason.trim()) {
      toast.error("Vui lòng nhập lý do khóa tài khoản.");
      return;
    }
    const { id } = confirmModal;
    setProcessingId(id);
    try {
      const res = await lockInstructorApi(id, lockReason.trim());
      const data = res.data || res;
      toast.success(data.message || "Khóa tài khoản thành công!");
      setConfirmModal(null);
      setLockReason("");
      fetchInstructors();
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleUnlock = async () => {
    if (!confirmModal) return;
    const { id } = confirmModal;
    setProcessingId(id);
    try {
      const res = await unlockInstructorApi(id);
      const data = res.data || res;
      toast.success(data.message || "Mở khóa tài khoản thành công!");
      setConfirmModal(null);
      fetchInstructors();
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

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      fetchInstructors();
    }
  };

  const openLockModal = (instructor) => {
    setLockReason("");
    setConfirmModal({
      id: instructor.id,
      full_name: instructor.full_name,
      is_active: instructor.is_active,
    });
  };

  const openUnlockModal = (instructor) => {
    setConfirmModal({
      id: instructor.id,
      full_name: instructor.full_name,
      is_active: instructor.is_active,
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
          <h2>Danh sách giảng viên</h2>
          <p>Quản lý tài khoản giảng viên trong hệ thống.</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="inst-toolbar">
        <div className="inst-search-box">
          <i className="bi bi-search inst-search-icon"></i>
          <input
            type="text"
            className="inst-search-input"
            placeholder="Tìm kiếm theo họ tên hoặc email..."
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
          <p className="mt-2 text-muted">Đang tải danh sách giảng viên...</p>
        </div>
      ) : error ? (
        <div className="inst-error">
          <i className="bi bi-exclamation-triangle" style={{ fontSize: 36, color: "#dc3545" }}></i>
          <p className="mt-2 text-danger">{error}</p>
          <button className="inst-retry-btn" onClick={fetchInstructors}>
            <i className="bi bi-arrow-clockwise me-1"></i> Thử lại
          </button>
        </div>
      ) : instructors.length === 0 ? (
        <div className="inst-empty">
          <i className="bi bi-person-badge" style={{ fontSize: 48, color: "#c3c6d0" }}></i>
          <p className="mt-2 text-muted">
            {search || statusFilter !== "all"
              ? "Không tìm thấy giảng viên phù hợp."
              : "Chưa có giảng viên nào trong hệ thống."}
          </p>
        </div>
      ) : (
        <>
          <div className="inst-table-wrapper">
            <table className="inst-table">
              <thead>
                <tr>
                  <th>Giảng viên</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Trạng thái</th>
                  <th>Ngày tham gia</th>
                  <th>Lần đăng nhập cuối</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {instructors.map((inst) => (
                  <tr key={inst.id}>
                    <td>
                      <div className="inst-user-info">
                        <div className="inst-user-avatar">
                          {inst.avatar_url ? (
                            <img src={inst.avatar_url} alt="" />
                          ) : (
                            <span className="inst-user-initial">
                              {getInitial(inst.full_name)}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="inst-user-name">{inst.full_name}</div>
                        </div>
                      </div>
                    </td>
                    <td>{inst.email}</td>
                    <td>{inst.phone || "—"}</td>
                    <td>
                      {inst.is_active ? (
                        <span className="inst-badge inst-badge-active">Đang hoạt động</span>
                      ) : (
                        <span className="inst-badge inst-badge-locked">Đã khóa</span>
                      )}
                    </td>
                    <td className="inst-date-cell">{formatDate(inst.date_joined)}</td>
                    <td className="inst-date-cell">{inst.last_login ? formatDate(inst.last_login) : "—"}</td>
                    <td>
                      <div className="inst-actions">
                        {inst.is_active ? (
                          <button
                            className="inst-btn-lock"
                            onClick={() => openLockModal(inst)}
                            disabled={processingId === inst.id}
                            title="Khóa tài khoản"
                          >
                            {processingId === inst.id ? (
                              <span className="spinner-border spinner-border-sm" role="status"></span>
                            ) : (
                              <><i className="bi bi-lock me-1"></i> Khóa</>
                            )}
                          </button>
                        ) : (
                          <button
                            className="inst-btn-unlock"
                            onClick={() => openUnlockModal(inst)}
                            disabled={processingId === inst.id}
                            title="Mở khóa tài khoản"
                          >
                            {processingId === inst.id ? (
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
              Tổng số: <strong>{total}</strong> giảng viên
            </div>
            {renderPagination()}
          </div>
        </>
      )}

      {/* Confirm Lock Modal - yêu cầu nhập lý do */}
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
                Bạn có chắc chắn muốn mở khóa tài khoản của giảng viên{" "}
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
                onClick={handleUnlock}
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

      {/* Confirm Unlock Modal - không cần lý do */}
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
                Bạn có chắc chắn muốn khóa tài khoản của giảng viên{" "}
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
                onClick={handleLock}
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
    </div>
  );
}

export default InstructorListPage;
