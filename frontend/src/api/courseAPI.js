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

// Lấy danh sách khóa học công khai (hỗ trợ tìm kiếm, lọc, phân trang)
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

// Lấy chi tiết một khóa học công khai
export const getCourseDetailApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/${courseId}/`));
};

// ==================== ADMIN COURSES ====================
// BE: /api/courses/admin/

// Lấy danh sách khóa học quản trị (có phân trang, lọc theo từ khóa/trạng thái/danh mục)
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

// Lấy chi tiết khóa học cho trang quản trị
export const getAdminCourseDetailApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/admin/${courseId}/`));
};

// Tạo khóa học mới (dùng FormData để gửi thumbnail)
export const createAdminCourseApi = async (data) => {
  return request(() =>
    apiClient.post("/api/courses/admin/create/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};

// Cập nhật thông tin khóa học (dùng FormData để gửi thumbnail)
export const updateAdminCourseApi = async (courseId, data) => {
  return request(() =>
    apiClient.patch(`/api/courses/admin/${courseId}/update/`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};

// Xóa khóa học
export const deleteAdminCourseApi = async (courseId) => {
  return request(() => apiClient.delete(`/api/courses/admin/${courseId}/delete/`));
};

// Xuất bản khóa học (đổi trạng thái thành PUBLISHED)
export const publishAdminCourseApi = async (courseId) => {
  return request(() => apiClient.patch(`/api/courses/admin/${courseId}/publish/`));
};

// Ẩn khóa học (đổi trạng thái thành HIDDEN)
export const hideAdminCourseApi = async (courseId) => {
  return request(() => apiClient.patch(`/api/courses/admin/${courseId}/hide/`));
};

// Gán giảng viên phụ trách cho khóa học
export const assignInstructorApi = async (courseId, instructorId) => {
  return request(() =>
    apiClient.patch(`/api/courses/admin/${courseId}/assign-instructor/`, {
      instructor_id: instructorId,
    })
  );
};

// Lấy giảng viên đang được gán cho khóa học
export const getAssignedInstructorApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/admin/${courseId}/assigned-instructor/`));
};

// ==================== INSTRUCTOR COURSES ====================
// BE: /api/courses/instructor/

// Lấy danh sách khóa học của giảng viên hiện tại (có phân trang)
export const getInstructorCoursesApi = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.page_size) query.append("page_size", params.page_size);
  const qs = query.toString();
  return request(() => apiClient.get(`/api/courses/instructor/${qs ? `?${qs}` : ""}`));
};

// Lấy chi tiết khóa học của giảng viên
export const getInstructorCourseDetailApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/instructor/${courseId}/`));
};

// Lấy danh sách học viên của khóa học giảng viên
export const getInstructorCourseStudentsApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/instructor/${courseId}/students/`));
};

// Lấy dữ liệu phân tích (thống kê) của khóa học giảng viên
export const getInstructorCourseAnalyticsApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/instructor/${courseId}/analytics/`));
};

// ==================== CURRICULUM ====================
// BE: /api/courses/{course_id}/curriculum/

// Lấy nội dung curriculum (chương + bài học) để xem trước
export const getCurriculumApi = async (courseId) => {
  return request(() => apiClient.get(`/api/courses/${courseId}/curriculum/preview/`));
};

// ==================== CATEGORIES ====================
// BE: /api/courses/categories/

// Lấy danh sách danh mục khóa học
export const getCategoriesApi = async () => {
  return request(() => apiClient.get("/api/courses/categories/"));
};

// Tạo mới danh mục khóa học
export const createCategoryApi = async (name) => {
  return request(() => apiClient.post("/api/courses/categories/create/", { name }));
};

// Cập nhật tên danh mục khóa học
export const updateCategoryApi = async (categoryId, name) => {
  return request(() => apiClient.patch(`/api/courses/categories/${categoryId}/update/`, { name }));
};

// Xóa danh mục khóa học
export const deleteCategoryApi = async (categoryId) => {
  return request(() => apiClient.delete(`/api/courses/categories/${categoryId}/delete/`));
};
