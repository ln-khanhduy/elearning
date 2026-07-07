import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getMyRequestsApi = async () => {
  return request(() => apiClient.get("/api/support/my-requests/"));
};

export const createRequestApi = async (data) => {
  return request(() => apiClient.post("/api/support/requests/create/", data));
};

export const processRequestApi = async (requestId, data) => {
  return request(() => apiClient.patch(`/api/support/requests/${requestId}/process/`, data));
};

export const getAdminRequestsApi = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.request_type) query.set("request_type", params.request_type);
  const qs = query.toString();
  return request(() => apiClient.get(`/api/support/admin/requests/${qs ? `?${qs}` : ""}`));
};