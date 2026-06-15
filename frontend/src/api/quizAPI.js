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

export const getQuizzesApi = async (lessonId) => {
  return request(() => apiClient.get(`/api/quizzes/lessons/${lessonId}/quizzes/`));
};

export const getQuizDetailApi = async (quizId) => {
  return request(() => apiClient.get(`/api/quizzes/quizzes/${quizId}/`));
};

export const createQuizApi = async (lessonId, data) => {
  return request(() => apiClient.post(`/api/quizzes/lessons/${lessonId}/quizzes/create/`, data));
};

export const updateQuizApi = async (quizId, data) => {
  return request(() => apiClient.patch(`/api/quizzes/quizzes/${quizId}/update/`, data));
};

export const deleteQuizApi = async (quizId) => {
  return request(() => apiClient.delete(`/api/quizzes/quizzes/${quizId}/delete/`));
};
