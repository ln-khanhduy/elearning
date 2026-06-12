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

export const getMyCoursesApi = async () => {
  return request(() => apiClient.get("/api/enrollments/my-courses/"));
};

export const getEnrollmentDetailApi = async (enrollmentId) => {
  return request(() => apiClient.get(`/api/enrollments/${enrollmentId}/`));
};

export const checkEnrolledApi = async (courseId) => {
  return request(() => apiClient.get(`/api/enrollments/check/${courseId}/`));
};
