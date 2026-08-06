import apiClient from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || error.response?.data?.message || error.message || "Có lỗi xảy ra.");
  }
};

// Lấy danh sách khóa học của giảng viên hiện tại
export const getInstructorCoursesApi = async () => {
  return request(() => apiClient.get("/api/courses/instructor/"));
};

// Lấy chi tiết khóa học của giảng viên
export const getInstructorCourseDetailApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/instructor/${courseId}/`));
};

// Lấy danh sách học viên của khóa học giảng viên
export const getInstructorCourseStudentsApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/instructor/${courseId}/students/`));
};

// Lấy kết quả bài kiểm tra của khóa học giảng viên
export const getInstructorCourseQuizResultsApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/instructor/${courseId}/quiz-results/`));
};

// Lấy dữ liệu phân tích (thống kê) của khóa học giảng viên
export const getInstructorCourseAnalyticsApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/instructor/${courseId}/analytics/`));
};

// Gửi thông báo đến học viên của khóa học
export const sendCourseNotificationApi = async (courseId, title, body) => {
  return request(() =>
    apiClient.post(`/api/courses/instructor/${courseId}/send-notification/`, { title, body })
  );
};

// Lấy danh sách câu hỏi Q&A của khóa học
export const getCourseQAApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/instructor/${courseId}/qa/`));
};

// Trả lời một câu hỏi trong phần Q&A của khóa học
export const replyCourseQAApi = async (courseId, questionId, content) => {
  return request(() =>
    apiClient.post(`/api/courses/instructor/${courseId}/qa/${questionId}/reply/`, { content })
  );
};

// Lấy danh sách bài tự luận học viên đã nộp
export const getEssaySubmissionsApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/instructor/${courseId}/essay-submissions/`));
};

// Chấm điểm bài tự luận của học viên
export const gradeEssayApi = async (courseId, answerId, score) => {
  return request(() =>
    apiClient.post(`/api/courses/instructor/${courseId}/grade-essay/`, { answer_id: answerId, score })
  );
};

// Lấy báo cáo học tập của khóa học
export const getLearningReportApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/instructor/${courseId}/learning-report/`));
};

// Lấy curriculum xem trước của khóa học
export const getCurriculumPreviewApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/${courseId}/curriculum/preview/`));
};

// Lấy curriculum cho trang học tập (dành cho học viên đã đăng ký)
export const getLearningCurriculumApi = async (courseId) => {
  return request(() => apiClient.get(`/api/learning/courses/${courseId}/curriculum/`));
};