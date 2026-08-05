import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// Lấy danh sách giảng viên đủ điều kiện thanh toán (đã group theo giảng viên, kèm thông tin ngân hàng)
export const getPayoutsApi = async () => {
  return request(() => apiClient.get("/api/payments/admin/payouts/"));
};

// Thanh toán cho 1 giảng viên - bắt buộc gửi kèm thông tin ngân hàng đã xác nhận
export const instructorPayoutApi = async (instructorId, transactionIds, bankInfo) => {
  return request(() =>
    apiClient.post(`/api/payments/admin/payouts/instructor/${instructorId}/pay/`, {
      transaction_ids: transactionIds,
      confirmed_bank_name: bankInfo.bank_name,
      confirmed_account_number: bankInfo.bank_account_number,
      confirmed_account_name: bankInfo.bank_account_name,
    })
  );
};