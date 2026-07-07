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

export const getActivityLogsApi = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.action_type) query.append("action_type", params.action_type);
  if (params.date) query.append("date", params.date);
  if (params.page) query.append("page", params.page);
  if (params.page_size) query.append("page_size", params.page_size);
  const qs = query.toString();
  return request(() => apiClient.get(`/api/admin/activity-logs/${qs ? `?${qs}` : ""}`));
};

export const getActivityLogTypesApi = async () => {
  return request(() => apiClient.get("/api/admin/activity-logs/action-types/"));
};

// ==================== SYSTEM CONFIGS ====================

export const getSystemConfigsApi = async () => {
  return request(() => apiClient.get("/api/admin/configs/"));
};

export const updateSystemConfigsApi = async (configs) => {
  return request(() => apiClient.put("/api/admin/configs/update/", { configs }));
};