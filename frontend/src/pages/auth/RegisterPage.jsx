import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import InputField from "../../components/auth/InputField";
import { sendRegisterOtp } from "../../services/authService";
import "../../style/auth-css/register.css";

function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await sendRegisterOtp({
        fullName,
        email,
        password,
        confirmPassword,
        acceptedTerms,
      });

      navigate("/register/verify-otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      <main className="register-main">
        <div className="register-card">
          <div className="text-center mb-4">
            <h2 className="register-title">Bắt đầu hành trình học tập</h2>
            <p className="register-subtitle">Tạo tài khoản để truy cập hàng ngàn khóa học chuyên sâu.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <InputField
              label="HỌ VÀ TÊN"
              type="text"
              placeholder="Nguyễn Văn A"
              icon="bi-person"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <InputField
              label="Email"
              type="email"
              placeholder="example@gmail.com"
              icon="bi-envelope"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <InputField
              label="MẬT KHẨU"
              type="password"
              placeholder="•••"
              icon="bi-lock"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <InputField
              label="NHẬP LẠI MẬT KHẨU"
              type="password"
              placeholder="•••"
              icon="bi-lock"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <div className="form-check mb-4">
              <input
                className="form-check-input"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <label className="form-check-label small text-secondary">
                Tôi đồng ý với Điều khoản và Chính sách bảo mật của LMS Learn.
              </label>
            </div>
            <button type="submit" className="btn-register" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
              <i className="bi bi-arrow-right ms-2"></i>
            </button>
          </form>

          <div className="text-center mt-4 small"> Đã có tài khoản?
            <Link to="/login" className="ms-1 fw-semibold text-decoration-none"> Đăng nhập ngay </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default RegisterPage;
