import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// ==================== CART API ====================
// BE: /api/cart/

// Lấy toàn bộ giỏ hàng của người dùng hiện tại
export const getCartApi = async () => {
  return request(() => apiClient.get("/api/cart/"));
};

// Thêm khóa học vào giỏ hàng
export const addToCartApi = async (courseId) => {
  return request(() => apiClient.post(`/api/cart/add/${courseId}/`));
};

// Xóa khóa học khỏi giỏ hàng
export const removeFromCartApi = async (courseId) => {
  return request(() => apiClient.delete(`/api/cart/remove/${courseId}/`));
};

// Xóa toàn bộ sản phẩm trong giỏ hàng
export const clearCartApi = async () => {
  return request(() => apiClient.delete("/api/cart/clear/"));
};