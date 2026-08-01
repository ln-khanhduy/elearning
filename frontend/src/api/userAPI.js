import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// Lấy thông tin người dùng hiện tại
export const getCurrentUser = async () => {
  return request(() => apiClient.get("/api/users/me/"));
};

// Cập nhật hồ sơ người dùng (hỗ trợ gửi dạng FormData khi có ảnh đại diện)
export const updateProfileApi = async (data) => {
  const isFormData = data instanceof FormData;
  const config = isFormData
    ? { headers: { "Content-Type": "multipart/form-data" } }
    : {};
  return request(() => apiClient.patch("/api/users/me/update/", data, config));
};

// Đổi mật khẩu người dùng
export const changePasswordApi = async (data) => {
  return request(() => apiClient.patch("/api/users/me/change-password/", data));
};

// Gửi đơn đăng ký trở thành giảng viên
export const applyInstructorApi = async (formData) => {
  return request(() => apiClient.post("/api/users/instructors/apply/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }));
};

// Lấy danh sách đơn đăng ký giảng viên (lọc theo trạng thái nếu có)
export const getInstructorApplicationsApi = async (statusFilter = "") => {
  const params = statusFilter ? `?status=${statusFilter}` : "";
  return request(() => apiClient.get(`/api/users/instructors/applications/${params}`));
};

// Lấy chi tiết một đơn đăng ký giảng viên
export const getInstructorApplicationDetailApi = async (applicationId) => {
  return request(() => apiClient.get(`/api/users/instructors/applications/${applicationId}/`));
};

// Duyệt hoặc từ chối đơn đăng ký giảng viên
export const reviewInstructorApplicationApi = async (applicationId, data) => {
  return request(() => apiClient.patch(`/api/users/instructors/applications/${applicationId}/review/`, data));
};

// Trả về URL xem trước chứng chỉ của đơn đăng ký (dùng trực tiếp cho thẻ <img>/<a>)
export const previewCertificateApi = (applicationId, certificateId) => {
  return `${apiClient.defaults.baseURL}/api/users/instructors/applications/${applicationId}/certificates/${certificateId}/preview/`;
};

// Trả về URL xem trước CV của đơn đăng ký (dùng trực tiếp cho thẻ <img>/<a>)
export const previewCvApi = (applicationId) => {
  return `${apiClient.defaults.baseURL}/api/users/instructors/applications/${applicationId}/cv/preview/`;
};

// Liên kết tài khoản Google với tài khoản hiện tại
export const linkGoogleAccountApi = async (idToken) => {
  return request(() => apiClient.post("/api/users/link-google/", {
    id_token: idToken,
  }));
};

// ===== Instructor Profile Management =====

// Tải lên chứng chỉ của giảng viên
export const uploadInstructorCertificateApi = async (data) => {
  return request(() => apiClient.post("/api/users/instructors/certificates/", data));
};

// Xóa chứng chỉ của giảng viên
export const deleteInstructorCertificateApi = async (certificateId) => {
  return request(() => apiClient.delete(`/api/users/instructors/certificates/${certificateId}/`));
};

// Lấy danh sách chứng chỉ của giảng viên
export const getInstructorCertificatesApi = async () => {
  return request(() => apiClient.get("/api/users/instructors/certificates/"));
};