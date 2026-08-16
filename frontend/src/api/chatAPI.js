import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    const e = new Error(getErrorMessage(error));
    e.cause = error;
    throw e;
  }
};

// ==================== CHAT ====================

// Danh sách phòng chat của user (tab khóa còn hạn  hết hạn bị loại khỏi danh sách)
export const getChatRoomsApi = async () => {
  return request(() => apiClient.get("/api/chat/rooms/"));
};

// Lịch sử tin nhắn của phòng (phân trang)
export const getChatMessagesApi = async (roomId, page = 1, pageSize = 50) => {
  return request(() =>
    apiClient.get(`/api/chat/rooms/${roomId}/messages/`, {
      params: { page, page_size: pageSize },
    })
  );
};

// Gửi tin nhắn TEXT
export const sendChatMessageApi = async (roomId, content) => {
  return request(() => apiClient.post(`/api/chat/rooms/${roomId}/messages/send/`, { content }));
};

// Báo cáo vi phạm
export const reportChatMessageApi = async (messageId, reason) => {
  return request(() => apiClient.post(`/api/chat/messages/${messageId}/report/`, { reason }));
};

// ==================== VOICE (Cloudinary signed upload  Secret giữ Backend ) ====================

// Xin Cloudinary signed upload params (folder voice/) - Secret chỉ nằm Backend
export const getVoiceUploadSignatureApi = async (roomId) => {
  return request(() => apiClient.post(`/api/chat/rooms/${roomId}/voice/signature/`));
};

// Xác nhận asset đã upload  tạo ChatMessage VOICE
export const confirmVoiceMessageApi = async (roomId, data) => {
  return request(() => apiClient.post(`/api/chat/rooms/${roomId}/voice/confirm/`, data));
};

// ==================== ADMIN CHAT REPORTS (USER_MANAGER) ====================

export const getChatReportsApi = async (status = "", page = 1, pageSize = 20) => {
  return request(() =>
    apiClient.get("/api/chat/admin/reports/", {
      params: { status, page, page_size: pageSize },
    })
  );
};

export const reviewChatReportApi = async (reportId, note = "") => {
  return request(() => apiClient.post(`/api/chat/admin/reports/${reportId}/review/`, { note }));
};

export const resolveChatReportApi = async (reportId, action, note = "") => {
  return request(() => apiClient.post(`/api/chat/admin/reports/${reportId}/resolve/`, { action, note }));
};
