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

export const getCouponsApi = async () => {
  return request(() => apiClient.get("/api/promotions/coupons/"));
};

export const getCouponDetailApi = async (couponId) => {
  return request(() => apiClient.get(`/api/promotions/coupons/${couponId}/`));
};

export const createCouponApi = async (data) => {
  return request(() => apiClient.post("/api/promotions/coupons/create/", data));
};

export const updateCouponApi = async (couponId, data) => {
  return request(() => apiClient.patch(`/api/promotions/coupons/${couponId}/update/`, data));
};

export const deleteCouponApi = async (couponId) => {
  return request(() => apiClient.delete(`/api/promotions/coupons/${couponId}/delete/`));
};

// ==================== PUBLIC COUPON ====================

export const validateCouponApi = async (code, courseIds) => {
  return request(() => apiClient.post("/api/promotions/coupons/validate/", {
    code,
    course_ids: courseIds,
  }));
};

export const applyCouponApi = async (code, cartTotal, courseIds) => {
  return request(() => apiClient.post("/api/promotions/coupons/apply/", {
    code,
    cart_total: cartTotal,
    course_ids: courseIds,
  }));
};