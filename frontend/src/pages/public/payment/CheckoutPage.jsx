import { useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useCourseDetail } from "../../../hooks/courseDetail/useCourseDetail";
import { createStripeCheckoutApi } from "../../../api/paymentAPI";
import { validateCouponApi } from "../../../api/promotionAPI";
import "../../../style/payment/payment.css";

function CheckoutPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { course, loading, error } = useCourseDetail(courseId);
  const [processing, setProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [discountInfo, setDiscountInfo] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = useMemo(() => course?.access_plans || [], [course?.access_plans]);

  // Ưu tiên gói đã chọn từ trang khóa (plan_id qua URL), nếu không có mới mặc định gói đầu tiên
  if (plans.length > 0 && !selectedPlan) {
    const planIdFromUrl = searchParams.get("plan_id");
    const presetPlan = planIdFromUrl
      ? plans.find((p) => String(p.id) === String(planIdFromUrl))
      : null;
    setSelectedPlan(presetPlan || plans[0]);
  }

  const planPrice = selectedPlan ? Number(selectedPlan.price) : 0;

  const formatPrice = (val) => {
    if (!val && val !== 0) return null;
    return Number(val).toLocaleString("vi-VN") + "₫";
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return setCouponError("Vui lòng nhập mã giảm giá.");
    if (!selectedPlan) return setCouponError("Vui lòng chọn gói truy cập.");
    try {
      const res = await validateCouponApi(couponCode.trim(), [Number(courseId)], Number(planPrice));
      const data = res?.data;
      if (!res?.success && !data) throw new Error(res?.message || "Mã giảm giá không hợp lệ.");
      setAppliedCoupon({ code: couponCode.trim(), id: data?.id });
      const total = Number(planPrice);
      const dVal = Number(data?.discount_value || 0);
      const dAmt = data?.discount_type === "PERCENTAGE" ? Math.floor((total * dVal) / 100) : Math.min(dVal, total);
      setDiscountInfo({ discount_amount: dAmt, final_total: total - dAmt });
      setCouponError("");
      toast.success("Áp dụng mã giảm giá thành công.");
    } catch (err) {
      setAppliedCoupon(null);
      setDiscountInfo(null);
      setCouponError(err.message || "Mã giảm giá không hợp lệ.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountInfo(null);
    setCouponCode("");
    setCouponError("");
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setAppliedCoupon(null);
    setDiscountInfo(null);
    setCouponCode("");
    setCouponError("");
  };

  const handlePayment = async () => {
    if (!course || !selectedPlan) return;
    setProcessing(true);
    try {
      const result = await createStripeCheckoutApi(courseId, selectedPlan.id, appliedCoupon?.code || "");
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

  if (error || !course) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="payment-empty">
            <i className="bi bi-exclamation-triangle"></i>
            <p>{error || "Không tìm thấy khóa học."}</p>
            <button className="btn btn-primary mt-3" onClick={() => navigate("/courses")}>
              Quay lại danh sách khóa học
            </button>
          </div>
        </div>
      </div>
    );
  }

  const finalPrice = discountInfo ? discountInfo.final_total : planPrice;

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <h1>Thanh toán khóa học</h1>
        </div>

        <div className="checkout-content">
          <div>
            {/* Chọn gói truy cập */}
            {plans.length > 0 && (
              <div className="checkout-plans mb-3">
                <h3 className="mb-2">Chọn gói truy cập</h3>
                {plans.map((p) => (
                  <label
                    key={p.id}
                    className={`checkout-plan-option d-flex align-items-center justify-content-between border rounded p-2 mb-2 ${selectedPlan?.id === p.id ? "border-primary" : ""}`}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="d-flex align-items-center">
                      <input
                        type="radio"
                        name="plan"
                        checked={selectedPlan?.id === p.id}
                        onChange={() => handleSelectPlan(p)}
                        className="me-2"
                      />
                      <span>
                        {p.name}
                        <small className="text-muted d-block">Thời gian truy cập: {p.duration_days} ngày</small>
                      </span>
                    </div>
                    <span className="fw-bold">{formatPrice(p.price)}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="payment-methods">
              <h3>Phương thức thanh toán</h3>
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

              {!appliedCoupon ? (
                <div className="checkout-coupon-apply">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nhập mã giảm giá"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={processing}
                  />
                  <button
                    type="button"
                    className="checkout-coupon-btn"
                    onClick={handleApplyCoupon}
                    disabled={processing}
                  >
                    <i className="bi bi-ticket-perforated"></i>
                    Áp dụng
                  </button>
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="fw-bold text-success">
                    <i className="bi bi-ticket-perforated me-1"></i>
                    {appliedCoupon.code}
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={handleRemoveCoupon}
                    disabled={processing}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              )}
              {couponError && <div className="text-danger small mb-2">{couponError}</div>}
              {discountInfo && (
                <div className="d-flex flex-column mb-2 small border rounded p-2">
                  <div className="d-flex justify-content-between">
                    <span>Giảm giá:</span>
                    <span className="text-danger">-{formatPrice(discountInfo.discount_amount)}</span>
                  </div>
                  <div className="d-flex justify-content-between fw-bold">
                    <span>Tổng sau giảm:</span>
                    <span>{formatPrice(discountInfo.final_total)}</span>
                  </div>
                </div>
              )}

              <button
                className="checkout-btn"
                onClick={handlePayment}
                disabled={processing || plans.length === 0}
              >
                {processing ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="bi bi-lock-fill"></i>
                    Thanh toán {formatPrice(finalPrice)}
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
                <i className="bi bi-person"></i> {course.instructor_name || "Giảng viên"}
              </p>
              {selectedPlan && (
                <div className="checkout-plan-summary">
                  <span className="checkout-course-price">{formatPrice(planPrice)}</span>
                  <small className="text-muted d-block">
                    Gói {selectedPlan.name} · {selectedPlan.duration_days} ngày
                  </small>
                </div>
              )}
              {discountInfo && (
                <small className="text-danger d-block mt-1">
                  Tổng thanh toán: {formatPrice(discountInfo.final_total)}
                </small>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;