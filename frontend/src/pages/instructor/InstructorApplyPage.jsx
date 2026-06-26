import { useState, useRef } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { applyInstructorApi } from "../../api/userAPI";

function InstructorApplyPage() {
  const navigate = useNavigate();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);
  const certFileInputRef = useRef(null);

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

  const handleCertificateChange = (e) => {
    const files = Array.from(e.target.files);
    const newCerts = [];

    for (const file of files) {
      if (file.type !== "application/pdf") {
        toast.error(`Chỉ chấp nhận file PDF cho chứng chỉ.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Kích thước file tối đa 10MB.`);
        continue;
      }
      newCerts.push(file);
    }

    setCertificates((prev) => [...prev, ...newCerts]);
    // Reset input để cho phép chọn lại cùng file
    e.target.value = "";
  };

  const removeCertificate = (index) => {
    setCertificates((prev) => prev.filter((_, i) => i !== index));
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
      formData.append("name", name);
      formData.append("email", email);
      formData.append("bio", bio);
      formData.append("portfolio_link", portfolioLink);
      formData.append("cv_file", cvFile);
      formData.append("contact_phone", contactPhone);
      formData.append("bank_name", bankName);
      formData.append("bank_account_number", bankAccountNumber);
      formData.append("bank_account_name", bankAccountName);
      formData.append("is_terms_accepted", isTermsAccepted ? "true" : "false");

      // Thêm chứng chỉ (nếu có)
      certificates.forEach((cert) => {
        formData.append("certificates", cert);
      });

      await applyInstructorApi(formData);

      // Hiển thị thông báo thành công
      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra khi gửi hồ sơ.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập họ và tên.");
      return;
    }
    if (!email.trim()) {
      toast.error("Vui lòng nhập email.");
      return;
    }
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

  // Hiển thị thông báo thành công sau khi submit
  if (submitted) {
    return (
      <div className="instructor-apply-page">
        <div className="apply-header">
          <h2>Đăng ký trở thành giảng viên</h2>
          <p>Chia sẻ kiến thức và kiếm thu nhập từ khóa học của bạn.</p>
        </div>

        <div className="apply-card text-center py-5">
          <div className="mb-4">
            <i className="bi bi-check-circle-fill" style={{ fontSize: 64, color: "#28a745" }}></i>
          </div>
          <h4 className="mb-3">Gửi hồ sơ thành công!</h4>
          <p className="text-muted mb-4" style={{ maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
            Hồ sơ của bạn đã được gửi thành công và đang chờ quản trị viên xét duyệt.
            Thông tin tài khoản sẽ được gửi qua email sau khi hồ sơ được phê duyệt.
          </p>
          <button
            className="apply-btn-primary"
            onClick={() => navigate("/")}
          >
            Về trang chủ <i className="bi bi-house ms-2"></i>
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

      <form className="apply-form" onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="apply-card">
            <h3 className="apply-card-title">Thông tin chuyên môn</h3>

            <div className="apply-field">
              <label className="apply-label">HỌ VÀ TÊN <span className="text-danger">*</span></label>
              <input
                type="text"
                className="apply-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                required
              />
            </div>

            <div className="apply-field">
              <label className="apply-label">EMAIL <span className="text-danger">*</span></label>
              <input
                type="email"
                className="apply-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                required
              />
            </div>

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

            <div className="apply-field">
              <label className="apply-label">CHỨNG CHỈ CHUYÊN MÔN (Tùy chọn)</label>
              <div className="apply-file-upload" onClick={() => certFileInputRef.current?.click()}>
                <input ref={certFileInputRef} type="file" accept=".pdf" className="d-none" multiple onChange={handleCertificateChange} />
                <i className="bi bi-cloud-upload"></i>
                <span>Nhấp để tải lên chứng chỉ (PDF, tối đa 10MB mỗi file)</span>
              </div>
              {certificates.length > 0 && (
                <div className="certificate-list mt-2">
                  {certificates.map((cert, index) => (
                    <div key={index} className="certificate-item d-flex align-items-center justify-content-between p-2 mb-1 bg-light rounded">
                      <span><i className="bi bi-file-earmark-pdf text-danger me-2"></i>{cert.name}</span>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeCertificate(index)}>
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
