import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useCourseDetail } from "../../../hooks/course-detail/useCourseDetail";
import { createStripeCheckoutApi } from "../../../api/paymentAPI";
import "../../../style/payment/payment.css";

function CheckoutPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { course, loading, error } = useCourseDetail(courseId);
  const [processing, setProcessing] = useState(false);

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

    try {
      const result = await createStripeCheckoutApi(courseId);
      const checkoutUrl = result?.data?.checkout_url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error("Không nhận được đường dẫn thanh toán.");
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
              <h3>Phương thức thanh toán</h3>

              {/* Stripe */}
              <div className="payment-method-option selected">
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
          </div>

          {/* Right: Course Summary */}
          <div className="checkout-course-card">
            {course.thumbnail_url ? (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="checkout-course-thumb"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                }}
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
