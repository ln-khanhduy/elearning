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

// Lấy danh sách chương của khóa học
export const getChaptersApi = async (courseId) => {
  return request(() => apiClient.get(`/api/lessons/courses/${courseId}/chapters/`));
};

// Tạo mới một chương cho khóa học
export const createChapterApi = async (courseId, data) => {
  return request(() => apiClient.post(`/api/lessons/courses/${courseId}/chapters/create/`, data));
};

// Cập nhật thông tin chương
export const updateChapterApi = async (chapterId, data) => {
  return request(() => apiClient.patch(`/api/lessons/chapters/${chapterId}/update/`, data));
};

// Xóa chương
export const deleteChapterApi = async (chapterId) => {
  return request(() => apiClient.delete(`/api/lessons/chapters/${chapterId}/delete/`));
};

// Sắp xếp lại thứ tự các chương của khóa học
export const reorderChaptersApi = async (courseId, chapters) => {
  return request(() =>
    apiClient.patch(`/api/lessons/courses/${courseId}/chapters/reorder/`, { chapters })
  );
};
