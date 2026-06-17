import { getMyCertificatesApi } from "../api/certificateAPI";

export const getMyCertificates = async () => {
  const response = await getMyCertificatesApi();
  return response?.data || [];
};
