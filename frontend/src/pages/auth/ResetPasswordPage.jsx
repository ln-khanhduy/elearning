import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import InputField from "../../components/common/InputField";
import { Link, useNavigate } from "react-router-dom";
import { resetPassword } from "../../services/authService";

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const token =location.state?.resetToken;

  useEffect(() => {
  if (!token) {
    navigate(
      "/forgot-password",
      {
        replace: true,
      }
    );
  }
}, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await resetPassword(token, password, confirmPassword);
      alert('Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại.');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page">
      <main className="reset-main">
        <div className="reset-card">
          {/* Title */}
          <div className="text-center mb-4">
            <h2 className="reset-title">Đổi mật khẩu mới</h2>
            <p className="reset-subtitle">Vui lòng nhập mật khẩu mới của bạn bên dưới để tiếp tục. </p>
          </div>
          {/* Error Message */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Password */}
            <InputField label="MẬT KHẨU MỚI" type="password" placeholder="••••••••" icon="bi-lock"
              value={password} onChange={(e) => setPassword(e.target.value)} />
            {/* Confirm password */}
            <InputField label="XÁC NHẬN MẬT KHẨU MỚI" type="password" placeholder="••••••••" icon="bi-lock"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            {/* Button */}
            <button type="submit" className="btn-reset" disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
          </form>
          {/* Back login */}
          <div className="reset-back">
            <Link to="/login"><i className="bi bi-arrow-left me-2"></i> Quay lại đăng nhập </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
export default ResetPasswordPage;
