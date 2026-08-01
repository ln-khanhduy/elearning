import apiClient, { getErrorMessage } from "./apiClient";
const request = async (callback) => { try { const res = await callback(); return res.data; } catch (error) { throw new Error(getErrorMessage(error)); } };
// ==================== GIẢNG VIÊN ====================
// Lấy danh sách câu hỏi Q&A của khóa học (dành cho giảng viên, hỗ trợ lọc và phân trang)
export const getInstructorQuestionsApi = async (courseId, params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append("status", params.status);
  if (params.lesson_id) query.append("lesson_id", params.lesson_id);
  if (params.page) query.append("page", params.page);
  if (params.page_size) query.append("page_size", params.page_size);
  const qs = query.toString();
  return request(() => apiClient.get(`/api/courses/instructor/${courseId}/qa/${qs ? `?${qs}` : ""}`));
};
// Trả lời một câu hỏi Q&A (dành cho giảng viên)
export const replyInstructorQuestionApi = async (courseId, questionId, content) => {
  return request(() => apiClient.post(`/api/courses/instructor/${courseId}/qa/${questionId}/reply/`, { content }));
};
// ==================== HỌC VIÊN ====================
// Lấy danh sách câu hỏi Q&A của khóa học (dành cho học viên, hỗ trợ lọc và phân trang)
export const getStudentQuestionsApi = async (courseId, params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append("status", params.status);
  if (params.lesson_id) query.append("lesson_id", params.lesson_id);
  if (params.page) query.append("page", params.page);
  if (params.page_size) query.append("page_size", params.page_size);
  const qs = query.toString();
  return request(() => apiClient.get(`/api/courses/${courseId}/student/qa/${qs ? `?${qs}` : ""}`));
};
// Tạo câu hỏi Q&A mới (dành cho học viên)
export const createStudentQuestionApi = async (courseId, data) => {
  return request(() => apiClient.post(`/api/courses/${courseId}/student/qa/create/`, data));
};
// Lấy chi tiết một câu hỏi Q&A (dành cho học viên)
export const getStudentQuestionDetailApi = async (courseId, questionId) => {
  return request(() => apiClient.get(`/api/courses/${courseId}/student/qa/${questionId}/`));
};
// Trả lời một câu hỏi Q&A (dành cho học viên)
export const replyStudentQuestionApi = async (courseId, questionId, content) => {
  return request(() => apiClient.post(`/api/courses/${courseId}/student/qa/${questionId}/reply/`, { content }));
};
// Đóng một câu hỏi Q&A đã được giải đáp (dành cho học viên)
export const closeStudentQuestionApi = async (courseId, questionId) => {
  return request(() => apiClient.post(`/api/courses/${courseId}/student/qa/${questionId}/close/`));
};
