import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getNotificationsApi = async (page = 1, pageSize = 20) => {
  return request(() => apiClient.get(`/api/notifications/?page=${page}&page_size=${pageSize}`));
};

export const getUnreadCountApi = async () => {
  return request(() => apiClient.get("/api/notifications/unread-count/"));
};

export const markNotificationReadApi = async (notificationId) => {
  return request(() => apiClient.patch(`/api/notifications/${notificationId}/read/`));
};

export const markAllNotificationsReadApi = async () => {
  return request(() => apiClient.patch("/api/notifications/read-all/"));
};

export const deleteAllNotificationsApi = async () => {
  return request(() => apiClient.delete("/api/notifications/delete-all/"));
};
