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

export const createStripeCheckoutApi = async (courseId) => {
  return request(() =>
    apiClient.post(`/api/payments/stripe/courses/${courseId}/checkout/`)
  );
};

export const verifyStripePaymentApi = async (sessionId) => {
  return request(() =>
    apiClient.post("/api/payments/stripe/verify/", { session_id: sessionId })
  );
};

// ==================== TRANSACTIONS ====================

export const getTransactionDetailApi = async (transactionId) => {
  return request(() =>
    apiClient.get(`/api/payments/transactions/${transactionId}/`)
  );
};

// ==================== INSTRUCTOR ====================

export const getInstructorRevenueApi = async () => {
  return request(() => apiClient.get("/api/payments/instructor/revenue/"));
};

// ==================== ADMIN ====================

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

export const markTransactionPaidApi = async (transactionId) => {
  return request(() =>
    apiClient.post(
      `/api/payments/admin/transactions/${transactionId}/mark-paid/`
    )
  );
};

// ==================== FREE ENROLLMENT ====================

export const enrollFreeCourseApi = async (courseId) => {
  return request(() =>
    apiClient.post(`/api/enrollments/courses/${courseId}/enroll-free/`)
  );
};
