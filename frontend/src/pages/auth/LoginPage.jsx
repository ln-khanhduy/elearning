import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import InputField from "../../components/auth/InputField";
import {  useState } from "react";
import { Link,  useNavigate } from "react-router-dom";
import { googleLoginUrl } from "../../api/authAPI";
import { login } from "../../services/authService";
import "../../style/auth-css/login.css";
import { useAuth } from "../../context/UserContext";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { reloadUser } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ login: email, password });
      await reloadUser();
      navigate('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Header />
      <main className="login-main">
        <div className="login-card">
          {/* Title */}
          <div className="text-center mb-4">
            <h2 className="login-title"> Chào mừng trở lại </h2>
            <p className="login-subtitle"> Đăng nhập để tiếp tục hành trình học tập của bạn </p>
          </div>
          {/* Error Message */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Username / Email */}
            <InputField
              label="EMAIL HOẶC TÊN ĐĂNG NHẬP"
              type="text"
              placeholder="name@gmail.com"
              icon="bi-person"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {/* Password */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label fw-semibold mb-0"> Mật khẩu </label>
                <Link to="/forgot-password" className="forgot-link small"> Quên mật khẩu? </Link>
              </div>
              <InputField
                type="password"
                placeholder="••••••••"
                icon="bi-lock"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {/* Button */}
            <button type="submit" className="btn-register mb-3" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              <i className="bi bi-arrow-right ms-2"></i>
            </button>
            <div className="login-divider mb-3">
              <span>HOẶC TIẾP TỤC VỚI</span>
            </div>
            {/* Google */}
            <button
              type="button"
              className="btn btn-outline-secondary btn-google w-100 mb-3"
              onClick={() => {
                window.location.href = googleLoginUrl;
              }}
            >
              <i className="bi bi-google me-2"></i> Google
            </button>
          </form>
          {/* Footer */}
          <div className="text-center small login-footer-text">Chưa có tài khoản?
            <Link to="/register" className="fw-semibold text-decoration-none ms-1" > Đăng ký ngay </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default LoginPage;