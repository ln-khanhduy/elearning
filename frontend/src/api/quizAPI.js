import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// ==================== QUIZZES ====================
// BE: /api/quizzes/lessons/{lesson_id}/quizzes/

// Lấy danh sách bài tập của một bài học
export const getQuizzesApi = async (lessonId) => {
  return request(() => apiClient.get(`/api/quizzes/lessons/${lessonId}/quizzes/`));
};

// Lấy chi tiết một bài tập
export const getQuizDetailApi = async (quizId) => {
  return request(() => apiClient.get(`/api/quizzes/quizzes/${quizId}/`));
};

// Tạo mới một bài tập trong bài học
export const createQuizApi = async (lessonId, data) => {
  return request(() => apiClient.post(`/api/quizzes/lessons/${lessonId}/quizzes/create/`, data));
};

// Cập nhật thông tin bài tập
export const updateQuizApi = async (quizId, data) => {
  return request(() => apiClient.patch(`/api/quizzes/quizzes/${quizId}/update/`, data));
};

// Xóa bài tập
export const deleteQuizApi = async (quizId) => {
  return request(() => apiClient.delete(`/api/quizzes/quizzes/${quizId}/delete/`));
};

