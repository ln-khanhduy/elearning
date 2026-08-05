import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getCartApi, removeFromCartApi, clearCartApi } from "../../../api/cartAPI";
import { createStripeCartCheckoutApi } from "../../../api/paymentAPI";
import { validateCouponApi } from "../../../api/promotionAPI";
import ConfirmModal from "../../../components/common/ConfirmModal";

// Trang giỏ hàng: hiển thị danh sách khóa học đã chọn, chọn mục và thanh toán 1 lần
function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ show: false, type: null, courseId: null });
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [discountInfo, setDiscountInfo] = useState(null);

  // Tải giỏ hàng từ server và tự chọn tất cả mục khi tải xong
  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCartApi();
      const cartData = data?.data || { items: [], total: 0, item_count: 0 };
      setCart(cartData);
      // Auto-select all when cart loads
      if (cartData.items?.length > 0) {
        setSelectedIds(cartData.items.map(item => item.course_id));
      }
    } catch (error) {
      toast.error("Không thể tải giỏ hàng.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Xóa một khóa học khỏi giỏ hàng
  const handleRemove = async (courseId) => {
    try {
      await removeFromCartApi(courseId);
      toast.success("Đã xóa khóa học khỏi giỏ hàng.");
      window.dispatchEvent(new Event("cart-change"));
      setSelectedIds(prev => prev.filter(id => id !== courseId));
      loadCart();
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Xóa toàn bộ giỏ hàng
  const handleClear = async () => {
    try {
      await clearCartApi();
      toast.success("Đã xóa toàn bộ giỏ hàng.");
      window.dispatchEvent(new Event("cart-change"));
      setSelectedIds([]);
      loadCart();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const confirmRemove = (courseId) => {
    setConfirmModal({ show: true, type: "remove", courseId });
  };

  const confirmClear = () => {
    setConfirmModal({ show: true, type: "clear", courseId: null });
  };

  const handleConfirmAction = () => {
    if (confirmModal.type === "remove") {
      handleRemove(confirmModal.courseId);
    } else if (confirmModal.type === "clear") {
      handleClear();
    }
    setConfirmModal({ show: false, type: null, courseId: null });
  };

  // Select / deselect
  const handleToggleSelect = (courseId) => {
    setSelectedIds(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === cart?.items?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cart?.items?.map(item => item.course_id) || []);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return setCouponError("Vui lòng nhập mã giảm giá.");
    if (selectedItems.length === 0) return setCouponError("Vui lòng chọn ít nhất 1 khóa học.");
    try {
      const res = await validateCouponApi(couponCode.trim(), selectedItems.map(i => i.course_id), selectedTotal);
      const data = res?.data;
      if (!res?.success && !data) throw new Error(res?.message || "Mã giảm giá không hợp lệ.");
      setAppliedCoupon({ code: couponCode.trim(), id: data?.id });
      const dVal = Number(data?.discount_value || 0);
      const dAmt = data?.discount_type === "PERCENTAGE" ? Math.floor((selectedTotal * dVal) / 100) : Math.min(dVal, selectedTotal);
      setDiscountInfo({ discount_amount: dAmt, final_total: selectedTotal - dAmt });
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

  // Thanh toán tất cả khóa học đã chọn trong 1 phiên Stripe duy nhất
  const handleCheckout = async () => {
    const selectedItems = cart?.items?.filter(item => selectedIds.includes(item.course_id)) || [];
    if (selectedItems.length === 0) {
      toast.warning("Vui lòng chọn ít nhất 1 khóa học để thanh toán.");
      return;
    }

    if (appliedCoupon && selectedItems.length > 1) {
      toast.warning("Mã giảm giá chỉ áp dụng cho 1 khóa học. Vui lòng chọn 1 khóa hoặc hủy mã giảm giá.");
      return;
    }

    setProcessing(true);
    try {
      const result = await createStripeCartCheckoutApi(
        selectedItems.map(item => item.course_id),
        appliedCoupon?.code || ""
      );
      const checkoutUrl = result?.data?.checkout_url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }
      throw new Error("Không nhận được đường dẫn thanh toán.");
    } catch (error) {
      toast.error(error.message || "Tạo thanh toán thất bại.");
    } finally {
      setProcessing(false);
    }
  };

  // Định dạng giá tiền theo chuẩn Việt Nam
  const formatPrice = (val) => {
    if (!val && val !== 0) return null;
    return Number(val).toLocaleString("vi-VN") + "₫";
  };

  const selectedItems = cart?.items?.filter(item => selectedIds.includes(item.course_id)) || [];
  const selectedTotal = selectedItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const allSelected = selectedIds.length === cart?.items?.length;

  return (
    <div className="cart-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <i className="bi bi-cart3 me-2"></i>
          Giỏ hàng
          {cart && cart.item_count > 0 && (
            <span className="badge bg-secondary ms-2">{cart.item_count}</span>
          )}
        </h4>
          {cart && cart.items.length > 0 && (
          <button className="btn btn-outline-danger btn-sm" onClick={confirmClear}>
            <i className="bi bi-trash me-1"></i>Xóa tất cả
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      ) : !cart || cart.items.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-cart text-muted" style={{ fontSize: "4rem" }}></i>
          <h5 className="mt-3 text-muted">Giỏ hàng trống</h5>
          <Link to="/courses" className="btn btn-primary mt-3">
            Khám phá khóa học
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-lg-8">
            {/* Select all */}
            <div className="d-flex align-items-center mb-2 px-1">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="selectAll"
                  checked={allSelected}
                  onChange={handleSelectAll}
                />
                <label className="form-check-label small" htmlFor="selectAll">
                  {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                </label>
              </div>
              <span className="ms-2 text-muted small">
                Đã chọn {selectedIds.length}/{cart.items.length} khóa học
              </span>
            </div>

            <div className="list-group">
              {cart.items.map((item) => (
                <div key={item.id} className="list-group-item list-group-item-action d-flex gap-3 py-3">
                  <div className="d-flex align-items-center">
                    <input
                      type="checkbox"
                      className="form-check-input me-2"
                      checked={selectedIds.includes(item.course_id)}
                      onChange={() => handleToggleSelect(item.course_id)}
                    />
                  </div>
                  <div className="flex-shrink-0" style={{ width: "120px" }}>
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.course_title}
                        className="rounded"
                        style={{ width: "100%", height: "70px", objectFit: "cover" }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: "100%", height: "70px" }}>
                        <i className="bi bi-image text-muted"></i>
                      </div>
                    )}
                  </div>
                  <div className="flex-grow-1 d-flex flex-column">
                    <Link to={`/courses/${item.course_id}`} className="text-decoration-none">
                      <h6 className="mb-1 text-dark">{item.course_title}</h6>
                    </Link>
                    <div className="d-flex justify-content-between align-items-center mt-auto">
                      <span className="fw-bold text-primary">{formatPrice(item.price)}</span>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => confirmRemove(item.course_id)}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Thanh toán</h5>
                <hr />
                <div className="d-flex justify-content-between mb-2">
                  <span>Đã chọn:</span>
                  <span>{selectedItems.length} khóa học</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Tạm tính:</span>
                  <span>{formatPrice(selectedTotal)}</span>
                </div>
                <div className="d-flex justify-content-between mb-3 text-muted small">
                  <span>Phí thanh toán:</span>
                  <span>Tính sau</span>
                </div>
                {!appliedCoupon ? (
                  <div className="d-flex gap-2 mb-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Nhập mã giảm giá"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      disabled={processing}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={handleApplyCoupon}
                      disabled={processing || selectedItems.length === 0}
                    >
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
                  <div className="d-flex justify-content-between mb-2 small">
                    <span>Giảm giá:</span>
                    <span className="text-danger">-{formatPrice(discountInfo.discount_amount)}</span>
                  </div>
                )}
                <hr />
                <div className="d-flex justify-content-between mb-3">
                  <strong>Tổng tiền:</strong>
                  <strong className="text-primary fs-5">{discountInfo ? formatPrice(discountInfo.final_total) : formatPrice(selectedTotal)}</strong>
                </div>
                <button
                  className="btn btn-primary w-100 mb-2"
                  onClick={handleCheckout}
                  disabled={processing || selectedItems.length === 0}
                >
                  {processing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-credit-card me-2"></i>
                      {selectedItems.length === 0
                        ? "Chọn khóa học để thanh toán"
                        : selectedItems.length === 1
                        ? "Thanh toán 1 khóa học"
                        : `Thanh toán ${selectedItems.length} khóa học`}
                    </>
                  )}
                </button>
                {selectedItems.length > 1 && (
                  <div className="alert alert-info py-2 px-3 small mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    Tất cả khóa học sẽ được thanh toán trong 1 lần.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        show={confirmModal.show}
        title={confirmModal.type === "clear" ? "Xóa toàn bộ giỏ hàng" : "Xóa khóa học"}
        message={
          confirmModal.type === "clear"
            ? "Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?"
            : "Bạn có chắc chắn muốn xóa khóa học này khỏi giỏ hàng?"
        }
        variant="danger"
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal({ show: false, type: null, courseId: null })}
      />
    </div>
  );
}

export default CartPage;