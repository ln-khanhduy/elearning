import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  getInstructorApplicationsApi,
  reviewInstructorApplicationApi,
  previewCertificateApi,
  previewCvApi,
} from "../../api/userAPI";

function AdminInstructorApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await getInstructorApplicationsApi(statusFilter);
      setApplications(data);
    } catch (error) {
      toast.error(error.message || "Không thể tải danh sách hồ sơ.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return <span className="app-badge badge-pending">Chờ duyệt</span>;
      case "APPROVED":
        return <span className="app-badge badge-approved">Đã duyệt</span>;
      case "REJECTED":
        return <span className="app-badge badge-rejected">Từ chối</span>;
      default:
        return <span className="app-badge">{status}</span>;
    }
  };

  const openReviewModal = (app, action) => {
    setSelectedApp(app);
    setReviewAction(action);
    setRejectionReason("");
    setShowReviewModal(true);
  };

  const handleReview = async () => {
    if (!selectedApp) return;
    setProcessing(true);

    try {
      await reviewInstructorApplicationApi(selectedApp.id, {
        status: reviewAction,
        rejection_reason: reviewAction === "REJECTED" ? rejectionReason : "",
      });
      toast.success(
        reviewAction === "APPROVED"
          ? "Duyệt hồ sơ giảng viên thành công!"
          : "Đã từ chối hồ sơ giảng viên."
      );
      setShowReviewModal(false);
      setSelectedApp(null);
      fetchApplications();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="admin-applications-page">
      <div className="app-page-header">
        <div>
          <h2>Hồ sơ đăng ký giảng viên</h2>
          <p>Quản lý và xét duyệt hồ sơ đăng ký trở thành giảng viên.</p>
        </div>
      </div>

      <div className="app-filter-tabs">
        <button
          className={`app-filter-btn ${statusFilter === "" ? "active" : ""}`}
          onClick={() => setStatusFilter("")}
        >
          Tất cả ({applications.length})
        </button>
        <button
          className={`app-filter-btn ${statusFilter === "PENDING" ? "active" : ""}`}
          onClick={() => setStatusFilter("PENDING")}
        >
          Chờ duyệt
        </button>
        <button
          className={`app-filter-btn ${statusFilter === "APPROVED" ? "active" : ""}`}
          onClick={() => setStatusFilter("APPROVED")}
        >
          Đã duyệt
        </button>
        <button
          className={`app-filter-btn ${statusFilter === "REJECTED" ? "active" : ""}`}
          onClick={() => setStatusFilter("REJECTED")}
        >
          Từ chối
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-2 text-muted">Đang tải danh sách...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="app-empty">
          <i className="bi bi-inbox" style={{ fontSize: 48, color: "#c3c6d0" }}></i>
          <p className="mt-2 text-muted">Không có hồ sơ nào.</p>
        </div>
      ) : (
        <div className="app-table-wrapper">
          <table className="app-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Họ và tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app, index) => (
                <tr key={app.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="app-user-info">
                      <div className="app-user-avatar">
                        <span className="app-user-initial">
                          {(app.name || app.email || "U").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="app-user-name">
                          {app.name || "Chưa cập nhật"}
                        </div>
                        <div className="app-user-phone">{app.contact_phone || "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td>{app.email || "—"}</td>

                  <td>{app.contact_phone || "—"}</td>
                  <td>{formatDate(app.applied_at)}</td>
                  <td>{getStatusBadge(app.status)}</td>
                  <td>
                    <div className="app-actions">
                      <button
                        className="app-btn-view"
                        title="Xem chi tiết"
                        onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      {app.status === "PENDING" && (
                        <>
                          <button
                            className="app-btn-approve"
                            title="Duyệt"
                            onClick={() => openReviewModal(app, "APPROVED")}
                          >
                            <i className="bi bi-check-lg"></i>
                          </button>
                          <button
                            className="app-btn-reject"
                            title="Từ chối"
                            onClick={() => openReviewModal(app, "REJECTED")}
                          >
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedApp && !showReviewModal && (
        <div className="app-detail-card">
          <div className="app-detail-header">
            <h4>Chi tiết hồ sơ</h4>
            <button className="app-btn-close" onClick={() => setSelectedApp(null)}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <div className="app-detail-body">
            <div className="app-detail-grid">
              <div className="app-detail-field">
                <label>Giới thiệu bản thân</label>
                <p>{selectedApp.bio || "—"}</p>
              </div>
              <div className="app-detail-field">
                <label>Portfolio / GitHub</label>
                <p>
                  {selectedApp.portfolio_link ? (
                    <a href={selectedApp.portfolio_link} target="_blank" rel="noopener noreferrer">
                      {selectedApp.portfolio_link}
                    </a>
                  ) : "—"}
                </p>
              </div>
              <div className="app-detail-field">
                <label>CV / Hồ sơ năng lực</label>
                <p>
                  {selectedApp.cv_file ? (
                    <button
                      className="app-link-file btn btn-link p-0"
                      onClick={() => window.open(getPreviewCvUrl(selectedApp.id), "_blank")}
                    >
                      <i className="bi bi-eye me-1"></i> Xem trước CV
                    </button>
                  ) : "—"}
                </p>
              </div>
              <div className="app-detail-field">
                <label>Số điện thoại liên hệ</label>
                <p>{selectedApp.contact_phone || "—"}</p>
              </div>
              <div className="app-detail-field">
                <label>Tên ngân hàng</label>
                <p>{selectedApp.bank_name}</p>
              </div>
              <div className="app-detail-field">
                <label>Số tài khoản</label>
                <p>{selectedApp.bank_account_number}</p>
              </div>
              <div className="app-detail-field">
                <label>Tên chủ tài khoản</label>
                <p>{selectedApp.bank_account_name}</p>
              </div>
              {selectedApp.rejection_reason && (
                <div className="app-detail-field">
                  <label>Lý do từ chối</label>
                  <p className="text-danger">{selectedApp.rejection_reason}</p>
                </div>
              )}
              {selectedApp.certificates && selectedApp.certificates.length > 0 && (
                <div className="app-detail-field full-width">
                  <label>Chứng chỉ / Bằng cấp</label>
                  <div>
                    {selectedApp.certificates.map((cert) => (
                      <div key={cert.id} className="d-flex align-items-center justify-content-between bg-light p-2 rounded mb-2">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-file-earmark-text me-2" style={{ fontSize: 20, color: "#0e3b69" }}></i>
                          <span className="fw-medium">{cert.title}</span>
                        </div>
                      <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => window.open(getPreviewCertificateUrl(selectedApp.id, cert.id), "_blank")}
                          title="Xem trước"
                        >
                          <i className="bi bi-eye"></i> Xem trước
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showReviewModal && selectedApp && (
        <div className="modal-overlay" onClick={() => !processing && setShowReviewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {reviewAction === "APPROVED" ? "Xác nhận duyệt hồ sơ" : "Từ chối hồ sơ"}
              </h3>
              <button
                className="modal-close"
                onClick={() => !processing && setShowReviewModal(false)}
                disabled={processing}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="modal-body">
              <p className="mb-3">
                {reviewAction === "APPROVED"
                  ? `Bạn có chắc chắn muốn duyệt hồ sơ của "${selectedApp.name || selectedApp.email || ""}"? Người dùng sẽ được cấp quyền giảng viên.`
                  : `Bạn có chắc chắn muốn từ chối hồ sơ của "${selectedApp.name || selectedApp.email || ""}"?`}
              </p>


              {reviewAction === "REJECTED" && (
                <div className="profile-field">
                  <label className="profile-label">LÝ DO TỪ CHỐI <span className="text-danger">*</span></label>
                  <textarea
                    className="profile-input"
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Nhập lý do từ chối hồ sơ..."
                    required
                  />
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="apply-btn-outline"
                onClick={() => setShowReviewModal(false)}
                disabled={processing}
              >
                Hủy
              </button>
              <button
                className={`apply-btn-primary ${reviewAction === "REJECTED" ? "btn-danger" : ""}`}
                onClick={handleReview}
                disabled={processing || (reviewAction === "REJECTED" && !rejectionReason.trim())}
              >
                {processing
                  ? "Đang xử lý..."
                  : reviewAction === "APPROVED"
                  ? "Xác nhận duyệt"
                  : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminInstructorApplicationsPage;
