import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getCurrentUser = async () => {
  return request(() => apiClient.get("/api/users/me/"));
};

export const updateProfileApi = async (data) => {
  const isFormData = data instanceof FormData;
  const config = isFormData
    ? { headers: { "Content-Type": "multipart/form-data" } }
    : {};
  return request(() => apiClient.patch("/api/users/me/update/", data, config));
};

export const changePasswordApi = async (data) => {
  return request(() => apiClient.patch("/api/users/me/change-password/", data));
};

export const applyInstructorApi = async (formData) => {
  return request(() => apiClient.post("/api/users/instructors/apply/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }));
};

export const getInstructorApplicationsApi = async (statusFilter = "") => {
  const params = statusFilter ? `?status=${statusFilter}` : "";
  return request(() => apiClient.get(`/api/users/instructors/applications/${params}`));
};

export const getInstructorApplicationDetailApi = async (applicationId) => {
  return request(() => apiClient.get(`/api/users/instructors/applications/${applicationId}/`));
};

export const reviewInstructorApplicationApi = async (applicationId, data) => {
  return request(() => apiClient.patch(`/api/users/instructors/applications/${applicationId}/review/`, data));
};

export const previewCertificateApi = (applicationId, certificateId) => {
  return `${apiClient.defaults.baseURL}/api/users/instructors/applications/${applicationId}/certificates/${certificateId}/preview/`;
};

export const previewCvApi = (applicationId) => {
  return `${apiClient.defaults.baseURL}/api/users/instructors/applications/${applicationId}/cv/preview/`;
};

export const linkGoogleAccountApi = async (idToken) => {
  return request(() => apiClient.post("/api/users/link-google/", {
    id_token: idToken,
  }));
};

// ===== Instructor Profile Management =====

export const uploadInstructorCertificateApi = async (data) => {
  return request(() => apiClient.post("/api/users/instructors/certificates/", data));
};

export const deleteInstructorCertificateApi = async (certificateId) => {
  return request(() => apiClient.delete(`/api/users/instructors/certificates/${certificateId}/`));
};

export const getInstructorCertificatesApi = async () => {
  return request(() => apiClient.get("/api/users/instructors/certificates/"));
};