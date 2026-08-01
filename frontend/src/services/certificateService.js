import { getMyCertificatesApi } from "../api/certificateAPI";

// Lấy danh sách chứng chỉ của người dùng hiện tại
export const getMyCertificates = async () => {
  const response = await getMyCertificatesApi();
  return response?.data || [];
};
