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

// Lấy danh sách khóa học yêu thích của người dùng
export const getWishlistApi = async () => {
  return request(() => apiClient.get("/api/courses/wishlist/"));
};

// Lấy số lượng khóa học trong danh sách yêu thích
export const getWishlistCountApi = async () => {
  return request(() => apiClient.get("/api/courses/wishlist/count/"));
};

// Thêm khóa học vào danh sách yêu thích
export const addToWishlistApi = async (courseId) => {
  return request(() => apiClient.post(`/api/courses/wishlist/${courseId}/add/`));
};

// Xóa khóa học khỏi danh sách yêu thích
export const removeFromWishlistApi = async (courseId) => {
  return request(() => apiClient.delete(`/api/courses/wishlist/${courseId}/remove/`));
};

// Kiểm tra khóa học đã nằm trong danh sách yêu thích chưa
export const checkWishlistApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/wishlist/${courseId}/check/`));
};