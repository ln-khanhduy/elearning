import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// ==================== REVIEWS ====================
// BE: /api/reviews/

// Lấy danh sách toàn bộ đánh giá (dành cho quản trị)
export const getReviewsApi = async () => {
  return request(() => apiClient.get("/api/reviews/"));
};

// Lấy danh sách đánh giá của một khóa học
export const getCourseReviewsApi = async (courseId) => {
  return request(() => apiClient.get(`/api/reviews/courses/${courseId}/`));
};

// Lấy thống kê đánh giá (tổng sao, số lượt đánh giá) của khóa học
export const getCourseReviewStatsApi = async (courseId) => {
  return request(() => apiClient.get(`/api/reviews/courses/${courseId}/stats/`));
};

// Lấy chi tiết một đánh giá
export const getReviewDetailApi = async (reviewId) => {
  return request(() => apiClient.get(`/api/reviews/${reviewId}/`));
};

// Gửi đánh giá mới cho khóa học
export const createReviewApi = async (data) => {
  return request(() => apiClient.post("/api/reviews/create/", data));
};

// Cập nhật đánh giá
export const updateReviewApi = async (reviewId, data) => {
  return request(() => apiClient.put(`/api/reviews/${reviewId}/update/`, data));
};

// Xóa đánh giá
export const deleteReviewApi = async (reviewId) => {
  return request(() => apiClient.delete(`/api/reviews/${reviewId}/delete/`));
};

// Cập nhật trạng thái duyệt đánh giá (dành cho quản trị)
export const updateReviewStatusApi = async (reviewId, status) => {
  return request(() =>
    apiClient.patch(`/api/reviews/${reviewId}/update-status/`, { status })
  );
};