import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// ==================== COURSES ====================
// BE: /api/courses/

export const getCoursesApi = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.q) query.append("q", params.q);
  if (params.status) query.append("status", params.status);
  if (params.category) query.append("category", params.category);
  const qs = query.toString();
  return request(() => apiClient.get(`/api/courses/${qs ? `?${qs}` : ""}`));
};

export const getCourseDetailApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/${courseId}/`));
};

export const createCourseApi = async (data) => {
  return request(() =>
    apiClient.post("/api/courses/create/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};

export const createFullCourseApi = async (data) => {
  return request(() =>
    apiClient.post("/api/courses/create-full/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};

export const updateCourseApi = async (courseId, data) => {
  return request(() =>
    apiClient.patch(`/api/courses/${courseId}/update/`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};

export const deleteCourseApi = async (courseId) => {
  return request(() => apiClient.delete(`/api/courses/${courseId}/delete/`));
};

export const submitCourseReviewApi = async (courseId) => {
  return request(() => apiClient.patch(`/api/courses/${courseId}/submit-review/`));
};

export const getPendingCoursesApi = async () => {
  return request(() => apiClient.get("/api/courses/pending/"));
};

export const approveCourseApi = async (courseId) => {
  return request(() => apiClient.patch(`/api/courses/${courseId}/approve/`));
};

export const rejectCourseApi = async (courseId, approvalNote) => {
  return request(() =>
    apiClient.patch(`/api/courses/${courseId}/reject/`, { approval_note: approvalNote })
  );
};

export const publishCourseApi = async (courseId) => {
  return request(() => apiClient.patch(`/api/courses/${courseId}/publish/`));
};

export const hideCourseApi = async (courseId) => {
  return request(() => apiClient.patch(`/api/courses/${courseId}/hide/`));
};

export const unhideCourseApi = async (courseId) => {
  return request(() => apiClient.patch(`/api/courses/${courseId}/unhide/`));
};

// ==================== SECTIONS ====================
// BE: /api/lessons/courses/{course_id}/sections/

export const getSectionsApi = async (courseId) => {
  return request(() => apiClient.get(`/api/lessons/courses/${courseId}/sections/`));
};

export const createSectionApi = async (courseId, data) => {
  return request(() => apiClient.post(`/api/lessons/courses/${courseId}/sections/create/`, data));
};

export const updateSectionApi = async (sectionId, data) => {
  return request(() => apiClient.patch(`/api/lessons/sections/${sectionId}/update/`, data));
};

export const deleteSectionApi = async (sectionId) => {
  return request(() => apiClient.delete(`/api/lessons/sections/${sectionId}/delete/`));
};

export const reorderSectionsApi = async (courseId, sections) => {
  return request(() =>
    apiClient.patch(`/api/lessons/courses/${courseId}/sections/reorder/`, { sections })
  );
};

// ==================== LESSONS ====================
// BE: /api/lessons/sections/{section_id}/lessons/

export const getLessonsApi = async (sectionId) => {
  return request(() => apiClient.get(`/api/lessons/sections/${sectionId}/lessons/`));
};

export const getLessonDetailApi = async (lessonId) => {
  return request(() => apiClient.get(`/api/lessons/lessons/${lessonId}/`));
};

export const createLessonApi = async (sectionId, data) => {
  return request(() =>
    apiClient.post(`/api/lessons/sections/${sectionId}/lessons/create/`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};

export const updateLessonApi = async (lessonId, data) => {
  return request(() =>
    apiClient.patch(`/api/lessons/lessons/${lessonId}/update/`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};

export const deleteLessonApi = async (lessonId) => {
  return request(() => apiClient.delete(`/api/lessons/lessons/${lessonId}/delete/`));
};

export const reorderLessonsApi = async (sectionId, lessons) => {
  return request(() =>
    apiClient.patch(`/api/lessons/sections/${sectionId}/lessons/reorder/`, { lessons })
  );
};

// ==================== CATEGORIES ====================
// BE: /api/courses/categories/

export const getCategoriesApi = async () => {
  return request(() => apiClient.get("/api/courses/categories/"));
};

export const createCategoryApi = async (name) => {
  return request(() => apiClient.post("/api/courses/categories/create/", { name }));
};

export const updateCategoryApi = async (categoryId, name) => {
  return request(() => apiClient.patch(`/api/courses/categories/${categoryId}/update/`, { name }));
};

export const deleteCategoryApi = async (categoryId) => {
  return request(() => apiClient.delete(`/api/courses/categories/${categoryId}/delete/`));
};

// ==================== TAGS ====================
// BE: /api/courses/tags/

export const getTagsApi = async () => {
  return request(() => apiClient.get("/api/courses/tags/"));
};

export const createTagApi = async (name) => {
  return request(() => apiClient.post("/api/courses/tags/create/", { name }));
};

export const updateTagApi = async (tagId, name) => {
  return request(() => apiClient.patch(`/api/courses/tags/${tagId}/update/`, { name }));
};

export const deleteTagApi = async (tagId) => {
  return request(() => apiClient.delete(`/api/courses/tags/${tagId}/delete/`));
};
