import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useCourseDetail } from "../../../hooks/course-detail/useCourseDetail";
import {
  createStripeCheckoutApi,
  createMomoCheckoutApi,
} from "../../../api/paymentAPI";
import "../../../style/payment/payment.css";

function CheckoutPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { course, loading, error } = useCourseDetail(courseId);
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [processing, setProcessing] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [momoPayUrl, setMomoPayUrl] = useState(null);

  // Redirect if course is free
  useEffect(() => {
    if (course && (!course.price || Number(course.price) <= 0)) {
      toast.info("Khóa học miễn phí. Vui lòng sử dụng đăng ký miễn phí.");
      navigate(`/courses/${courseId}`, { replace: true });
    }
  }, [course, courseId, navigate]);

  const formatPrice = (val) => {
    if (!val && val !== 0) return null;
    return Number(val).toLocaleString("vi-VN") + "₫";
  };

  const handlePayment = async () => {
    if (!course) return;
    setProcessing(true);
    setQrCodeUrl(null);
    setMomoPayUrl(null);

    try {
      if (paymentMethod === "stripe") {
        const result = await createStripeCheckoutApi(courseId);
        const checkoutUrl = result?.data?.checkout_url;
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          throw new Error("Không nhận được đường dẫn thanh toán.");
        }
      } else if (paymentMethod === "momo") {
        const result = await createMomoCheckoutApi(courseId);
        const payUrl = result?.data?.pay_url;
        const qrUrl = result?.data?.qr_code_url;

        if (payUrl) {
          setMomoPayUrl(payUrl);
          // Auto redirect to MoMo
          window.location.href = payUrl;
        } else if (qrUrl) {
          setQrCodeUrl(qrUrl);
          toast.info("Vui lòng quét mã QR để thanh toán qua MoMo.");
        } else {
          throw new Error("Không nhận được thông tin thanh toán MoMo.");
        }
      }
    } catch (err) {
      toast.error(err.message || "Tạo thanh toán thất bại. Vui lòng thử lại.");
    } finally {
      setProcessing(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="payment-loading">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p>Đang tải thông tin khóa học...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !course) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="payment-empty">
            <i className="bi bi-exclamation-triangle"></i>
            <p>{error || "Không tìm thấy khóa học."}</p>
            <button
              className="btn btn-primary mt-3"
              onClick={() => navigate("/courses")}
            >
              Quay lại danh sách khóa học
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasDiscount =
    course.original_price && Number(course.original_price) > Number(course.price);

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <h1>Thanh toán khóa học</h1>
          <p>Vui lòng chọn phương thức thanh toán phù hợp</p>
        </div>

        <div className="checkout-content">
          {/* Left: Payment Methods */}
          <div>
            <div className="payment-methods">
              <h3>Chọn phương thức thanh toán</h3>

              {/* Stripe */}
              <div
                className={`payment-method-option ${
                  paymentMethod === "stripe" ? "selected" : ""
                }`}
                onClick={() => setPaymentMethod("stripe")}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="stripe"
                  checked={paymentMethod === "stripe"}
                  onChange={() => setPaymentMethod("stripe")}
                />
                <div className="payment-method-icon stripe">
                  <i className="bi bi-credit-card"></i>
                </div>
                <div className="payment-method-info">
                  <div className="payment-method-name">Thẻ tín dụng / Thẻ ghi nợ</div>
                  <div className="payment-method-desc">
                    Thanh toán qua Stripe - Visa, Mastercard, JCB
                  </div>
                </div>
              </div>

              {/* MoMo */}
              <div
                className={`payment-method-option ${
                  paymentMethod === "momo" ? "selected" : ""
                }`}
                onClick={() => setPaymentMethod("momo")}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="momo"
                  checked={paymentMethod === "momo"}
                  onChange={() => setPaymentMethod("momo")}
                />
                <div className="payment-method-icon momo">
                  <i className="bi bi-wallet2"></i>
                </div>
                <div className="payment-method-info">
                  <div className="payment-method-name">Ví MoMo</div>
                  <div className="payment-method-desc">
                    Thanh toán nhanh chóng qua ứng dụng MoMo
                  </div>
                </div>
              </div>

              {/* Pay Button */}
              <button
                className="checkout-btn"
                onClick={handlePayment}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                    ></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="bi bi-lock-fill"></i>
                    Thanh toán {formatPrice(course.price)}
                  </>
                )}
              </button>
            </div>

            {/* QR Code Section (MoMo) */}
            {qrCodeUrl && (
              <div className="qr-section">
                <h4>Quét mã QR bằng ứng dụng MoMo</h4>
                <img
                  src={qrCodeUrl}
                  alt="MoMo QR Code"
                  className="qr-code-img"
                />
                <p className="text-muted mb-3">
                  Hoặc mở ứng dụng MoMo để thanh toán
                </p>
                {momoPayUrl && (
                  <a
                    href={momoPayUrl}
                    className="btn btn-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="bi bi-box-arrow-up-right"></i>
                    Mở MoMo
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Right: Course Summary */}
          <div className="checkout-course-card">
            {course.thumbnail_url ? (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="checkout-course-thumb"
              />
            ) : (
              <div className="checkout-course-thumb-placeholder">
                <i className="bi bi-play-circle"></i>
              </div>
            )}
            <div className="checkout-course-info">
              <h2>{course.title}</h2>
              <p className="checkout-course-instructor">
                <i className="bi bi-person"></i>{" "}
                {course.instructor_name || "Giảng viên"}
              </p>
              <div>
                <span className="checkout-course-price">
                  {formatPrice(course.price)}
                </span>
                {hasDiscount && (
                  <span className="checkout-course-price-original">
                    {formatPrice(course.original_price)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
