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

// Lấy danh sách câu hỏi của một bài tập
export const getQuestionsApi = async (quizId) => {
  return request(() => apiClient.get(`/api/quizzes/quizzes/${quizId}/questions/`));
};

// Tạo mới một câu hỏi trong bài tập
export const createQuestionApi = async (quizId, data) => {
  return request(() => apiClient.post(`/api/quizzes/quizzes/${quizId}/questions/create/`, data));
};

// Cập nhật thông tin câu hỏi
export const updateQuestionApi = async (questionId, data) => {
  return request(() => apiClient.patch(`/api/quizzes/questions/${questionId}/update/`, data));
};

// Xóa câu hỏi
export const deleteQuestionApi = async (questionId) => {
  return request(() => apiClient.delete(`/api/quizzes/questions/${questionId}/delete/`));
};

// ==================== QUESTION IMPORT ====================
// BE: /api/quizzes/quizzes/{quiz_id}/questions/import/

// Xem trước kết quả import câu hỏi từ file CSV/XLSX trước khi thực thi
export const importPreviewApi = async (quizId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return request(() => apiClient.post(`/api/quizzes/quizzes/${quizId}/questions/import/preview/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }));
};

// Thực thi import câu hỏi từ danh sách các dòng đã xem trước
export const importExecuteApi = async (quizId, rows) => {
  return request(() => apiClient.post(`/api/quizzes/quizzes/${quizId}/questions/import/execute/`, { rows }));
};

// Tải file mẫu (template) định dạng CSV hoặc XLSX để import câu hỏi
export const importTemplateApi = async (format = "csv") => {
  const res = await apiClient.get(`/api/quizzes/questions/import/template/`, {
    params: { file_format: format },
    responseType: "blob",
  });
  return res.data;
};


