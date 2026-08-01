import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// Lấy danh sách thông báo của người dùng (có phân trang)
export const getNotificationsApi = async (page = 1, pageSize = 20) => {
  return request(() => apiClient.get(`/api/notifications/?page=${page}&page_size=${pageSize}`));
};

// Lấy số lượng thông báo chưa đọc
export const getUnreadCountApi = async () => {
  return request(() => apiClient.get("/api/notifications/unread-count/"));
};

// Đánh dấu một thông báo đã đọc
export const markNotificationReadApi = async (notificationId) => {
  return request(() => apiClient.patch(`/api/notifications/${notificationId}/read/`));
};

// Đánh dấu tất cả thông báo đã đọc
export const markAllNotificationsReadApi = async () => {
  return request(() => apiClient.patch("/api/notifications/read-all/"));
};

// Xóa toàn bộ thông báo của người dùng
export const deleteAllNotificationsApi = async () => {
  return request(() => apiClient.delete("/api/notifications/delete-all/"));
};
