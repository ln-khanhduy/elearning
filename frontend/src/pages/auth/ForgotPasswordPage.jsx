import InputField from "../../components/common/InputField";

import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { forgotPassword } from "../../services/authService";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await forgotPassword(email);
      navigate('/verify-otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <main className="forgot-main">
        <div className="forgot-card">
          {/* Title */}
          <div className="text-center mb-4">
            <h2 className="forgot-title"> Khôi phục mật khẩu </h2>
            <p className="forgot-subtitle"> Vui lòng nhập email để chúng tôi gửi mã OTP khôi phục </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <InputField label="EMAIL ĐĂNG KÝ" type="email" placeholder="example@gmail.com" icon="bi-envelope"
              value={email} onChange={(e) => setEmail(e.target.value)} />
            <button type="submit" className="btn-forgot" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
              <i className="bi bi-arrow-right ms-2"></i>
            </button>
          </form>
          {/* Back login */}
          <div className="back-login">
            <Link to="/login"> <i className="bi bi-arrow-left me-2"></i> Quay lại màn hình đăng nhập </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ForgotPasswordPage;
