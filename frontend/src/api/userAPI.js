import { apiClient } from "./apiClient";

export const getCurrentUserApi = async () => {
  return await apiClient("/api/users/me/", {
    method: "GET",
  });
};