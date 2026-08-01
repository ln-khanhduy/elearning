import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// Lấy danh sách thanh toán cho giảng viên (payout)
export const getPayoutsApi = async () => {
  return request(() => apiClient.get("/api/payments/admin/payouts/"));
};

// Thực hiện thanh toán hàng loạt cho nhiều giao dịch
export const batchPayoutApi = async (transactionIds) => {
  return request(() => apiClient.post("/api/payments/admin/payouts/batch/", { transaction_ids: transactionIds }));
};
