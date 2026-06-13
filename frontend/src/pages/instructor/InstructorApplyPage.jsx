import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useUser } from "../../context/UserContext";
import { linkGoogleAccountApi } from "../../api/userAPI";
import {
  getMyApplication,
  getCertificates,
  deleteCertificate,
  getPreviewCertificateUrl,
  uploadPendingCertificates,
  submitApplication,
} from "../../services/instructorService";

function InstructorApplyPage() {
  const navigate = useNavigate();
  const { user, reloadUser } = useUser();

  // ===== State cho link Google =====
  const [linkingGoogle, setLinkingGoogle] = useState(false);

  const handleGoogleLinkSuccess = async (credentialResponse) => {
    if (linkingGoogle) return;
    setLinkingGoogle(true);

    try {
      const idToken = credentialResponse.credential;
      if (!idToken) {
        throw new Error("Không nhận được mã đăng nhập từ Google.");
      }

      await linkGoogleAccountApi(idToken);
      await reloadUser();
      toast.success("Liên kết Google Account thành công!");
    } catch (error) {
      toast.error(error.message || "Liên kết Google thất bại.");
    } finally {
      setLinkingGoogle(false);
    }
  };

  const handleGoogleLinkError = () => {
    setLinkingGoogle(false);
    toast.error("Không thể liên kết Google Account.");
  };

  // Form state
  const [bio, setBio] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [cvFile, setCvFile] = useState(null);
  const [cvFileName, setCvFileName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);

  // Certificate state
  const [certificates, setCertificates] = useState([]);
  const [certTitle, setCertTitle] = useState("");
  const [certFile, setCertFile] = useState(null);
  const [certFileName, setCertFileName] = useState("");

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [existingApplication, setExistingApplication] = useState(null);
  const fileInputRef = useRef(null);
  const certFileInputRef = useRef(null);
  const tempIdCounter = useRef(0);

  useEffect(() => {
    checkExistingApplication();
  }, []);

  const checkExistingApplication = async () => {
    try {
      const app = await getMyApplication();
      if (app) {
        setExistingApplication(app);
        if (app.status === "REJECTED") {
          loadCertificates(app.id);
        }
      }
    } catch (error) {
      // Không có hồ sơ nào, tiếp tục hiển thị form
    } finally {
      setPageLoading(false);
    }
  };

  const loadCertificates = async (applicationId) => {
    try {
      const data = await getCertificates(applicationId);
      setCertificates(data);
    } catch (error) {
      // Không có chứng chỉ
    }
  };

  const handleCvChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Chỉ chấp nhận file PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Kích thước file tối đa 10MB.");
      return;
    }

    setCvFile(file);
    setCvFileName(file.name);
  };

  const handleCertFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận file ảnh (JPG, PNG) hoặc PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Kích thước file tối đa 10MB.");
      return;
    }

    setCertFile(file);
    setCertFileName(file.name);
  };

  const handleAddCertificate = () => {
    if (!certTitle.trim()) {
      toast.error("Vui lòng nhập tên chứng chỉ.");
      return;
    }
    if (!certFile) {
      toast.error("Vui lòng chọn file chứng chỉ.");
      return;
    }

    const previewUrl = URL.createObjectURL(certFile);
    tempIdCounter.current += 1;

    const newCert = {
      tempId: tempIdCounter.current,
      title: certTitle.trim(),
      file: certFile,
      previewUrl: previewUrl,
    };

    setCertificates((prev) => [...prev, newCert]);
    setCertTitle("");
    setCertFile(null);
    setCertFileName("");
    if (certFileInputRef.current) {
      certFileInputRef.current.value = "";
    }
    toast.success(`Đã thêm chứng chỉ "${newCert.title}"`);
  };

  const handleRemoveTempCertificate = (tempId) => {
    const cert = certificates.find((c) => c.tempId === tempId);
    if (cert && cert.previewUrl) {
      URL.revokeObjectURL(cert.previewUrl);
    }
    setCertificates((prev) => prev.filter((c) => c.tempId !== tempId));
  };

  const handleDeleteCertificate = async (certId) => {
    if (!window.confirm("Bạn có chắc muốn xóa chứng chỉ này?")) return;

    try {
      await deleteCertificate(existingApplication.id, certId);
      setCertificates((prev) => prev.filter((c) => c.id !== certId));
      toast.success("Xóa chứng chỉ thành công.");
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra khi xóa chứng chỉ.");
    }
  };

  const handlePreviewCertificate = (cert) => {
    if (cert.previewUrl) {
      window.open(cert.previewUrl, "_blank");
    } else if (cert.file_url && existingApplication?.id) {
      window.open(getPreviewCertificateUrl(existingApplication.id, cert.id), "_blank");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isTermsAccepted) {
      toast.error("Bạn phải đồng ý với điều khoản hợp tác.");
      return;
    }
    if (!cvFile) {
      toast.error("Vui lòng tải lên CV / hồ sơ năng lực.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("bio", bio);
      formData.append("portfolio_link", portfolioLink);
      formData.append("cv_file", cvFile);
      formData.append("contact_phone", contactPhone);
      formData.append("bank_name", bankName);
      formData.append("bank_account_number", bankAccountNumber);
      formData.append("bank_account_name", bankAccountName);
      formData.append("is_terms_accepted", isTermsAccepted ? "true" : "false");

      const result = await submitApplication(formData);

      const applicationId = result.application?.id;

      // Upload các chứng chỉ local lên server
      const tempCerts = certificates.filter((c) => c.tempId);
      if (tempCerts.length > 0 && applicationId) {
        const { uploadedCount, errors } = await uploadPendingCertificates(applicationId, tempCerts);
        if (uploadedCount > 0) {
          toast.success(`Đã tải lên ${uploadedCount} chứng chỉ thành công!`);
        }
        errors.forEach((err) => {
          toast.error(`Không thể tải chứng chỉ "${err.title}": ${err.message}`);
        });
      }

      toast.success("Gửi hồ sơ đăng ký giảng viên thành công! Vui lòng chờ xét duyệt.");
      navigate("/instructor/application-status", { replace: true });
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra khi gửi hồ sơ.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (!cvFile) {
      toast.error("Vui lòng tải lên CV / hồ sơ năng lực.");
      return;
    }
    if (!contactPhone) {
      toast.error("Vui lòng nhập số điện thoại liên hệ.");
      return;
    }
    setStep(2);
  };

  const prevStep = () => setStep(1);

  if (pageLoading) {
    return (
      <div className="instructor-apply-page">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  if (existingApplication && existingApplication.status !== "REJECTED") {
    return (
      <div className="instructor-apply-page">
        <div className="apply-header">
          <h2>Đăng ký trở thành giảng viên</h2>
          <p>Chia sẻ kiến thức và kiếm thu nhập từ khóa học của bạn.</p>
        </div>

        <div className="apply-card text-center py-5">
          <div className="mb-4">
            <i className="bi bi-info-circle" style={{ fontSize: 64, color: "#0e3b69" }}></i>
          </div>
          <h4 className="mb-2">Bạn đã gửi hồ sơ đăng ký</h4>
          <p className="text-muted mb-4">
            Hồ sơ của bạn đang được xử lý. Bạn có thể theo dõi trạng thái hồ sơ tại trang theo dõi.
          </p>
          <button
            className="apply-btn-primary"
            onClick={() => navigate("/instructor/application-status")}
          >
            Xem trạng thái hồ sơ <i className="bi bi-arrow-right ms-2"></i>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="instructor-apply-page">
      <div className="apply-header">
        <h2>Đăng ký trở thành giảng viên</h2>
        <p>Chia sẻ kiến thức và kiếm thu nhập từ khóa học của bạn.</p>
      </div>

      <div className="apply-steps">
        <div className={`apply-step ${step >= 1 ? "active" : ""}`}>
          <span className="step-number">1</span>
          <span className="step-label">Thông tin chuyên môn</span>
        </div>
        <div className="step-connector"></div>
        <div className={`apply-step ${step >= 2 ? "active" : ""}`}>
          <span className="step-number">2</span>
          <span className="step-label">Thông tin thanh toán</span>
        </div>
      </div>

      {/* Cảnh báo nếu chưa liên kết Google Account */}
      {!user?.google_email && (
        <div className="apply-card" style={{ border: "2px solid #dc3545", marginBottom: 24 }}>
          <div className="text-center py-3">
            <i className="bi bi-google" style={{ fontSize: 48, color: "#dc3545" }}></i>
            <h5 className="mt-3 mb-2" style={{ color: "#dc3545" }}>Cần liên kết Google Account</h5>
            <p className="text-muted mb-3">
              Bạn cần liên kết Google Account trước khi đăng ký giảng viên.
            </p>
            {linkingGoogle ? (
              <button className="apply-btn-primary" disabled>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Đang liên kết...
              </button>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleLinkSuccess}
                onError={handleGoogleLinkError}
              />
            )}
          </div>
        </div>
      )}

      <form className="apply-form" onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="apply-card">
            <h3 className="apply-card-title">Thông tin chuyên môn</h3>

            <div className="apply-field">
              <label className="apply-label">GIỚI THIỆU BẢN THÂN</label>
              <textarea
                className="apply-textarea"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Chia sẻ về kinh nghiệm, chuyên môn và lĩnh vực giảng dạy của bạn..."
              />
            </div>

            <div className="apply-field">
              <label className="apply-label">LINK PORTFOLIO / GITHUB / LINKEDIN</label>
              <input
                type="url"
                className="apply-input"
                value={portfolioLink}
                onChange={(e) => setPortfolioLink(e.target.value)}
                placeholder="https://github.com/your-profile"
              />
            </div>

            <div className="apply-field">
              <label className="apply-label">CV / HỒ SƠ NĂNG LỰC (PDF) <span className="text-danger">*</span></label>
              <div className="apply-file-upload" onClick={() => fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" accept=".pdf" className="d-none" onChange={handleCvChange} />
                <i className="bi bi-cloud-upload"></i>
                <span>{cvFileName || "Nhấp để tải lên file PDF (tối đa 10MB)"}</span>
              </div>
            </div>

            <div className="apply-field">
              <label className="apply-label">SỐ ĐIỆN THOẠI LIÊN HỆ <span className="text-danger">*</span></label>
              <input
                type="tel"
                className="apply-input"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="0901 234 567"
              />
            </div>

            {/* ===== CHỨNG CHỈ ===== */}
            <div className="apply-field">
              <label className="apply-label">CHỨNG CHỈ / BẰNG CẤP</label>
              <p className="text-muted small mb-2">
                Thêm các chứng chỉ, bằng cấp liên quan (ảnh hoặc PDF). Chứng chỉ sẽ được tải lên sau khi bạn gửi hồ sơ.
              </p>

              {certificates.length > 0 && (
                <div className="mb-3">
                  {certificates.map((cert) => (
                    <div key={cert.id || cert.tempId} className="d-flex align-items-center justify-content-between bg-light p-2 rounded mb-2">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-file-earmark-text me-2" style={{ fontSize: 20, color: "#0e3b69" }}></i>
                        <span className="fw-medium">{cert.title}</span>
                        {cert.tempId && (
                          <span className="badge bg-warning text-dark ms-2" style={{ fontSize: 10 }}>Chưa tải lên</span>
                        )}
                      </div>
                      <div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => handlePreviewCertificate(cert)}
                          title="Xem trước"
                        >
                          <i className="bi bi-eye"></i> Xem trước
                        </button>
                        {cert.tempId ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemoveTempCertificate(cert.tempId)}
                            title="Xóa"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteCertificate(cert.id)}
                            title="Xóa"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border rounded p-3 bg-light">
                <div className="mb-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Nhập tên chứng chỉ (VD: Bằng Thạc sĩ CNTT)"
                    value={certTitle}
                    onChange={(e) => setCertTitle(e.target.value)}
                  />
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="apply-file-upload flex-grow-1 mb-0"
                    style={{ padding: "8px 12px", cursor: "pointer" }}
                    onClick={() => certFileInputRef.current?.click()}
                  >
                    <input
                      ref={certFileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="d-none"
                      onChange={handleCertFileChange}
                    />
                    <i className="bi bi-cloud-upload me-1"></i>
                    <small>{certFileName || "Chọn file (JPG, PNG, PDF)"}</small>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleAddCertificate}
                    disabled={!certTitle.trim() || !certFile}
                  >
                    <i className="bi bi-plus-lg"></i> Thêm
                  </button>
                </div>
              </div>
            </div>

            <div className="apply-form-actions">
              <button type="button" className="apply-btn-primary" onClick={nextStep}>
                Tiếp theo <i className="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="apply-card">
            <h3 className="apply-card-title">Thông tin thanh toán</h3>
            <p className="apply-card-desc">Thông tin tài khoản ngân hàng để nhận doanh thu từ khóa học.</p>

            <div className="apply-field">
              <label className="apply-label">TÊN NGÂN HÀNG <span className="text-danger">*</span></label>
              <input
                type="text"
                className="apply-input"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="VD: Vietcombank, Techcombank, MB Bank..."
                required
              />
            </div>

            <div className="apply-field">
              <label className="apply-label">SỐ TÀI KHOẢN <span className="text-danger">*</span></label>
              <input
                type="text"
                className="apply-input"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="VD: 1234567890"
                required
              />
            </div>

            <div className="apply-field">
              <label className="apply-label">TÊN CHỦ TÀI KHOẢN <span className="text-danger">*</span></label>
              <input
                type="text"
                className="apply-input"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                placeholder="VD: NGUYEN VAN A"
                required
              />
            </div>

            <div className="apply-terms">
              <label className="apply-checkbox">
                <input
                  type="checkbox"
                  checked={isTermsAccepted}
                  onChange={(e) => setIsTermsAccepted(e.target.checked)}
                />
                <span>Tôi đã đọc và đồng ý với <strong>Điều khoản hợp tác giảng viên</strong> của LMS Learn.</span>
              </label>
            </div>

            <div className="apply-form-actions">
              <button type="button" className="apply-btn-outline" onClick={prevStep}>
                <i className="bi bi-arrow-left me-2"></i> Quay lại
              </button>
              <button type="submit" className="apply-btn-primary" disabled={loading}>
                {loading ? "Đang gửi..." : "Gửi hồ sơ"}
                <i className="bi bi-send ms-2"></i>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default InstructorApplyPage;
