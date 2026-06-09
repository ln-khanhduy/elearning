import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getDashboardDataApi = async (year = null) => {
  const params = year ? { year } : {};
  return request(() => apiClient.get("/api/system/dashboard/", { params }));
};
