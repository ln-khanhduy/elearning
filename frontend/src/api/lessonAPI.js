import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getLessonsApi = async (chapterId) =>
  request(() => apiClient.get(`/api/lessons/chapters/${chapterId}/lessons/`));

export const getLessonDetailApi = async (lessonId) =>
  request(() => apiClient.get(`/api/lessons/lessons/${lessonId}/`));

export const initBunnyUploadApi = async (title) =>
  request(() => apiClient.post("/api/lessons/bunny/init-upload/", { title }));

export const createLessonApi = async (chapterId, data) =>
  request(() => apiClient.post(`/api/lessons/chapters/${chapterId}/lessons/create/`, data));

export const updateLessonApi = async (lessonId, data) =>
  request(() => apiClient.patch(`/api/lessons/lessons/${lessonId}/update/`, data));

export const deleteLessonApi = async (lessonId) =>
  request(() => apiClient.delete(`/api/lessons/lessons/${lessonId}/delete/`));

export const reorderLessonsApi = async (chapterId, lessons) =>
  request(() => apiClient.patch(`/api/lessons/chapters/${chapterId}/lessons/reorder/`, { lessons }));