import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// ==================== LESSONS ====================
// BE: /api/lessons/chapters/{chapter_id}/lessons/

export const getLessonsApi = async (chapterId) => {
  return request(() => apiClient.get(`/api/lessons/chapters/${chapterId}/lessons/`));
};

export const getLessonDetailApi = async (lessonId) => {
  return request(() => apiClient.get(`/api/lessons/lessons/${lessonId}/`));
};

export const createLessonApi = async (chapterId, data) => {
  return request(() =>
    apiClient.post(`/api/lessons/chapters/${chapterId}/lessons/create/`, data)
  );
};

export const updateLessonApi = async (lessonId, data) => {
  return request(() =>
    apiClient.patch(`/api/lessons/lessons/${lessonId}/update/`, data)
  );
};

export const deleteLessonApi = async (lessonId) => {
  return request(() => apiClient.delete(`/api/lessons/lessons/${lessonId}/delete/`));
};

export const reorderLessonsApi = async (chapterId, lessons) => {
  return request(() =>
    apiClient.patch(`/api/lessons/chapters/${chapterId}/lessons/reorder/`, { lessons })
  );
};
