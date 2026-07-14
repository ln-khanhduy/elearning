import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  getCouponsApi,
  createCouponApi,
  updateCouponApi,
  deleteCouponApi,
} from "../../api/promotionAPI";
import ConfirmModal from "../../components/common/ConfirmModal";

const DISCOUNT_TYPE_MAP = {
  PERCENTAGE: { label: "Phần trăm", symbol: "%" },
  FIXED: { label: "Số tiền cố định", symbol: "₫" },
};

function AdminCouponPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "PERCENTAGE",
    discount_value: "",
    max_usage_count: 0,
    max_uses_per_user: 1,
    min_order_amount: 0,
    start_date: "",
    end_date: "",
    is_active: true,
    description: "",
    applicable_courses: [],
  });

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    variant: "primary",
    confirmLabel: "Xác nhận",
    onConfirm: () => {},
  });

  const showConfirm = ({ title, message, variant = "primary", confirmLabel = "Xác nhận", onConfirm }) => {
    setConfirmModal({ show: true, title, message, variant, confirmLabel, onConfirm });
  };

  const hideConfirm = () => {
    setConfirmModal((prev) => ({ ...prev, show: false }));
  };

  const loadCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCouponsApi();
      setCoupons(data?.data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách mã giảm giá.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const resetForm = () => {
    setFormData({
      code: "",
      discount_type: "PERCENTAGE",
      discount_value: "",
      max_usage_count: 0,
      max_uses_per_user: 1,
      min_order_amount: 0,
      start_date: "",
      end_date: "",
      is_active: true,
      description: "",
      applicable_courses: [],
    });
    setEditingCoupon(null);
    setShowForm(false);
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      max_usage_count: coupon.max_usage_count,
      max_uses_per_user: coupon.max_uses_per_user,
      min_order_amount: coupon.min_order_amount,
      start_date: coupon.start_date ? coupon.start_date.slice(0, 16) : "",
      end_date: coupon.end_date ? coupon.end_date.slice(0, 16) : "",
      is_active: coupon.is_active,
      description: coupon.description || "",
      applicable_courses: coupon.applicable_course_ids || [],
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        discount_value: parseFloat(formData.discount_value),
        max_usage_count: parseInt(formData.max_usage_count),
        max_uses_per_user: parseInt(formData.max_uses_per_user),
        min_order_amount: parseFloat(formData.min_order_amount),
      };

      if (editingCoupon) {
        await updateCouponApi(editingCoupon.id, payload);
        toast.success("Cập nhật mã giảm giá thành công.");
      } else {
        await createCouponApi(payload);
        toast.success("Tạo mã giảm giá thành công.");
      }
      resetForm();
      loadCoupons();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    }
  };

  const handleDelete = (coupon) => {
    showConfirm({
      title: "Xóa mã giảm giá",
      message: `Bạn có chắc muốn xóa mã "${coupon.code}"? Hành động này không thể hoàn tác.`,
      variant: "danger",
      confirmLabel: "Xóa",
      onConfirm: async () => {
        hideConfirm();
        try {
          await deleteCouponApi(coupon.id);
          toast.success("Xóa mã giảm giá thành công.");
          loadCoupons();
        } catch (error) {
          toast.error(error.message);
        }
      },
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const formatPrice = (val) => {
    if (!val && val !== 0) return "—";
    return Number(val).toLocaleString("vi-VN") + "₫";
  };

  const isExpired = (endDate) => {
    return new Date(endDate) < new Date();
  };

  return (
    <div className="admin-coupon-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Quản lý mã giảm giá</h4>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          <i className="bi bi-plus-lg me-1"></i>Tạo mã giảm giá
        </button>
      </div>

      {/* Form tạo/sửa coupon */}
      {showForm && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title mb-3">{editingCoupon ? "Cập nhật mã giảm giá" : "Tạo mã giảm giá mới"}</h5>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Mã giảm giá *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    placeholder="VD: SALE20"
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Loại giảm giá</label>
                  <select
                    className="form-select"
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                  >
                    <option value="PERCENTAGE">Phần trăm (%)</option>
                    <option value="FIXED">Số tiền cố định</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label">Giá trị giảm *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    placeholder={formData.discount_type === "PERCENTAGE" ? "VD: 20" : "VD: 100000"}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Số lượt tối đa</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.max_usage_count}
                    onChange={(e) => setFormData({ ...formData, max_usage_count: e.target.value })}
                    min="0"
                    placeholder="0 = không giới hạn"
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Lượt/user</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.max_uses_per_user}
                    onChange={(e) => setFormData({ ...formData, max_uses_per_user: e.target.value })}
                    min="1"
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Đơn tối thiểu</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                    min="0"
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Ngày bắt đầu *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Ngày kết thúc *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Trạng thái</label>
                  <select
                    className="form-select"
                    value={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
                  >
                    <option value="true">Kích hoạt</option>
                    <option value="false">Vô hiệu</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label">Mô tả</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả ngắn về mã giảm giá"
                  />
                </div>
              </div>
              <div className="mt-3 d-flex gap-2">
                <button type="submit" className="btn btn-primary">
                  {editingCoupon ? "Cập nhật" : "Tạo mới"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Danh sách coupon */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-ticket" style={{ fontSize: "3rem" }}></i>
          <p className="mt-2">Chưa có mã giảm giá nào.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Mã</th>
                <th>Giảm giá</th>
                <th>Đã dùng / Tối đa</th>
                <th>Thời hạn</th>
                <th>Trạng thái</th>
                <th>Người tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td>
                    <span className="fw-bold text-uppercase">{coupon.code}</span>
                  </td>
                  <td>
                    {coupon.discount_type === "PERCENTAGE"
                      ? `${coupon.discount_value}%`
                      : formatPrice(coupon.discount_value)}
                  </td>
                  <td>
                    {coupon.used_count} / {coupon.max_usage_count || "∞"}
                  </td>
                  <td>
                    <div>{formatDate(coupon.start_date)}</div>
                    <div className="text-muted small">→ {formatDate(coupon.end_date)}</div>
                  </td>
                  <td>
                    {coupon.is_expired ? (
                      <span className="badge bg-secondary">Hết hạn</span>
                    ) : coupon.is_active ? (
                      <span className="badge bg-success">Hoạt động</span>
                    ) : (
                      <span className="badge bg-danger">Vô hiệu</span>
                    )}
                  </td>
                  <td className="text-muted small">{coupon.created_by_name || "—"}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleEdit(coupon)}
                        title="Sửa"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(coupon)}
                        title="Xóa"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm}
        onCancel={hideConfirm}
      />
    </div>
  );
}

export default AdminCouponPage;