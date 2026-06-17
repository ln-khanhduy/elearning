import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// ==================== CERTIFICATES ====================
// BE: /api/certificates/

export const getMyCertificatesApi = async () => {
  return request(() => apiClient.get("/api/certificates/my-certificates/"));
};
