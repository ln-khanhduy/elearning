import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// Lấy danh sách giảng viên có phân trang, tìm kiếm, lọc
export const getManagedInstructorsApi = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.status) query.append("status", params.status);
  if (params.page) query.append("page", params.page);
  if (params.page_size) query.append("page_size", params.page_size);
  const qs = query.toString();
  return request(() => apiClient.get(`/api/instructors/manage/${qs ? `?${qs}` : ""}`));
};

// Khóa tài khoản giảng viên (cần lý do khóa)
export const lockInstructorApi = async (id, reason) => {
  return request(() => apiClient.patch(`/api/instructors/manage/${id}/lock/`, { reason }));
};

// Mở khóa tài khoản giảng viên
export const unlockInstructorApi = async (id) => {
  return request(() => apiClient.patch(`/api/instructors/manage/${id}/unlock/`));
};