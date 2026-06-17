import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Lấy danh sách người dùng (Student, Instructor) có phân trang, tìm kiếm, lọc.
 * @param {Object} params - Query params
 * @param {string} params.search - Tìm kiếm theo họ tên hoặc email
 * @param {string} params.role - 'all' | 'student' | 'instructor'
 * @param {string} params.status - 'all' | 'active' | 'locked'
 * @param {number} params.page - Trang hiện tại
 * @param {number} params.page_size - Số lượng item mỗi trang
 * @returns {Promise<Object>} { results, total, page, page_size, total_pages }
 */
export const getUsersApi = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.role) query.append("role", params.role);
  if (params.status) query.append("status", params.status);
  if (params.page) query.append("page", params.page);
  if (params.page_size) query.append("page_size", params.page_size);
  const qs = query.toString();
  return request(() => apiClient.get(`/api/admin/users/${qs ? `?${qs}` : ""}`));
};

/**
 * Khóa hoặc mở khóa tài khoản người dùng.
 * @param {string} id - UUID của người dùng
 * @param {string} [reason] - Lý do khóa (chỉ cần khi khóa)
 * @returns {Promise<Object>} { id, is_active, message }
 */
export const toggleUserActiveApi = async (id, reason) => {
  const payload = {};
  if (reason) payload.reason = reason;
  return request(() => apiClient.patch(`/api/admin/users/${id}/toggle-active/`, payload));
};
