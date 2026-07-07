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

export const getReviewsApi = async () => {
  return request(() => apiClient.get("/api/reviews/"));
};

export const getCourseReviewsApi = async (courseId) => {
  return request(() => apiClient.get(`/api/reviews/courses/${courseId}/`));
};

export const getCourseReviewStatsApi = async (courseId) => {
  return request(() => apiClient.get(`/api/reviews/courses/${courseId}/stats/`));
};

export const getReviewDetailApi = async (reviewId) => {
  return request(() => apiClient.get(`/api/reviews/${reviewId}/`));
};

export const createReviewApi = async (data) => {
  return request(() => apiClient.post("/api/reviews/create/", data));
};

export const updateReviewApi = async (reviewId, data) => {
  return request(() => apiClient.put(`/api/reviews/${reviewId}/update/`, data));
};

export const deleteReviewApi = async (reviewId) => {
  return request(() => apiClient.delete(`/api/reviews/${reviewId}/delete/`));
};

export const updateReviewStatusApi = async (reviewId, status) => {
  return request(() =>
    apiClient.patch(`/api/reviews/${reviewId}/update-status/`, { status })
  );
};