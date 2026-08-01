import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// ==================== STRIPE ====================

// Tạo phiên thanh toán Stripe cho khóa học
export const createStripeCheckoutApi = async (courseId) => {
  return request(() =>
    apiClient.post(`/api/payments/stripe/courses/${courseId}/checkout/`)
  );
};

// Xác minh thanh toán Stripe sau khi chuyển hướng về
export const verifyStripePaymentApi = async (sessionId) => {
  return request(() =>
    apiClient.post("/api/payments/stripe/verify/", { session_id: sessionId })
  );
};

// ==================== TRANSACTIONS ====================

// Lấy chi tiết một giao dịch
export const getTransactionDetailApi = async (transactionId) => {
  return request(() =>
    apiClient.get(`/api/payments/transactions/${transactionId}/`)
  );
};

// ==================== INSTRUCTOR ====================

// Lấy dữ liệu doanh thu của giảng viên
export const getInstructorRevenueApi = async () => {
  return request(() => apiClient.get("/api/payments/instructor/revenue/"));
};

// ==================== ADMIN ====================

// Lấy danh sách giao dịch quản trị (có lọc theo trạng thái, nhà cung cấp, khóa học, học viên, ngày)
export const getAdminTransactionsApi = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append("status", params.status);
  if (params.provider) query.append("provider", params.provider);
  if (params.course) query.append("course", params.course);
  if (params.student) query.append("student", params.student);
  if (params.date_from) query.append("date_from", params.date_from);
  if (params.date_to) query.append("date_to", params.date_to);
  const qs = query.toString();
  return request(() =>
    apiClient.get(`/api/payments/admin/transactions/${qs ? `?${qs}` : ""}`)
  );
};

// Đánh dấu giao dịch đã thanh toán
export const markTransactionPaidApi = async (transactionId) => {
  return request(() =>
    apiClient.post(
      `/api/payments/admin/transactions/${transactionId}/mark-paid/`
    )
  );
};

// ==================== FREE ENROLLMENT ====================

// Đăng ký khóa học miễn phí
export const enrollFreeCourseApi = async (courseId) => {
  return request(() =>
    apiClient.post(`/api/enrollments/courses/${courseId}/enroll-free/`)
  );
};
