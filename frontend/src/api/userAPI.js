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
