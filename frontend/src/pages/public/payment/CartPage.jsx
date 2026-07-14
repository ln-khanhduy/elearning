import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getCartApi, removeFromCartApi, clearCartApi } from "../../../api/cartAPI";
import { createStripeCheckoutApi } from "../../../api/paymentAPI";
import ConfirmModal from "../../../components/common/ConfirmModal";

function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, type: null, courseId: null });

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCartApi();
      setCart(data?.data || { items: [], total: 0, item_count: 0 });
    } catch (error) {
      toast.error("Không thể tải giỏ hàng.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleRemove = async (courseId) => {
    try {
      await removeFromCartApi(courseId);
      toast.success("Đã xóa khóa học khỏi giỏ hàng.");
      window.dispatchEvent(new Event("cart-change"));
      loadCart();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleClear = async () => {
    try {
      await clearCartApi();
      toast.success("Đã xóa toàn bộ giỏ hàng.");
      window.dispatchEvent(new Event("cart-change"));
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

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      toast.warning("Giỏ hàng trống.");
      return;
    }
    // For now, navigate to checkout of the first item (single course checkout)
    // Future: implement multi-course checkout
    setProcessing(true);
    try {
      const firstItem = cart.items[0];
      const result = await createStripeCheckoutApi(firstItem.course_id);
      const checkoutUrl = result?.data?.checkout_url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error("Không nhận được đường dẫn thanh toán.");
      }
    } catch (error) {
      toast.error(error.message || "Tạo thanh toán thất bại.");
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (val) => {
    if (!val && val !== 0) return null;
    return Number(val).toLocaleString("vi-VN") + "₫";
  };

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
            <div className="list-group">
              {cart.items.map((item) => (
                <div key={item.id} className="list-group-item list-group-item-action d-flex gap-3 py-3">
                  <div className="flex-shrink-0" style={{ width: "120px" }}>
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} alt={item.course_title} className="rounded" style={{ width: "100%", height: "70px", objectFit: "cover" }} />
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
                <h5 className="card-title">Tổng cộng</h5>
                <hr />
                <div className="d-flex justify-content-between mb-2">
                  <span>Tạm tính:</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
                <div className="d-flex justify-content-between mb-3 text-muted small">
                  <span>Phí thanh toán:</span>
                  <span>Tính sau</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-3">
                  <strong>Tổng tiền:</strong>
                  <strong className="text-primary fs-5">{formatPrice(cart.total)}</strong>
                </div>
                <button
                  className="btn btn-primary w-100"
                  onClick={handleCheckout}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-credit-card me-2"></i>Thanh toán
                    </>
                  )}
                </button>
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
