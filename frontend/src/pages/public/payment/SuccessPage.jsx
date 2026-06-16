import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  verifyStripePaymentApi,
  verifyMomoPaymentApi,
} from "../../../api/paymentAPI";
import "../../../style/payment/payment.css";

function SuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [courseId, setCourseId] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get("session_id");
      const transactionId =
        searchParams.get("transaction_id") || searchParams.get("orderId");

      try {
        if (sessionId) {
          // Stripe
          const result = await verifyStripePaymentApi(sessionId);
          const redirectUrl = result?.data?.redirect_url;
          const cid = redirectUrl?.split("/")[2];
          if (cid) setCourseId(cid);

          toast.success("Thanh toán thành công! Bạn đã được mở quyền học.");
          setStatus("success");

          // Auto redirect after 2 seconds
          if (redirectUrl) {
            setTimeout(() => {
              navigate(redirectUrl, { replace: true });
            }, 2000);
          }
        } else if (transactionId) {
          // MoMo
          const result = await verifyMomoPaymentApi(transactionId);
          const redirectUrl = result?.data?.redirect_url;
          const cid = redirectUrl?.split("/")[2];
          if (cid) setCourseId(cid);

          toast.success("Thanh toán thành công! Bạn đã được mở quyền học.");
          setStatus("success");

          if (redirectUrl) {
            setTimeout(() => {
              navigate(redirectUrl, { replace: true });
            }, 2000);
          }
        } else {
          setErrorMsg("Không tìm thấy thông tin giao dịch.");
          setStatus("error");
        }
      } catch (err) {
        setErrorMsg(
          err.message || "Xác thực thanh toán thất bại. Vui lòng liên hệ hỗ trợ."
        );
        setStatus("error");
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  const handleGoToCourse = () => {
    if (courseId) {
      navigate(`/courses/${courseId}/learn`, { replace: true });
    } else {
      navigate("/my-courses", { replace: true });
    }
  };

  const handleGoBack = () => {
    if (courseId) {
      navigate(`/courses/${courseId}`, { replace: true });
    } else {
      navigate("/courses", { replace: true });
    }
  };

  return (
    <div className="payment-result-page">
      <div className="payment-result-card">
        {status === "verifying" && (
          <>
            <div className="payment-result-icon loading">
              <i className="bi bi-arrow-repeat"></i>
            </div>
            <h2>Đang xác thực thanh toán...</h2>
            <p>Vui lòng chờ trong giây lát...</p>
            <div className="spinner-border text-primary mt-3" role="status">
              <span className="visually-hidden">Đang xác thực...</span>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="payment-result-icon success">
              <i className="bi bi-check-lg"></i>
            </div>
            <h2>Thanh toán thành công!</h2>
            <p>Bạn đã được mở quyền truy cập khóa học.</p>
            <p className="text-muted">
              Đang chuyển hướng đến trang học tập...
            </p>
            <div className="result-actions">
              <button className="btn btn-primary" onClick={handleGoToCourse}>
                <i className="bi bi-play-circle"></i>
                Vào học ngay
              </button>
              <button className="btn btn-outline" onClick={handleGoBack}>
                Quay lại khóa học
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="payment-result-icon cancel">
              <i className="bi bi-x-lg"></i>
            </div>
            <h2>Xác thực thất bại</h2>
            <p>{errorMsg}</p>
            <p className="text-muted">
              Nếu bạn đã thanh toán thành công, vui lòng liên hệ bộ phận hỗ trợ
              để được giúp đỡ.
            </p>
            <div className="result-actions">
              <button className="btn btn-primary" onClick={handleGoToCourse}>
                <i className="bi bi-book"></i>
                Vào khóa học của tôi
              </button>
              <button className="btn btn-outline" onClick={handleGoBack}>
                Quay lại khóa học
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SuccessPage;
