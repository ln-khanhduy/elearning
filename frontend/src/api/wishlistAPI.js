import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// ==================== WISHLIST API ====================
// BE: /api/courses/wishlist/

export const getWishlistApi = async () => {
  return request(() => apiClient.get("/api/courses/wishlist/"));
};

export const getWishlistCountApi = async () => {
  return request(() => apiClient.get("/api/courses/wishlist/count/"));
};

export const addToWishlistApi = async (courseId) => {
  return request(() => apiClient.post(`/api/courses/wishlist/${courseId}/add/`));
};

export const removeFromWishlistApi = async (courseId) => {
  return request(() => apiClient.delete(`/api/courses/wishlist/${courseId}/remove/`));
};

export const checkWishlistApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/wishlist/${courseId}/check/`));
};