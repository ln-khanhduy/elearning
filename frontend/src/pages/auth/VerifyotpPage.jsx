import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  resendOtp,
  resendRegisterOtp,
  verifyOtp,
  verifyRegisterOtp,
} from "../../services/authService";
import { useUser } from "../../context/UserContext";
import { toast } from "react-toastify";

function VerifyOtpPage() {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [email, setEmail] = useState("");
  const { reloadUser } = useUser();

  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  const isRegisterOtp = location.pathname === "/register/verify-otp";

  useEffect(() => {
    const storageKey = isRegisterOtp ? "register_email" : "reset_email";
    const redirectPath = isRegisterOtp ? "/register" : "/forgot-password";

    const storedEmail = sessionStorage.getItem(storageKey);

    if (!storedEmail) {
      navigate(redirectPath, { replace: true });
      return;
    }

    setEmail(storedEmail);
  }, [isRegisterOtp, navigate]);

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  const otpCode = otp.join("");
  setLoading(true);

  try {
    if (isRegisterOtp) {
      await verifyRegisterOtp(email, otpCode);
      await reloadUser();
      navigate("/home", {
        replace: true,
      });
    } else {
      const response = await verifyOtp(email, otpCode);
      navigate("/reset-password", {
        state: {
          resetToken: response.reset_token,
        },
      });
    }
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

const handleResend = async () => {
  setError("");
  setResendLoading(true);

  try {
    if (isRegisterOtp) {
      await resendRegisterOtp(email);
    } else {
      await resendOtp(email);
    }

    setOtp(new Array(6).fill(""));
    inputRefs.current[0]?.focus();
    toast.success("Mã OTP mới đã được gửi.");
  } catch (err) {
    setError(err.message);
  } finally {
    setResendLoading(false);
  }
};

  return (
    <div className="verify-page">
      <main className="verify-main">
        <div className="verify-card">
          <div className="verify-icon">
            <i className="bi bi-shield-check"></i>
          </div>

          <div className="text-center mb-4">
            <h2 className="verify-title">
              {isRegisterOtp ? "Xác thực đăng ký" : "Xác thực OTP"}
            </h2>

            <p className="verify-subtitle">
              Mã xác thực đã được gửi đến email {email}. Vui lòng nhập mã gồm 6 chữ số.
            </p>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="otp-wrapper">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={digit}
                  ref={(el) => (inputRefs.current[index] = el)}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="otp-input"
                />
              ))}
            </div>

            <div className="resend-code">
              <button type="button" onClick={handleResend} disabled={resendLoading}>{resendLoading ? "Gửi lại..." : "Gửi lại mã"}</button>
              </div>

            <button type="submit" className="btn-verify" disabled={loading}>
              {loading
                ? "Đang xác nhận..."
                : isRegisterOtp
                ? "Xác nhận đăng ký"
                : "Xác nhận"}
              <i className="bi bi-arrow-right ms-2"></i>
            </button>
          </form>

          <div className="verify-divider"></div>

          <div className="verify-support">
            <i className="bi bi-info-circle"></i>Bạn gặp sự cố?
            <span>Liên hệ hỗ trợ</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VerifyOtpPage;
