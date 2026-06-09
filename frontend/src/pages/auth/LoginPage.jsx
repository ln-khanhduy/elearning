import InputField from "../../components/auth/InputField";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

import { googleIdTokenLoginApi } from "../../api/authAPI";
import { login } from "../../services/authService";
import { useUser } from "../../context/UserContext";
import { setAccessToken as saveAccessToken } from "../../utils/authToken";

import "../../style/auth-css/login.css";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const navigate = useNavigate();
  const { reloadUser, setUser, setAccessToken } = useUser();

  const isProcessing = loading || googleLoading;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isProcessing) return;

    setError("");
    setLoading(true);

    try {
      const data=await login({ login: email, password });

      saveAccessToken(data.access);
      setAccessToken(data.access);
      if(data.user){
        setUser(data.user);
      }else{
        await reloadUser();
      }
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (isProcessing) return;

    setError("");
    setGoogleLoading(true);

    try {
      const idToken = credentialResponse.credential;

      if (!idToken) {
        throw new Error("Không nhận được mã đăng nhập từ Google.");
      }

      const data = await googleIdTokenLoginApi(idToken);

      saveAccessToken(data.access);
      setAccessToken(data.access);
      setUser(data.user);

      navigate("/home", { replace: true });
    } catch (error) {
      console.error("Google login error:", error);
      setError("Đăng nhập Google thất bại.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setGoogleLoading(false);
    setError("Không thể đăng nhập bằng Google.");
  };

  return (
    <div className="login-page">
      <main className="login-main">
        <div className="login-card">
          <div className="text-center mb-4">
            <h2 className="login-title">Chào mừng trở lại</h2>
            <p className="login-subtitle">
              Đăng nhập để tiếp tục hành trình học tập của bạn
            </p>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {isProcessing && (
            <div className="alert alert-info d-flex align-items-center gap-2">
              <span className="spinner-border spinner-border-sm"></span>
              <span>
                {googleLoading
                  ? "Đang đăng nhập bằng Google, vui lòng chờ..."
                  : "Đang đăng nhập, vui lòng chờ..."}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <InputField
              label="EMAIL HOẶC TÊN ĐĂNG NHẬP"
              type="text"
              placeholder="name@gmail.com"
              icon="bi-person"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isProcessing}
            />

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label fw-semibold mb-0">Mật khẩu</label>
                <Link to="/forgot-password" className="forgot-link small">
                  Quên mật khẩu?
                </Link>
              </div>

              <InputField
                type="password"
                placeholder="••••••••"
                icon="bi-lock"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isProcessing}
              />
            </div>

            <button
              type="submit"
              className="btn-register mb-3"
              disabled={isProcessing}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  Đăng nhập
                  <i className="bi bi-arrow-right ms-2"></i>
                </>
              )}
            </button>

            <div className="login-divider mb-3">
              <span>HOẶC TIẾP TỤC VỚI</span>
            </div>

            {googleLoading ? (
              <button className="btn btn-light w-100 border" disabled>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Đang đăng nhập bằng Google...
              </button>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
              />
            )}
          </form>

          <div className="text-center small login-footer-text">
            Chưa có tài khoản?
            <Link
              to="/register"
              className="fw-semibold text-decoration-none ms-1"
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;