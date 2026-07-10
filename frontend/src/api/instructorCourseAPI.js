import apiClient from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || error.response?.data?.message || error.message || "Có lỗi xảy ra.");
  }
};

export const getInstructorCoursesApi = async () => {
  return request(() => apiClient.get("/api/courses/instructor/"));
};

export const getInstructorCourseDetailApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/instructor/${courseId}/`));
};

export const getInstructorCourseStudentsApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/instructor/${courseId}/students/`));
};

export const getInstructorCourseAnalyticsApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/instructor/${courseId}/analytics/`));
};

export const sendCourseNotificationApi = async (courseId, title, body) => {
  return request(() =>
    apiClient.post(`/api/courses/instructor/${courseId}/send-notification/`, { title, body })
  );
};

export const getCourseQAApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/instructor/${courseId}/qa/`));
};

export const replyCourseQAApi = async (courseId, questionId, content) => {
  return request(() =>
    apiClient.post(`/api/courses/instructor/${courseId}/qa/${questionId}/reply/`, { content })
  );
};

export const getEssaySubmissionsApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/instructor/${courseId}/essay-submissions/`));
};

export const gradeEssayApi = async (courseId, answerId, score) => {
  return request(() =>
    apiClient.post(`/api/courses/instructor/${courseId}/grade-essay/`, { answer_id: answerId, score })
  );
};

export const getLearningReportApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/instructor/${courseId}/learning-report/`));
};

export const getCurriculumPreviewApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/${courseId}/curriculum/preview/`));
};

export const getLearningCurriculumApi = async (courseId) => {
  return request(() => apiClient.get(`/api/learning/courses/${courseId}/curriculum/`));
};