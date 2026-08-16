import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    const e = new Error(getErrorMessage(error));
    e.cause = error;
    throw e;
  }
};

// ==================== STRIPE ====================

// Tạo phiên thanh toán Stripe cho khóa học — bắt buộc chọn gói (plan_id)
export const createStripeCheckoutApi = async (courseId, planId, couponCode = "") => {
  const payload = { plan_id: planId };
  if (couponCode) payload.coupon_code = couponCode;
  return request(() =>
    apiClient.post(`/api/payments/stripe/courses/${courseId}/checkout/`, payload)
  );
};

// Tạo phiên thanh toán Stripe cho nhiều khóa học (thanh toán giỏ hàng) - 1 session duy nhất
export const createStripeCartCheckoutApi = async (courseIds, couponCode = "") => {
  const payload = { course_ids: courseIds };
  if (couponCode) payload.coupon_code = couponCode;
  return request(() =>
    apiClient.post("/api/payments/stripe/cart/checkout/", payload)
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

// Lấy báo cáo tài chính tổng hợp (KPI, theo tháng, trạng thái, top khóa học, 14 ngày gần nhất)
export const getAdminFinanceReportApi = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.date_from) query.append("date_from", params.date_from);
  if (params.date_to) query.append("date_to", params.date_to);
  const qs = query.toString();
  return request(() =>
    apiClient.get(`/api/payments/admin/reports/${qs ? `?${qs}` : ""}`)
  );
};

// ==================== FREE ENROLLMENT ====================

// Đăng ký khóa học miễn phí
export const enrollFreeCourseApi = async (courseId) => {
  return request(() =>
    apiClient.post(`/api/enrollments/courses/${courseId}/enroll-free/`)
  );
};