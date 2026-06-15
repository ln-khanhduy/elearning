import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// ==================== CHAPTERS ====================
// BE: /api/lessons/courses/{course_id}/chapters/

export const getChaptersApi = async (courseId) => {
  return request(() => apiClient.get(`/api/lessons/courses/${courseId}/chapters/`));
};

export const createChapterApi = async (courseId, data) => {
  return request(() => apiClient.post(`/api/lessons/courses/${courseId}/chapters/create/`, data));
};

export const updateChapterApi = async (chapterId, data) => {
  return request(() => apiClient.patch(`/api/lessons/chapters/${chapterId}/update/`, data));
};

export const deleteChapterApi = async (chapterId) => {
  return request(() => apiClient.delete(`/api/lessons/chapters/${chapterId}/delete/`));
};

export const reorderChaptersApi = async (courseId, chapters) => {
  return request(() =>
    apiClient.patch(`/api/lessons/courses/${courseId}/chapters/reorder/`, { chapters })
  );
};
