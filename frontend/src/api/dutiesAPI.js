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

// ==================== DUTIES / LỊCH TRỰC ====================

// Danh sách lịch trực (USER_MANAGER)
export const getDutySchedulesApi = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.instructor_id) query.append("instructor_id", params.instructor_id);
  if (params.date_from) query.append("date_from", params.date_from);
  if (params.date_to) query.append("date_to", params.date_to);
  const qs = query.toString();
  return request(() => apiClient.get(`/api/duty/${qs ? `?${qs}` : ""}`));
};

// Tạo lịch trực (makeup_for_id: ID ca gốc bị thiếu giờ -> tạo ca bù)
export const createDutyScheduleApi = async (data) => {
  return request(() => apiClient.post("/api/duty/", data));
};

// Danh sách ca thiếu giờ chưa bù (INSTRUCTOR_MANAGER)
export const getInstructorMissingHoursApi = async (instructorId, month) => {
  const params = new URLSearchParams({ instructor_id: instructorId });
  if (month) params.append("month", month);
  return request(() => apiClient.get(`/api/duty/instructor/missing-hours/?${params.toString()}`));
};

// Cập nhật ca trực (ngày/ca/giờ bắt đầu/giờ kết thúc)
export const updateDutyScheduleApi = async (scheduleId, data) => {
  return request(() => apiClient.patch(`/api/duty/${scheduleId}/update/`, data));
};

// Xóa ca trực (hard delete khỏi DB)
export const cancelDutyScheduleApi = async (scheduleId) => {
  return request(() => apiClient.post(`/api/duty/${scheduleId}/cancel/`));
};

// Bù giờ — đổi ca
export const replaceDutyScheduleApi = async (scheduleId, date, shift) => {
  return request(() => apiClient.post(`/api/duty/${scheduleId}/replace/`, { date, shift }));
};

// Bắt đầu ca (bộ đếm 120p)
export const checkInDutyApi = async (scheduleId) => {
  return request(() => apiClient.post(`/api/duty/${scheduleId}/check-in/`));
};

// Kết thúc ca
export const checkOutDutyApi = async (scheduleId) => {
  return request(() => apiClient.post(`/api/duty/${scheduleId}/check-out/`));
};

// Lịch trực của giảng viên đang đăng nhập
export const getMySchedulesApi = async () => {
  return request(() => apiClient.get("/api/duty/instructor/my-schedules/"));
};

// Chấm công của giảng viên đang đăng nhập
export const getMyAttendanceApi = async () => {
  return request(() => apiClient.get("/api/duty/instructor/attendance/"));
};

// Lương của giảng viên đang đăng nhập
export const getMyPaymentsApi = async () => {
  return request(() => apiClient.get("/api/duty/instructor/my-payments/"));
};

// Danh sách cột động cho giảng viên xem bảng lương của mình
export const getMyPaymentColumnsApi = async () => {
  return request(() => apiClient.get("/api/duty/instructor/my-payment-columns/"));
};

// Đăng ký endpoint lương cho SUPERADMIN/USER_MANAGER
export const getInstructorPaymentsApi = async () => {
  return request(() => apiClient.get("/api/duty/admin/instructor-payments/"));
};

// Tính lương tháng cho 1 giảng viên
export const computeInstructorPaymentApi = async (instructorId, month) => {
  return request(() => apiClient.post("/api/duty/admin/instructor-payments/compute/", { instructor_id: instructorId, month }));
};

// Duyệt / hủy duyệt bảng lương
export const approveInstructorPaymentApi = async (paymentId, approve = true) => {
  return request(() => apiClient.post(`/api/duty/admin/instructor-payments/${paymentId}/approve/`, { approve }));
};

// Đánh dấu đã chi trả
export const markInstructorPaymentPaidApi = async (paymentId) => {
  return request(() => apiClient.post(`/api/duty/admin/instructor-payments/${paymentId}/paid/`));
};

// Tổng hợp lương tất cả giảng viên trong tháng
export const computeAllInstructorPaymentsApi = async (month) => {
  return request(() => apiClient.post("/api/duty/admin/instructor-payments/compute-all/", { month }));
};

// ==================== CỘT ĐỘNG BẢNG LƯƠNG ====================

// Danh sách cột động toàn cục
export const getPaymentColumnsApi = async () => {
  return request(() => apiClient.get("/api/duty/admin/instructor-payments/columns/"));
};

// Tạo cột động (BONUS = Thưởng / DEDUCTION = Khấu trừ)
export const createPaymentColumnApi = async (name, columnType) => {
  return request(() => apiClient.post("/api/duty/admin/instructor-payments/columns/create/", { name, column_type: columnType }));
};

// Xóa cột động
export const deletePaymentColumnApi = async (columnId) => {
  return request(() => apiClient.delete(`/api/duty/admin/instructor-payments/columns/${columnId}/`));
};

// Nhập giá trị cột động cho 1 bảng lương
export const setPaymentColumnValueApi = async (paymentId, columnId, amount) => {
  return request(() => apiClient.post(`/api/duty/admin/instructor-payments/${paymentId}/columns/${columnId}/`, { amount }));
};

// Xuất bảng lương ra file Excel (.xlsx) - bắt buộc có month (YYYY-MM)
export const exportInstructorPaymentsExcelApi = async (month, instructorId = "") => {
  const params = new URLSearchParams({ month });
  if (instructorId) params.append("instructor_id", instructorId);
  try {
    const res = await apiClient.get(
      `/api/duty/admin/instructor-payments/export/?${params.toString()}`,
      { responseType: "blob" }
    );
    return res.data;
  } catch (error) {
    const data = error.response?.data;
    // Với responseType=blob, lỗi JSON từ server cũng về dạng Blob -> parse để lấy message
    const isJsonBlob = data instanceof Blob && data.type && data.type.includes("json");
    const isTextBlob = data instanceof Blob && data.type && data.type.includes("text/plain");
    if (isJsonBlob || isTextBlob) {
      try {
        const text = await data.text();
        let parsed = null;
        try {
          parsed = JSON.parse(text);
        } catch {
          // Không phải JSON -> dùng text trực tiếp
        }
        const msg = parsed ? getErrorMessage({ response: { data: parsed } }) : (text || getErrorMessage(error));
        const e = new Error(msg);
        e.cause = error;
        throw e;
      } catch (inner) {
        if (inner instanceof Error) throw inner;
        const e2 = new Error(getErrorMessage(error));
        e2.cause = error;
        throw e2;
      }
    }
    const e = new Error(getErrorMessage(error));
    e.cause = error;
    throw e;
  }
};
