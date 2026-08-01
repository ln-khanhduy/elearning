import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// Lấy dữ liệu thống kê tổng quan dashboard quản trị (có thể lọc theo năm)
export const getDashboardDataApi = async (year = null) => {
  const params = year ? { year } : {};
  return request(() => apiClient.get("/api/admin/dashboard/", { params }));
};
