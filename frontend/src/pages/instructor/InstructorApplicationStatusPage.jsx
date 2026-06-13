import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getMyApplication,
  uploadCertificate,
  deleteCertificate,
  getPreviewCertificateUrl,
  getPreviewCvUrl,
} from "../../services/instructorService";

function InstructorApplicationStatusPage() {
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);

  const [loading, setLoading] = useState(true);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [certTitle, setCertTitle] = useState("");
  const [certFile, setCertFile] = useState(null);

  useEffect(() => {
    fetchApplication();
  }, []);

  const fetchApplication = async () => {
    try {
      const app = await getMyApplication();
      setApplication(app);
    } catch (error) {
      toast.error(error.message || "Không thể tải thông tin hồ sơ.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const handleUploadCertificate = async () => {
    if (!application?.id) return;
    if (!certTitle.trim()) {
      toast.error("Vui lòng nhập tên chứng chỉ.");
      return;
    }
    if (!certFile) {
      toast.error("Vui lòng chọn file chứng chỉ.");
      return;
    }

    setUploadingCert(true);
    try {
      await uploadCertificate(application.id, certTitle, certFile);
      toast.success("Tải lên chứng chỉ thành công!");
      setCertTitle("");
      setCertFile(null);
      const fileInput = document.getElementById("certFileInput");
      if (fileInput) fileInput.value = "";
      fetchApplication();
    } catch (error) {
      toast.error(error.message || "Không thể tải lên chứng chỉ.");
    } finally {
      setUploadingCert(false);
    }
  };

  const handleDeleteCertificate = async (certId) => {
    if (!application?.id) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa chứng chỉ này?")) return;

    try {
      await deleteCertificate(application.id, certId);
      toast.success("Xóa chứng chỉ thành công!");
      fetchApplication();
    } catch (error) {
      toast.error(error.message || "Không thể xóa chứng chỉ.");
    }
  };

  if (loading) {
    return (
      <div className="instructor-apply-page">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-2 text-muted">Đang tải thông tin hồ sơ...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="instructor-apply-page">
        <div className="apply-header">
          <h2>Đăng ký trở thành giảng viên</h2>
          <p>Chia sẻ kiến thức và kiếm thu nhập từ khóa học của bạn.</p>
        </div>

        <div className="apply-card text-center py-5">
          <div className="mb-4">
            <i className="bi bi-person-plus" style={{ fontSize: 64, color: "#0e3b69" }}></i>
          </div>
          <h4 className="mb-2">Bạn chưa gửi hồ sơ đăng ký</h4>
          <p className="text-muted mb-4">
            Hãy đăng ký trở thành giảng viên để bắt đầu tạo khóa học và chia sẻ kiến thức.
          </p>
          <button
            className="apply-btn-primary"
            onClick={() => navigate("/instructor/apply")}
          >
            Đăng ký ngay <i className="bi bi-arrow-right ms-2"></i>
          </button>
        </div>
      </div>
    );
  }

  const isPending = application.status === "PENDING";
  const isApproved = application.status === "APPROVED";
  const isRejected = application.status === "REJECTED";

  return (
    <div className="instructor-apply-page">
      <div className="apply-header">
        <h2>Hồ sơ đăng ký giảng viên</h2>
        <p>Trạng thái hồ sơ đăng ký giảng viên của bạn.</p>
      </div>

      <div className={`apply-status-banner ${isPending ? "status-pending" : ""} ${isApproved ? "status-approved" : ""} ${isRejected ? "status-rejected" : ""}`}>
        <div className="apply-status-icon">
          {isPending && <i className="bi bi-hourglass-split"></i>}
          {isApproved && <i className="bi bi-check-circle-fill"></i>}
          {isRejected && <i className="bi bi-x-circle-fill"></i>}
        </div>
        <div className="apply-status-text">
          <h4>
            {isPending && "Hồ sơ đang chờ xét duyệt"}
            {isApproved && "Hồ sơ đã được duyệt"}
            {isRejected && "Hồ sơ bị từ chối"}
          </h4>
          <p>
            {isPending && "Hồ sơ của bạn đã được gửi thành công. Vui lòng chờ admin xét duyệt. Thời gian xử lý thường trong vòng 3-5 ngày làm việc."}
            {isApproved && "Chúc mừng! Hồ sơ của bạn đã được duyệt. Bạn đã chính thức trở thành giảng viên và có thể bắt đầu tạo khóa học."}
            {isRejected && `Hồ sơ của bạn đã bị từ chối. ${application.rejection_reason ? `Lý do: ${application.rejection_reason}` : ""}`}
          </p>
        </div>
      </div>

      <div className="apply-card mt-4">
        <h3 className="apply-card-title">Chi tiết hồ sơ</h3>

        <div className="apply-detail-grid">
          <div className="apply-detail-item">
            <span className="apply-detail-label">Ngày gửi</span>
            <span className="apply-detail-value">{formatDate(application.applied_at)}</span>
          </div>
          <div className="apply-detail-item">
            <span className="apply-detail-label">Trạng thái</span>
            <span className={`apply-detail-badge ${isPending ? "badge-pending" : ""} ${isApproved ? "badge-approved" : ""} ${isRejected ? "badge-rejected" : ""}`}>
              {isPending && "Chờ duyệt"}
              {isApproved && "Đã duyệt"}
              {isRejected && "Từ chối"}
            </span>
          </div>
          {application.reviewed_at && (
            <div className="apply-detail-item">
              <span className="apply-detail-label">Ngày xét duyệt</span>
              <span className="apply-detail-value">{formatDate(application.reviewed_at)}</span>
            </div>
          )}
          {application.rejection_reason && (
            <div className="apply-detail-item full-width">
              <span className="apply-detail-label">Lý do từ chối</span>
              <span className="apply-detail-value text-danger">{application.rejection_reason}</span>
            </div>
          )}
        </div>

        <hr className="apply-divider" />

        <div className="apply-detail-grid">
          <div className="apply-detail-item">
            <span className="apply-detail-label">Giới thiệu bản thân</span>
            <span className="apply-detail-value">{application.bio || "—"}</span>
          </div>
          <div className="apply-detail-item">
            <span className="apply-detail-label">Portfolio</span>
            <span className="apply-detail-value">
              {application.portfolio_link ? (
                <a href={application.portfolio_link} target="_blank" rel="noopener noreferrer">
                  {application.portfolio_link}
                </a>
              ) : "—"}
            </span>
          </div>
          <div className="apply-detail-item">
            <span className="apply-detail-label">CV / Hồ sơ năng lực</span>
            <span className="apply-detail-value">
              {application.cv_file ? (
                <button
                  className="btn btn-link p-0 text-decoration-none"
                  onClick={() => window.open(getPreviewCvUrl(application.id), "_blank")}
                  style={{ color: "#0e3b69", cursor: "pointer" }}
                >
                  <i className="bi bi-eye me-1"></i> Xem trước CV
                </button>
              ) : "—"}
            </span>
          </div>
          <div className="apply-detail-item">
            <span className="apply-detail-label">Số điện thoại</span>
            <span className="apply-detail-value">{application.contact_phone || "—"}</span>
          </div>

          <div className="apply-detail-item">
            <span className="apply-detail-label">Ngân hàng</span>
            <span className="apply-detail-value">{application.bank_name}</span>
          </div>
          <div className="apply-detail-item">
            <span className="apply-detail-label">Số tài khoản</span>
            <span className="apply-detail-value">{application.bank_account_number}</span>
          </div>
          <div className="apply-detail-item">
            <span className="apply-detail-label">Chủ tài khoản</span>
            <span className="apply-detail-value">{application.bank_account_name}</span>
          </div>
        </div>

        {/* Certificates */}
        <hr className="apply-divider" />
        <div className="apply-detail-grid">
          <div className="apply-detail-item full-width">
            <span className="apply-detail-label">Chứng chỉ / Bằng cấp</span>
            <div className="apply-detail-value">
              {application.certificates && application.certificates.length > 0 ? (
                application.certificates.map((cert) => (
                  <div key={cert.id} className="d-flex align-items-center justify-content-between bg-light p-2 rounded mb-2">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-file-earmark-text me-2" style={{ fontSize: 20, color: "#0e3b69" }}></i>
                      <span className="fw-medium">{cert.title}</span>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => window.open(getPreviewCertificateUrl(application.id, cert.id), "_blank")}
                        title="Xem trước"
                      >
                        <i className="bi bi-eye"></i> Xem trước
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteCertificate(cert.id)}
                        title="Xóa"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted mb-0">Chưa có chứng chỉ nào.</p>
              )}

              {/* Upload certificate form */}
              <div className="mt-3 p-3 border rounded bg-white">
                <h6 className="fw-bold mb-2">Thêm chứng chỉ mới</h6>
                <div className="mb-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Tên chứng chỉ (VD: Bằng Thạc sĩ CNTT)"
                    value={certTitle}
                    onChange={(e) => setCertTitle(e.target.value)}
                  />
                </div>
                <div className="mb-2">
                  <input
                    id="certFileInput"
                    type="file"
                    className="form-control form-control-sm"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setCertFile(e.target.files[0])}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-success"
                  onClick={handleUploadCertificate}
                  disabled={uploadingCert}
                >
                  {uploadingCert ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-upload me-1"></i> Tải lên
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {isRejected && (
          <div className="apply-form-actions mt-3">
            <button
              className="apply-btn-primary"
              onClick={() => navigate("/instructor/apply")}
            >
              Gửi lại hồ sơ <i className="bi bi-arrow-repeat ms-2"></i>
            </button>
          </div>
        )}

        {isApproved && (
          <div className="apply-form-actions mt-3">
            <button
              className="apply-btn-primary"
              onClick={() => navigate("/instructor/courses")}
            >
              Bắt đầu tạo khóa học <i className="bi bi-plus-circle ms-2"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default InstructorApplicationStatusPage;
