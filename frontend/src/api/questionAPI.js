import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// ==================== QUESTIONS ====================
// BE: /api/quizzes/quizzes/{quiz_id}/questions/

export const getQuestionsApi = async (quizId) => {
  return request(() => apiClient.get(`/api/quizzes/quizzes/${quizId}/questions/`));
};

export const createQuestionApi = async (quizId, data) => {
  return request(() => apiClient.post(`/api/quizzes/quizzes/${quizId}/questions/create/`, data));
};

export const updateQuestionApi = async (questionId, data) => {
  return request(() => apiClient.patch(`/api/quizzes/questions/${questionId}/update/`, data));
};

export const deleteQuestionApi = async (questionId) => {
  return request(() => apiClient.delete(`/api/quizzes/questions/${questionId}/delete/`));
};

// ==================== QUESTION IMPORT ====================
// BE: /api/quizzes/quizzes/{quiz_id}/questions/import/

export const importPreviewApi = async (quizId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return request(() => apiClient.post(`/api/quizzes/quizzes/${quizId}/questions/import/preview/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }));
};

export const importExecuteApi = async (quizId, rows) => {
  return request(() => apiClient.post(`/api/quizzes/quizzes/${quizId}/questions/import/execute/`, { rows }));
};

export const importTemplateApi = async (format = "csv") => {
  const res = await apiClient.get(`/api/quizzes/questions/import/template/`, {
    params: { file_format: format },
    responseType: "blob",
  });
  return res.data;
};


