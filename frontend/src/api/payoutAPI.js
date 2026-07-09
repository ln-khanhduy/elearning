import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getPayoutsApi = async () => {
  return request(() => apiClient.get("/api/payments/admin/payouts/"));
};

export const batchPayoutApi = async (transactionIds) => {
  return request(() => apiClient.post("/api/payments/admin/payouts/batch/", { transaction_ids: transactionIds }));
};
