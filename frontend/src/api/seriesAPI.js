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

// ==================== COURSE SERIES (R4) ====================

// Danh sách series
export const getCourseSeriesApi = async () => {
  return request(() => apiClient.get("/api/courses/series/"));
};

// Tạo series mới
export const createCourseSeriesApi = async (name) => {
  return request(() => apiClient.post("/api/courses/series/", { name }));
};

// Chi tiết series + các phiên bản khóa
export const getCourseSeriesDetailApi = async (seriesId) => {
  return request(() => apiClient.get(`/api/courses/series/${seriesId}/`));
};

// Tạo phiên bản mới từ khóa có sẵn (clone)
export const createCourseVersionApi = async (seriesId, courseId) => {
  return request(() => apiClient.post(`/api/courses/series/${seriesId}/create-version/`, { course_id: courseId }));
};

// Publish khóa + tự ẩn khóa cũ trong series
export const publishAndHideCourseApi = async (courseId) => {
  return request(() => apiClient.post(`/api/courses/series/publish-and-hide/${courseId}/`));
};