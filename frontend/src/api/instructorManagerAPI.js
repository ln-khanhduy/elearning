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
 * Lấy danh sách giảng viên (có phân trang, tìm kiếm, lọc).
 * @param {Object} params - Query params
 * @param {string} params.search - Tìm kiếm theo họ tên hoặc email
 * @param {string} params.status - 'active' | 'locked' | 'all'
 * @param {number} params.page - Trang hiện tại
 * @param {number} params.page_size - Số lượng item mỗi trang
 * @returns {Promise<Object>} { results, total, page, page_size, total_pages }
 */
export const getManagedInstructorsApi = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.status) query.append("status", params.status);
  if (params.page) query.append("page", params.page);
  if (params.page_size) query.append("page_size", params.page_size);
  const qs = query.toString();
  return request(() => apiClient.get(`/api/instructors/manage/${qs ? `?${qs}` : ""}`));
};

/**
 * Khóa tài khoản giảng viên - yêu cầu lý do khóa.
 * @param {string} id - UUID của giảng viên
 * @param {string} reason - Lý do khóa tài khoản
 * @returns {Promise<Object>} { id, is_active, message }
 */
export const lockInstructorApi = async (id, reason) => {
  return request(() => apiClient.patch(`/api/instructors/manage/${id}/lock/`, { reason }));
};

/**
 * Mở khóa tài khoản giảng viên - không cần lý do.
 * @param {string} id - UUID của giảng viên
 * @returns {Promise<Object>} { id, is_active, message }
 */
export const unlockInstructorApi = async (id) => {
  return request(() => apiClient.patch(`/api/instructors/manage/${id}/unlock/`));
};
