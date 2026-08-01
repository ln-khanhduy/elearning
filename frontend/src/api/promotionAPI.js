import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// ==================== ADMIN COUPON ====================
// BE: /api/promotions/coupons/

// Lấy danh sách mã giảm giá
export const getCouponsApi = async () => {
  return request(() => apiClient.get("/api/promotions/coupons/"));
};

// Lấy chi tiết một mã giảm giá
export const getCouponDetailApi = async (couponId) => {
  return request(() => apiClient.get(`/api/promotions/coupons/${couponId}/`));
};

// Tạo mới mã giảm giá
export const createCouponApi = async (data) => {
  return request(() => apiClient.post("/api/promotions/coupons/create/", data));
};

// Cập nhật thông tin mã giảm giá
export const updateCouponApi = async (couponId, data) => {
  return request(() => apiClient.patch(`/api/promotions/coupons/${couponId}/update/`, data));
};

// Xóa mã giảm giá
export const deleteCouponApi = async (couponId) => {
  return request(() => apiClient.delete(`/api/promotions/coupons/${couponId}/delete/`));
};

// ==================== PUBLIC COUPON ====================

// Kiểm tra mã giảm giá có hợp lệ cho danh sách khóa học không
export const validateCouponApi = async (code, courseIds) => {
  return request(() => apiClient.post("/api/promotions/coupons/validate/", {
    code,
    course_ids: courseIds,
  }));
};

// Áp mã giảm giá vào tổng tiền giỏ hàng
export const applyCouponApi = async (code, cartTotal, courseIds) => {
  return request(() => apiClient.post("/api/promotions/coupons/apply/", {
    code,
    cart_total: cartTotal,
    course_ids: courseIds,
  }));
};