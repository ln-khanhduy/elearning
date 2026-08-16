import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    const e = new Error(getErrorMessage(error));
    e.cause = error;
    throw e;
  }
};

// ==================== CART API ====================
// BE: /api/cart/

// Lấy toàn bộ giỏ hàng của người dùng hiện tại
export const getCartApi = async () => {
  return request(() => apiClient.get("/api/cart/"));
};

// Thêm khóa học + gói đã chọn vào giỏ hàng (bắt buộc plan_id — chọn gói trước khi thêm)
export const addToCartApi = async (courseId, planId) => {
  return request(() => apiClient.post(`/api/cart/add/${courseId}/`, { plan_id: planId }));
};

// Xóa khóa học khỏi giỏ hàng
export const removeFromCartApi = async (courseId) => {
  return request(() => apiClient.delete(`/api/cart/remove/${courseId}/`));
};

// Xóa toàn bộ sản phẩm trong giỏ hàng
export const clearCartApi = async () => {
  return request(() => apiClient.delete("/api/cart/clear/"));
};