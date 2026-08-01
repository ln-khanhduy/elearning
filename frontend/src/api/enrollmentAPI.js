import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// ==================== ENROLLMENTS ====================
// BE: /api/enrollments/

// Lấy danh sách khóa học mà người dùng đã đăng ký
export const getMyCoursesApi = async () => {
  return request(() => apiClient.get("/api/enrollments/my-courses/"));
};

// Lấy chi tiết một bản ghi đăng ký khóa học
export const getEnrollmentDetailApi = async (enrollmentId) => {
  return request(() => apiClient.get(`/api/enrollments/${enrollmentId}/`));
};

// Kiểm tra người dùng đã đăng ký khóa học hay chưa
export const checkEnrolledApi = async (courseId) => {
  return request(() => apiClient.get(`/api/enrollments/check/${courseId}/`));
};
