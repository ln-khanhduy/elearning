import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// ==================== PUBLIC COURSES ====================
// BE: /api/courses/

export const getCoursesApi = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.q) query.append("q", params.q);
  if (params.status) query.append("status", params.status);
  if (params.category) query.append("category", params.category);
  if (params.instructor) query.append("instructor", params.instructor);
  if (params.page) query.append("page", params.page);
  if (params.page_size) query.append("page_size", params.page_size);
  const qs = query.toString();
  return request(() => apiClient.get(`/api/courses/${qs ? `?${qs}` : ""}`));
};

export const getCourseDetailApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/${courseId}/`));
};

// ==================== ADMIN COURSES ====================
// BE: /api/courses/admin/

export const getAdminCoursesApi = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.q) query.append("q", params.q);
  if (params.status) query.append("status", params.status);
  if (params.category) query.append("category", params.category);
  if (params.page) query.append("page", params.page);
  if (params.page_size) query.append("page_size", params.page_size);
  const qs = query.toString();
  return request(() => apiClient.get(`/api/courses/admin/${qs ? `?${qs}` : ""}`));
};

export const getAdminCourseDetailApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/admin/${courseId}/`));
};

export const createAdminCourseApi = async (data) => {
  return request(() =>
    apiClient.post("/api/courses/admin/create/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};

export const updateAdminCourseApi = async (courseId, data) => {
  return request(() =>
    apiClient.patch(`/api/courses/admin/${courseId}/update/`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};

export const deleteAdminCourseApi = async (courseId) => {
  return request(() => apiClient.delete(`/api/courses/admin/${courseId}/delete/`));
};

export const publishAdminCourseApi = async (courseId) => {
  return request(() => apiClient.patch(`/api/courses/admin/${courseId}/publish/`));
};

export const hideAdminCourseApi = async (courseId) => {
  return request(() => apiClient.patch(`/api/courses/admin/${courseId}/hide/`));
};

export const assignInstructorApi = async (courseId, instructorId) => {
  return request(() =>
    apiClient.patch(`/api/courses/admin/${courseId}/assign-instructor/`, {
      instructor_id: instructorId,
    })
  );
};

export const getAssignedInstructorApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/admin/${courseId}/assigned-instructor/`));
};

// ==================== INSTRUCTOR COURSES ====================
// BE: /api/courses/instructor/

export const getInstructorCoursesApi = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.page_size) query.append("page_size", params.page_size);
  const qs = query.toString();
  return request(() => apiClient.get(`/api/courses/instructor/${qs ? `?${qs}` : ""}`));
};

export const getInstructorCourseDetailApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/instructor/${courseId}/`));
};

export const getInstructorCourseStudentsApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/instructor/${courseId}/students/`));
};

export const getInstructorCourseAnalyticsApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/instructor/${courseId}/analytics/`));
};

// ==================== CURRICULUM ====================
// BE: /api/courses/{course_id}/curriculum/

export const getCurriculumApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/${courseId}/curriculum/preview/`));
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
