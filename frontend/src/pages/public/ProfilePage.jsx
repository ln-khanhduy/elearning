import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useUser } from "../../context/UserContext";
import { updateProfileApi, changePasswordApi, uploadInstructorCertificateApi, deleteInstructorCertificateApi } from "../../api/userAPI";

function ProfilePage() {
  const navigate = useNavigate();
  const { user, reloadUser } = useUser();

  // ===== State cho form thông tin cá nhân =====
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // ===== State cho thông tin thanh toán (chỉ instructor) =====
  const [bankData, setBankData] = useState({
    bank_name: "",
    bank_account_number: "",
    bank_account_name: "",
  });
  const [savingBank, setSavingBank] = useState(false);

  // ===== State cho hồ sơ giảng viên (chỉ instructor) =====
  const [instructorData, setInstructorData] = useState({
    bio: "",
    portfolio_link: "",
  });
  const [cvFile, setCvFile] = useState(null);
  const [cvFileName, setCvFileName] = useState("");
  const [savingInstructor, setSavingInstructor] = useState(false);
  const cvFileInputRef = useRef(null);

  // ===== State cho chứng chỉ (chỉ instructor) =====
  const [certificates, setCertificates] = useState([]);
  const [newCertTitle, setNewCertTitle] = useState("");
  const [newCertFile, setNewCertFile] = useState(null);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [deletingCertId, setDeletingCertId] = useState(null);

  // ===== State cho modal đổi mật khẩu =====
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Đổ dữ liệu user vào form
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
      });
      // Đổ thông tin ngân hàng nếu có (chỉ instructor)
      setBankData({
        bank_name: user.bank_name || "",
        bank_account_number: user.bank_account_number || "",
        bank_account_name: user.bank_account_name || "",
      });
      // Đổ thông tin hồ sơ giảng viên nếu có (chỉ instructor)
      setInstructorData({
        bio: user.bio || "",
        portfolio_link: user.portfolio_link || "",
      });
      setCvFileName(user.cv_file ? user.cv_file.split("/").pop() : "");
      // Đổ danh sách chứng chỉ nếu có
      if (user.certificates && Array.isArray(user.certificates)) {
        setCertificates(user.certificates);
      }
    }
  }, [user]);

  // ===== Xử lý chọn ảnh đại diện =====
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Kích thước ảnh tối đa 2MB.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // ===== Xử lý lưu thông tin cá nhân =====
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formPayload = new FormData();
      formPayload.append("first_name", formData.first_name);
      formPayload.append("last_name", formData.last_name);
      formPayload.append("phone", formData.phone);
      if (avatarFile) {
        formPayload.append("avatar", avatarFile);
      }

      await updateProfileApi(formPayload);
      await reloadUser();
      setAvatarFile(null);
      setAvatarPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Cập nhật thông tin thành công!");
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra khi cập nhật.");
    } finally {
      setSaving(false);
    }
  };

  // ===== Xử lý lưu thông tin ngân hàng (chỉ instructor) =====
  const handleSaveBankInfo = async (e) => {
    e.preventDefault();
    setSavingBank(true);

    try {
      // Gửi dưới dạng JSON object (không phải FormData)
      await updateProfileApi({
        bank_name: bankData.bank_name,
        bank_account_number: bankData.bank_account_number,
        bank_account_name: bankData.bank_account_name,
      });
      await reloadUser();
      toast.success("Cập nhật thông tin thanh toán thành công!");
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra khi cập nhật thông tin thanh toán.");
    } finally {
      setSavingBank(false);
    }
  };

  // ===== Xử lý chọn file CV =====
  const handleCvFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCvFile(file);
  };

  // ===== Xử lý lưu hồ sơ giảng viên (chỉ instructor) =====
  const handleSaveInstructorProfile = async (e) => {
    e.preventDefault();
    setSavingInstructor(true);

    try {
      const formPayload = new FormData();
      formPayload.append("bio", instructorData.bio);
      formPayload.append("portfolio_link", instructorData.portfolio_link);
      if (cvFile) {
        formPayload.append("cv_file", cvFile);
      }

      await updateProfileApi(formPayload);
      await reloadUser();
      setCvFile(null);
      if (cvFileInputRef.current) cvFileInputRef.current.value = "";
      toast.success("Cập nhật hồ sơ giảng viên thành công!");
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra khi cập nhật hồ sơ giảng viên.");
    } finally {
      setSavingInstructor(false);
    }
  };

  // ===== Xử lý upload chứng chỉ =====
  const handleUploadCertificate = async () => {
    if (!newCertTitle || !newCertFile) {
      toast.error("Vui lòng nhập tên và chọn file chứng chỉ.");
      return;
    }

    setUploadingCert(true);
    try {
      const formData = new FormData();
      formData.append("title", newCertTitle);
      formData.append("file", newCertFile);

      const result = await uploadInstructorCertificateApi(formData);
      // Reload user để cập nhật danh sách chứng chỉ
      await reloadUser();
      setNewCertTitle("");
      setNewCertFile(null);
      toast.success(result.detail || "Tải lên chứng chỉ thành công!");
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra khi tải lên chứng chỉ.");
    } finally {
      setUploadingCert(false);
    }
  };

  // ===== Xử lý xóa chứng chỉ =====
  const handleDeleteCertificate = async (certId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa chứng chỉ này?")) return;

    setDeletingCertId(certId);
    try {
      await deleteInstructorCertificateApi(certId);
      await reloadUser();
      toast.success("Xóa chứng chỉ thành công!");
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra khi xóa chứng chỉ.");
    } finally {
      setDeletingCertId(null);
    }
  };

  // ===== Xử lý đổi mật khẩu =====
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangingPassword(true);

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Mật khẩu xác nhận không khớp.");
      setChangingPassword(false);
      return;
    }
    if (passwordData.new_password.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      setChangingPassword(false);
      return;
    }

    try {
      await changePasswordApi({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password,
      });
      setPasswordData({ old_password: "", new_password: "", confirm_password: "" });
      setShowPasswordModal(false);
      toast.success("Đổi mật khẩu thành công!");
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra khi đổi mật khẩu.");
    } finally {
      setChangingPassword(false);
    }
  };

  // ===== Helpers =====
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return `${d.getDate()} Th${String(d.getMonth() + 1).padStart(2, "0")}, ${d.getFullYear()}`;
  };

  const getInitial = () => {
    if (user?.first_name) return user.first_name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  const getFullName = () => {
    if (user?.first_name || user?.last_name) {
      return `${user.first_name || ""} ${user.last_name || ""}`.trim();
    }
    return user?.email || "Người dùng";
  };

  // Lấy role code: có thể là string "SUPERADMIN" hoặc object {code: "SUPERADMIN"}
  const getRoleCode = () => {
    if (!user?.role) return null;
    if (typeof user.role === "string") return user.role;
    if (typeof user.role === "object" && user.role?.code) return user.role.code;
    return null;
  };

  const getRoleName = (roleCode) => {
    const roleMap = {
      SUPERADMIN: "SUPER ADMIN",
      COURSE_ADMIN: "QUẢN TRỊ KHÓA HỌC",
      INSTRUCTOR_MANAGER: "QUẢN TRỊ GIẢNG VIÊN",
      USER_MANAGER: "QUẢN TRỊ NGƯỜI DÙNG",
      FINANCE_ADMIN: "QUẢN TRỊ TÀI CHÍNH",
      INSTRUCTOR: "GIẢNG VIÊN",
      STUDENT: "HỌC VIÊN",
    };
    return roleMap[roleCode] || roleCode || "—";
  };

  if (!user) {
    return <div className="profile-loading">Đang tải...</div>;
  }

  const roleCode = getRoleCode();

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <h2 className="profile-title">Thông tin tài khoản</h2>
        <p className="profile-subtitle">Quản lý cài đặt cá nhân và thông tin bảo mật của bạn.</p>
      </div>

      {/* Grid layout: 2 cột */}
      <div className="profile-grid">
        {/* === CỘT TRÁI === */}
        <div className="profile-left">
          {/* Card: Identity */}
          <div className="profile-card">
            <div className="profile-avatar-section">
              <div className="profile-avatar-wrapper">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="profile-avatar-img" />
                ) : user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="profile-avatar-img" />
                ) : (
                  <span className="profile-avatar-placeholder">{getInitial()}</span>
                )}
                <button className="profile-avatar-edit" onClick={() => fileInputRef.current?.click()} title="Đổi ảnh">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="d-none" onChange={handleAvatarChange} />
              </div>
              {avatarPreview && (
                <button className="profile-avatar-cancel" onClick={() => { setAvatarFile(null); setAvatarPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span> Hủy ảnh
                </button>
              )}
            </div>

            <h3 className="profile-name">{getFullName()}</h3>
            <p className="profile-role-label">{getRoleName(roleCode)}</p>

            <div className="profile-meta">
              <div className="profile-meta-item">
                <p className="profile-meta-label">NGÀY THAM GIA</p>
                <p className="profile-meta-value">{formatDate(user.date_joined)}</p>
              </div>
              <div className="profile-meta-item">
                <p className="profile-meta-label">TRẠNG THÁI</p>
                <span className={`profile-status-badge ${user.is_active ? "status-active" : "status-locked"}`}>
                  {user.is_active ? "ĐANG HOẠT ĐỘNG" : "ĐÃ KHÓA"}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Hồ sơ giảng viên (chỉ hiển thị với INSTRUCTOR) */}
          {roleCode === "INSTRUCTOR" && (
            <div className="profile-card">
              <h4 className="profile-card-title">
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--primary)" }}>badge</span>
                Hồ sơ giảng viên
              </h4>
              <p className="profile-card-desc">Cập nhật thông tin hồ sơ giảng viên của bạn để hiển thị trên trang khóa học.</p>

              <form className="profile-form" onSubmit={handleSaveInstructorProfile}>
                <div className="profile-field">
                  <label className="profile-label">MÔ TẢ (BIO)</label>
                  <textarea
                    className="profile-input profile-textarea"
                    value={instructorData.bio}
                    onChange={(e) => setInstructorData({ ...instructorData, bio: e.target.value })}
                    placeholder="Giới thiệu ngắn về bản thân, kinh nghiệm giảng dạy..."
                    rows={4}
                  />
                </div>
                <div className="profile-field">
                  <label className="profile-label">LINK PORTFOLIO</label>
                  <input
                    type="url"
                    className="profile-input"
                    value={instructorData.portfolio_link}
                    onChange={(e) => setInstructorData({ ...instructorData, portfolio_link: e.target.value })}
                    placeholder="https://your-portfolio.com"
                  />
                </div>
                <div className="profile-field">
                  <label className="profile-label">CV / SƠ YẾU LÝ LỊCH</label>
                  <div className="profile-file-upload">
                    <input
                      ref={cvFileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="d-none"
                      onChange={handleCvFileChange}
                    />
                    <button
                      type="button"
                      className="profile-btn-outline profile-btn-file"
                      onClick={() => cvFileInputRef.current?.click()}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>upload_file</span>
                      {cvFile ? cvFile.name : (cvFileName || "Chọn file CV")}
                    </button>
                    {(cvFile || cvFileName) && (
                      <button
                        type="button"
                        className="profile-btn-icon"
                        onClick={() => { setCvFile(null); setCvFileName(""); if (cvFileInputRef.current) cvFileInputRef.current.value = ""; }}
                        title="Xóa file"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="profile-form-actions">
                  <button type="submit" className="profile-btn-primary" disabled={savingInstructor}>
                    {savingInstructor ? "Đang lưu..." : "Lưu hồ sơ giảng viên"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Card: Bảo mật */}
          <div className="profile-card">
            <h4 className="profile-card-title">
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--primary)" }}>security</span>
              Bảo mật
            </h4>
            <p className="profile-card-desc">Mật khẩu của bạn nên được cập nhật định kỳ để đảm bảo an toàn cho tài khoản.</p>
            <button className="profile-btn-outline" onClick={() => setShowPasswordModal(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lock_reset</span>
              Đổi mật khẩu
            </button>
          </div>
        </div>

        {/* === CỘT PHẢI: Form chi tiết cá nhân + Thanh toán + Chứng chỉ === */}
        <div className="profile-right">
          <div className="profile-card">
            <h4 className="profile-card-title">Chi tiết cá nhân</h4>

            <form className="profile-form" onSubmit={handleSaveInfo}>
              <div className="profile-form-row">
                <div className="profile-field">
                  <label className="profile-label">HỌ VÀ TÊN</label>
                  <input
                    type="text"
                    className="profile-input"
                    value={`${formData.last_name} ${formData.first_name}`}
                    onChange={(e) => {
                      const parts = e.target.value.split(" ");
                      const last = parts.shift() || "";
                      const first = parts.join(" ") || "";
                      setFormData({ ...formData, last_name: last, first_name: first });
                    }}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="profile-field">
                  <label className="profile-label">SỐ ĐIỆN THOẠI</label>
                  <input
                    type="tel"
                    className="profile-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0901 234 567"
                  />
                </div>
              </div>

              <div className="profile-field">
                <label className="profile-label">ĐỊA CHỈ EMAIL (KHÔNG THỂ THAY ĐỔI)</label>
                <div className="profile-input-email">
                  <input
                    type="email"
                    className="profile-input"
                    value={user?.email || ""}
                    disabled
                  />
                  <span className="material-symbols-outlined profile-input-icon">lock</span>
                </div>
              </div>

              <div className="profile-form-actions">
                <button type="submit" className="profile-btn-primary" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>

          {/* Card: Thông tin thanh toán (chỉ hiển thị với INSTRUCTOR) */}
          {roleCode === "INSTRUCTOR" && (
            <div className="profile-card">
              <h4 className="profile-card-title">
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--primary)" }}>account_balance</span>
                Thông tin thanh toán
              </h4>
              <p className="profile-card-desc">Cập nhật thông tin tài khoản ngân hàng để nhận thanh toán từ khóa học.</p>

              <form className="profile-form" onSubmit={handleSaveBankInfo}>
                <div className="profile-field">
                  <label className="profile-label">TÊN NGÂN HÀNG</label>
                  <input
                    type="text"
                    className="profile-input"
                    value={bankData.bank_name}
                    onChange={(e) => setBankData({ ...bankData, bank_name: e.target.value })}
                    placeholder="Ví dụ: Vietcombank, Techcombank, ..."
                  />
                </div>
                <div className="profile-field">
                  <label className="profile-label">SỐ TÀI KHOẢN</label>
                  <input
                    type="text"
                    className="profile-input"
                    value={bankData.bank_account_number}
                    onChange={(e) => setBankData({ ...bankData, bank_account_number: e.target.value })}
                    placeholder="Ví dụ: 1234567890"
                  />
                </div>
                <div className="profile-field">
                  <label className="profile-label">CHỦ TÀI KHOẢN</label>
                  <input
                    type="text"
                    className="profile-input"
                    value={bankData.bank_account_name}
                    onChange={(e) => setBankData({ ...bankData, bank_account_name: e.target.value })}
                    placeholder="Ví dụ: NGUYEN VAN A"
                  />
                </div>

                <div className="profile-form-actions">
                  <button type="submit" className="profile-btn-primary" disabled={savingBank}>
                    {savingBank ? "Đang lưu..." : "Lưu thông tin ngân hàng"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Card: Chứng chỉ (chỉ hiển thị với INSTRUCTOR) */}
          {roleCode === "INSTRUCTOR" && (
            <div className="profile-card">
              <h4 className="profile-card-title">
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--primary)" }}>verified</span>
                Chứng chỉ
              </h4>
              <p className="profile-card-desc">Quản lý các chứng chỉ chuyên môn của bạn.</p>

              {/* Danh sách chứng chỉ */}
              {certificates.length > 0 && (
                <div className="profile-cert-list">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="profile-cert-item">
                      <div className="profile-cert-info">
                        <span className="material-symbols-outlined profile-cert-icon">description</span>
                        <div>
                          <p className="profile-cert-title">{cert.title}</p>
                          {cert.file_url && (
                            <a
                              href={cert.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="profile-cert-link"
                            >
                              Xem chứng chỉ
                            </a>
                          )}
                        </div>
                      </div>
                      <button
                        className="profile-btn-icon profile-btn-delete"
                        onClick={() => handleDeleteCertificate(cert.id)}
                        disabled={deletingCertId === cert.id}
                        title="Xóa chứng chỉ"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                          {deletingCertId === cert.id ? "hourglass_top" : "delete"}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {certificates.length === 0 && (
                <p className="profile-empty-text">Chưa có chứng chỉ nào.</p>
              )}

              {/* Form thêm chứng chỉ mới */}
              <div className="profile-cert-add-form">
                <div className="profile-form-row">
                  <div className="profile-field">
                    <label className="profile-label">TÊN CHỨNG CHỈ</label>
                    <input
                      type="text"
                      className="profile-input"
                      value={newCertTitle}
                      onChange={(e) => setNewCertTitle(e.target.value)}
                      placeholder="Ví dụ: Chứng chỉ IELTS 8.0"
                    />
                  </div>
                  <div className="profile-field">
                    <label className="profile-label">FILE CHỨNG CHỈ</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setNewCertFile(e.target.files[0])}
                      className="profile-input profile-input-file"
                    />
                  </div>
                </div>
                <div className="profile-form-actions">
                  <button
                    type="button"
                    className="profile-btn-primary"
                    onClick={handleUploadCertificate}
                    disabled={uploadingCert || !newCertTitle || !newCertFile}
                  >
                    {uploadingCert ? "Đang tải lên..." : "Thêm chứng chỉ"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* === MODAL ĐỔI MẬT KHẨU === */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Cập nhật mật khẩu</h3>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form className="modal-body" onSubmit={handleChangePassword}>
              <div className="profile-field">
                <label className="profile-label">MẬT KHẨU HIỆN TẠI</label>
                <input
                  type="password"
                  className="profile-input"
                  value={passwordData.old_password}
                  onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="profile-field">
                <label className="profile-label">MẬT KHẨU MỚI</label>
                <input
                  type="password"
                  className="profile-input"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <div className="profile-field">
                <label className="profile-label">XÁC NHẬN MẬT KHẨU MỚI</label>
                <input
                  type="password"
                  className="profile-input"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <div className="modal-footer">
                <button type="submit" className="profile-btn-primary w-full" disabled={changingPassword}>
                  {changingPassword ? "Đang xử lý..." : "Xác nhận thay đổi"}
                </button>
                <p className="modal-hint">Mật khẩu phải chứa ít nhất 6 ký tự.</p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
