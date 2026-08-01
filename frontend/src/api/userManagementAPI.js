import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// Lấy danh sách người dùng (học viên, giảng viên) có phân trang, tìm kiếm, lọc
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

// Khóa hoặc mở khóa tài khoản người dùng (cần lý do khi khóa)
export const toggleUserActiveApi = async (id, reason) => {
  const payload = {};
  if (reason) payload.reason = reason;
  return request(() => apiClient.patch(`/api/admin/users/${id}/toggle-active/`, payload));
};