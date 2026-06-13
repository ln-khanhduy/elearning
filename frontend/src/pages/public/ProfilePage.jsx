import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { GoogleLogin } from "@react-oauth/google";
import { useUser } from "../../context/UserContext";
import { updateProfileApi, changePasswordApi, linkGoogleAccountApi } from "../../api/userAPI";

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

  // ===== State cho modal đổi mật khẩu =====
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // ===== State cho link Google =====
  const [linkingGoogle, setLinkingGoogle] = useState(false);

  // ===== Xử lý link Google =====
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

  // Đổ dữ liệu user vào form
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
      });
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
                <span className={`profile-status-badge ${user.account_status === "ACTIVE" ? "status-active" : "status-locked"}`}>
                  {user.account_status === "ACTIVE" ? "ĐANG HOẠT ĐỘNG" : "ĐÃ KHÓA"}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Google Account */}
          <div className="profile-card">
            <h4 className="profile-card-title">
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--primary)" }}>google</span>
              Google Account
            </h4>
            {user.google_email ? (
              <>
                <p className="profile-card-desc" style={{ marginBottom: 8 }}>
                  <span className="profile-status-badge status-active" style={{ fontSize: 11, marginRight: 8 }}>Đã liên kết</span>
                </p>
                <p className="profile-meta-value" style={{ fontSize: 13, margin: 0 }}>
                  {user.google_email}
                </p>
              </>
            ) : (
              <>
                <p className="profile-card-desc">
                  <span className="profile-status-badge status-locked" style={{ fontSize: 11, marginRight: 8 }}>Chưa liên kết</span>
                </p>
                <p className="profile-card-desc" style={{ fontSize: 13 }}>
                  Liên kết Google Account để đăng ký trở thành giảng viên.
                </p>
                {linkingGoogle ? (
                  <button className="profile-btn-outline" disabled>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Đang liên kết...
                  </button>
                ) : (
                  <GoogleLogin
                    onSuccess={handleGoogleLinkSuccess}
                    onError={handleGoogleLinkError}
                  />
                )}
              </>
            )}
          </div>

          {/* Card: Đăng ký giảng viên (chỉ hiển thị với STUDENT) */}
          {roleCode === "STUDENT" && (
            <div className="profile-card">
              <h4 className="profile-card-title">
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--primary)" }}>school</span>
                Đăng ký giảng viên
              </h4>
              <p className="profile-card-desc">Bạn muốn trở thành giảng viên? Đăng ký ngay để bắt đầu tạo khóa học và chia sẻ kiến thức.</p>
              <button className="profile-btn-outline" onClick={() => navigate("/instructor/apply")}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
                Đăng ký ngay
              </button>
            </div>
          )}

          {/* Card: Trạng thái đăng ký giảng viên (chỉ hiển thị với INSTRUCTOR) */}
          {roleCode === "INSTRUCTOR" && (
            <div className="profile-card">
              <h4 className="profile-card-title">
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--primary)" }}>badge</span>
                Thông tin giảng viên
              </h4>
              <p className="profile-card-desc">Xem trạng thái hồ sơ đăng ký giảng viên và thông tin liên quan.</p>
              <button className="profile-btn-outline" onClick={() => navigate("/instructor/application-status")}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>visibility</span>
                Xem hồ sơ giảng viên
              </button>
            </div>
          )}

        </div>

        {/* === CỘT PHẢI: Form chi tiết cá nhân + Bảo mật === */}
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
