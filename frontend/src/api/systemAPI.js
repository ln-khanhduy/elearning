import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// ==================== ACTIVITY LOGS ====================

// Lấy danh sách nhật ký hoạt động quản trị (có phân trang, lọc theo loại hành động và ngày)
export const getActivityLogsApi = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.action_type) query.append("action_type", params.action_type);
  if (params.date) query.append("date", params.date);
  if (params.page) query.append("page", params.page);
  if (params.page_size) query.append("page_size", params.page_size);
  const qs = query.toString();
  return request(() => apiClient.get(`/api/admin/activity-logs/${qs ? `?${qs}` : ""}`));
};

// Lấy danh sách các loại hành động khả dụng cho nhật ký
export const getActivityLogTypesApi = async () => {
  return request(() => apiClient.get("/api/admin/activity-logs/action-types/"));
};

// ==================== SYSTEM CONFIGS ====================

// Lấy cấu hình hệ thống hiện tại
export const getSystemConfigsApi = async () => {
  return request(() => apiClient.get("/api/admin/configs/"));
};

// Cập nhật cấu hình hệ thống
export const updateSystemConfigsApi = async (configs) => {
  return request(() => apiClient.put("/api/admin/configs/update/", { configs }));
};