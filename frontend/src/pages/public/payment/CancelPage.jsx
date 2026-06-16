import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "../../../style/payment/payment.css";

function CancelPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const transactionId = searchParams.get("transaction_id");
  const courseId = searchParams.get("courseId");

  const handleGoBack = () => {
    if (courseId) {
      navigate(`/courses/${courseId}`, { replace: true });
    } else if (transactionId) {
      // Try to get courseId from transaction detail
      navigate("/courses", { replace: true });
    } else {
      navigate("/courses", { replace: true });
    }
  };

  return (
    <div className="payment-result-page">
      <div className="payment-result-card">
        <div className="payment-result-icon cancel">
          <i className="bi bi-x-lg"></i>
        </div>
        <h2>Thanh toán đã bị hủy</h2>
        <p>Bạn đã hủy giao dịch thanh toán.</p>
        <p className="text-muted">
          Nếu bạn gặp bất kỳ vấn đề nào, vui lòng thử lại hoặc liên hệ bộ phận
          hỗ trợ.
        </p>
        <div className="result-actions">
          <button className="btn btn-primary" onClick={handleGoBack}>
            <i className="bi bi-arrow-left"></i>
            Quay lại khóa học
          </button>
          <button
            className="btn btn-outline"
            onClick={() => navigate("/courses", { replace: true })}
          >
            <i className="bi bi-grid"></i>
            Khám phá khóa học khác
          </button>
        </div>
      </div>
    </div>
  );
}

export default CancelPage;
