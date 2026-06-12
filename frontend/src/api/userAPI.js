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
  return request(() => apiClient.patch("/api/users/me/update/", data));
};

export const changePasswordApi = async (data) => {
  return request(() => apiClient.patch("/api/users/me/change-password/", data));
};

export const applyInstructorApi = async (formData) => {
  return request(() => apiClient.post("/api/users/instructors/apply/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }));
};

export const getMyInstructorApplicationApi = async () => {
  return request(() => apiClient.get("/api/users/instructors/my-application/"));
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

export const uploadCertificateApi = async (applicationId, title, file) => {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", file);
  const response = await apiClient.post(
    `/api/users/instructors/applications/${applicationId}/certificates/`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};

export const getCertificatesApi = async (applicationId) => {
  const response = await apiClient.get(
    `/api/users/instructors/applications/${applicationId}/certificates/list/`
  );
  return response.data;
};

export const deleteCertificateApi = async (applicationId, certificateId) => {
  const response = await apiClient.delete(
    `/api/users/instructors/applications/${applicationId}/certificates/${certificateId}/`
  );
  return response.data;
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
