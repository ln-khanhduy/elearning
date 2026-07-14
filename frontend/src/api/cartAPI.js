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

export const getCartApi = async () => {
  return request(() => apiClient.get("/api/cart/"));
};

export const addToCartApi = async (courseId) => {
  return request(() => apiClient.post(`/api/cart/add/${courseId}/`));
};

export const removeFromCartApi = async (courseId) => {
  return request(() => apiClient.delete(`/api/cart/remove/${courseId}/`));
};

export const clearCartApi = async () => {
  return request(() => apiClient.delete("/api/cart/clear/"));
};