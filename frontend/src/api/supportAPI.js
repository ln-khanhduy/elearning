import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// Lấy danh sách yêu cầu hỗ trợ của người dùng hiện tại
export const getMyRequestsApi = async () => {
  return request(() => apiClient.get("/api/support/my-requests/"));
};

// Gửi yêu cầu hỗ trợ mới
export const createRequestApi = async (data) => {
  return request(() => apiClient.post("/api/support/requests/create/", data));
};

// Xử lý (phản hồi/đóng) một yêu cầu hỗ trợ
export const processRequestApi = async (requestId, data) => {
  return request(() => apiClient.patch(`/api/support/requests/${requestId}/process/`, data));
};

// Lấy danh sách yêu cầu hỗ trợ (dành cho quản trị, lọc theo loại yêu cầu)
export const getAdminRequestsApi = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.request_type) query.set("request_type", params.request_type);
  const qs = query.toString();
  return request(() => apiClient.get(`/api/support/admin/requests/${qs ? `?${qs}` : ""}`));
};