import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  getInstructorPaymentsApi,
  computeInstructorPaymentApi,
  computeAllInstructorPaymentsApi,
  approveInstructorPaymentApi,
  markInstructorPaymentPaidApi,
  getPaymentColumnsApi,
  createPaymentColumnApi,
  deletePaymentColumnApi,
  setPaymentColumnValueApi,
  exportInstructorPaymentsExcelApi,
} from "../../api/dutiesAPI";
import { getManagedInstructorsApi } from "../../api/instructorManagerAPI";
import { useUser } from "../../context/UserContext";
import "../../style/admin/instructor-payments.css";

const fmtMoney = (v) => (Number(v) || 0).toLocaleString("vi-VN") + "đ";
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString("vi-VN") : "—");

const PAY_STATUS = {
  DRAFT: "Chưa duyệt",
  APPROVED: "Đã duyệt",
  PAID: "Đã chi trả",
  CANCELLED: "Đã hủy",
};
const PAY_STATUS_CLS = {
  DRAFT: "bg-secondary",
  APPROVED: "bg-primary",
  PAID: "bg-success",
  CANCELLED: "bg-danger",
};

// Normalize danh sách giảng viên từ các dạng response
const toInstructorList = (r) => {
  const d = r?.data ?? r ?? [];
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.results)) return d.results;
  return [];
};

function AdminInstructorPaymentsPage() {
  const { user } = useUser();
  const roleCode = typeof user?.role === "string" ? user.role : user?.role?.code;
  const isSuperAdmin = roleCode === "SUPERADMIN";

  const [instructors, setInstructors] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [instructorId, setInstructorId] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  // Normalize danh sách cột động (backend bọc { success, message, data })
  const toColumnsList = (r) => {
    const d = r?.data ?? r ?? [];
    return Array.isArray(d) ? d : [];
  };

  // Lọc bảng lương theo giảng viên + tháng đang chọn
  const filteredPayments = payments.filter((p) => {
    const matchInstructor = !instructorId || String(p.instructor_id) === String(instructorId);
    const matchMonth = !month || String(p.month).startsWith(month);
    return matchInstructor && matchMonth;
  });
  const [payPayment, setPayPayment] = useState(null);
  const [confirmPay, setConfirmPay] = useState(false);
  // Cột động toàn cục (BONUS/DEDUCTION)
  const [columns, setColumns] = useState([]);
  const [newCol, setNewCol] = useState({ name: "", column_type: "BONUS" });
  const [showColForm, setShowColForm] = useState(false);
  // Giá trị cột theo từng payment đang nhập
  const [colValues, setColValues] = useState({}); // key: `${paymentId}_${columnId}`

  const load = async () => {
    setLoading(true);
    try {
      const res = await getInstructorPaymentsApi();
      const d = res?.data ?? res ?? [];
      setPayments(Array.isArray(d) ? d : []);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getManagedInstructorsApi({ page_size: 100 })
      .then((r) => setInstructors(toInstructorList(r)))
      .catch(() => setInstructors([]));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    getPaymentColumnsApi()
      .then((cols) => setColumns(toColumnsList(cols)))
      .catch(() => setColumns([]));
  }, []);

  const handleCompute = async () => {
    if (!instructorId || !month) return toast.info("Chọn giảng viên và tháng.");
    setBusy(true);
    try {
      await computeInstructorPaymentApi(instructorId, month);
      toast.success("Đã tính lương.");
      load();
    } catch (e) {
      toast.error(e.message || "Lỗi");
    } finally {
      setBusy(false);
    }
  };

  const handleComputeAll = async () => {
    if (!month) return toast.info("Chọn tháng.");
    setBusy(true);
    try {
      await computeAllInstructorPaymentsApi(month);
      toast.success("Đã tổng hợp lương tất cả giảng viên.");
      load();
    } catch (e) {
      toast.error(e.message || "Lỗi");
    } finally {
      setBusy(false);
    }
  };

  // Xuất bảng lương ra file Excel (.xlsx) - bắt buộc có tháng + năm
  const handleExport = async () => {
    if (!month) return toast.info("Vui lòng chọn tháng và năm trước khi xuất file.");
    setBusy(true);
    try {
      const blob = await exportInstructorPaymentsExcelApi(month, instructorId);
      if (!(blob instanceof Blob)) throw new Error("Phản hồi không hợp lệ từ máy chủ.");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName = (instructorId ? "giang-vien" : "tat-ca-giang-vien");
      a.href = url;
      a.download = `bang-luong-${safeName}-${month}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Đã xuất file Excel bảng lương.");
    } catch (e) {
      toast.error(e.message || "Lỗi khi xuất file.");
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async (paymentId) => {
    setBusy(true);
    try {
      await approveInstructorPaymentApi(paymentId, true);
      toast.success("Đã xuất bản bảng lương.");
      load();
    } catch (e) {
      toast.error(e.message || "Lỗi");
    } finally {
      setBusy(false);
    }
  };

  const handleUnapprove = async (paymentId) => {
    setBusy(true);
    try {
      await approveInstructorPaymentApi(paymentId, false);
      toast.success("Đã hủy xuất bản.");
      load();
    } catch (e) {
      toast.error(e.message || "Lỗi");
    } finally {
      setBusy(false);
    }
  };

  const handleStartPay = (payment) => {
    setConfirmPay(false);
    setPayPayment(payment);
  };

  const handleConfirmPay = async () => {
    if (!payPayment) return;
    setBusy(true);
    try {
      await markInstructorPaymentPaidApi(payPayment.id);
      toast.success("Đã thanh toán lương cho giảng viên.");
      setPayPayment(null);
      load();
    } catch (e) {
      toast.error(e.message || "Lỗi");
    } finally {
      setBusy(false);
    }
  };

  // Tạo cột động
  const handleCreateColumn = async () => {
    const name = (newCol.name || "").trim();
    if (!name) return toast.error("Vui lòng nhập tên cột.");
    setBusy(true);
    try {
      await createPaymentColumnApi(name, newCol.column_type);
      toast.success("Đã tạo cột.");
      setNewCol({ name: "", column_type: "BONUS" });
      setShowColForm(false);
      getPaymentColumnsApi().then((cols) => setColumns(toColumnsList(cols))).catch(() => {});
    } catch (e) {
      toast.error(e.message || "Lỗi");
    } finally {
      setBusy(false);
    }
  };

  // Xóa cột động (xóa ngay + tải lại bảng lương để tính lại thực nhận)
  const handleDeleteColumn = async (columnId) => {
    setBusy(true);
    try {
      await deletePaymentColumnApi(columnId);
      toast.success("Đã xóa cột.");
      setColumns((prev) => prev.filter((c) => c.id !== columnId));
      load();
    } catch (e) {
      toast.error(e.message || "Lỗi");
    } finally {
      setBusy(false);
    }
  };

  // Nhập giá trị cột động cho 1 payment
  const saveColumnValue = async (payment, column) => {
    const key = `${payment.id}_${column.id}`;
    const val = Number(colValues[key]);
    if (isNaN(val)) return toast.error("Giá trị không hợp lệ.");
    setBusy(true);
    try {
      await setPaymentColumnValueApi(payment.id, column.id, val);
      toast.success("Đã lưu giá trị cột.");
      load();
    } catch (e) {
      toast.error(e.message || "Lỗi");
    } finally {
      setBusy(false);
    }
  };

  // Lấy giá trị hiện tại của cột động cho payment
  const getColValue = (p, colId) => {
    const found = (p.column_values || []).find((v) => String(v.column_id) === String(colId));
    return found ? found.amount : 0;
  };

  return (
    <div className="pay-page">
      <h4 className="mb-3"><i className="bi bi-cash-coin me-2"></i>Lương giảng viên</h4>

      <div className="pay-toolbar">
        <div className="row g-2 align-items-center">
          <div className="col-md-4">
            <select className="form-select form-select-sm" value={instructorId} onChange={(e) => setInstructorId(e.target.value)}>
              <option value="">Chọn giảng viên...</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>{i.full_name || i.name || i.email || i.username}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <input type="month" className="form-control form-control-sm" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div className="col-md-2">
            <button className="btn btn-primary btn-sm w-100" onClick={handleCompute} disabled={busy}>
              <i className="bi bi-calculator me-1"></i>Tính lương
            </button>
          </div>
          <div className="col-md-3">
            <button className="btn btn-outline-primary btn-sm w-100" onClick={handleComputeAll} disabled={busy}>
              <i className="bi bi-collection me-1"></i>Tổng hợp tất cả
            </button>
          </div>
        </div>
        <div className="row g-2 align-items-center mt-1">
          <div className="col-md-12">
            <button className="btn btn-success btn-sm w-100" onClick={handleExport} disabled={busy}>
              <i className="bi bi-file-earmark-excel me-1"></i>Xuất bảng lương (Excel)
            </button>
          </div>
        </div>
        {!isSuperAdmin && (
          <div className="small text-danger mt-2">
            <i className="bi bi-info-circle me-1"></i>Chỉ SUPERADMIN có quyền tính/duyệt/xuất bản và thanh toán lương.
          </div>
        )}
      </div>

      
      <div className="pay-card">
        <div className="pay-card-head">
          <div className="pay-card-title">
            <i className="bi bi-table"></i>
            <span>Danh sách bảng lương</span>
          </div>
          {isSuperAdmin && (
            <div className="pay-card-actions">
              {showColForm ? (
                <div className="pay-column-form">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Tên cột (VD: Chuyên cần)"
                    value={newCol.name}
                    onChange={(e) => setNewCol((s) => ({ ...s, name: e.target.value }))}
                  />
                  <select
                    className="form-select form-select-sm"
                    value={newCol.column_type}
                    onChange={(e) => setNewCol((s) => ({ ...s, column_type: e.target.value }))}
                  >
                    <option value="BONUS">Thưởng (+)</option>
                    <option value="DEDUCTION">Khấu trừ (−)</option>
                  </select>
                  <button className="btn btn-sm btn-success" disabled={busy} onClick={handleCreateColumn}>
                    <i className="bi bi-check-lg me-1"></i>Tạo cột
                  </button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowColForm(false)}>Hủy</button>
                </div>
              ) : (
                <button className="pay-add-column" onClick={() => setShowColForm(true)}>
                  <i className="bi bi-plus-lg"></i>Thêm cột
                </button>
              )}
            </div>
          )}
        </div>
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-5 text-muted">Không có bảng lương phù hợp với bộ lọc.</div>
        ) : (
          <div className="pay-table-scroll">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Giảng viên</th>
                  <th>Lương tháng</th>
                  <th>Ngày kết toán</th>
                  <th>Giờ làm</th>
                  <th>Giờ thêm</th>
                  <th>Thành tiền</th>
                  {columns.map((c) => (
                    <th key={c.id} className={c.column_type === "BONUS" ? "text-success" : "text-danger"}>
                      {c.name} ({c.column_type === "BONUS" ? "+" : "−"})
                      {isSuperAdmin && (
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-danger p-0 ms-1"
                          onClick={() => handleDeleteColumn(c.id)}
                          title="Xóa cột"
                        >
                          <i className="bi bi-x-circle"></i>
                        </button>
                      )}
                    </th>
                  ))}
                  <th>Thực nhận</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => {
                  return (
                    <tr key={p.id}>
                      <td className="fw-semibold">{p.instructor_name}</td>
                      <td>{p.month}</td>
                      <td>{fmtDate(p.settlement_date)}</td>
                      <td>{p.regular_hours}</td>
                      <td>{p.overtime_hours}</td>
                      <td className="pay-money">{fmtMoney(p.salary_amount)}</td>
                      {columns.map((c) => {
                        const key = `${p.id}_${c.id}`;
                        const canEdit = isSuperAdmin && p.status === "DRAFT";
                        return (
                          <td key={key}>
                            {canEdit ? (
                              <div className="d-flex gap-1 align-items-center">
                                <input
                                  type="number"
                                  min="0"
                                  step="1000"
                                  className="form-control form-control-sm pay-input-sm"
                                  value={colValues[key] ?? getColValue(p, c.id)}
                                  onChange={(e) => setColValues((d) => ({ ...d, [key]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveColumnValue(p, c);
                                  }}
                                />
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-check"
                                  disabled={busy}
                                  onClick={() => saveColumnValue(p, c)}
                                  title="Lưu giá trị cột"
                                >
                                  <i className="bi bi-check-lg"></i>
                                </button>
                              </div>
                            ) : (
                              <span className={c.column_type === "BONUS" ? "text-success fw-semibold" : "text-danger fw-semibold"}>
                                {fmtMoney(getColValue(p, c.id))}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="pay-money fw-bold">{fmtMoney(p.net_amount)}</td>
                      <td><span className={`badge ${PAY_STATUS_CLS[p.status] || "bg-secondary"}`}>{PAY_STATUS[p.status] || p.status}</span></td>
                      <td>
                        <div className="pay-actions">
                          {isSuperAdmin && p.status === "DRAFT" && (
                            <button className="btn btn-sm btn-success" disabled={busy} onClick={() => handleApprove(p.id)}>
                              <i className="bi bi-check-lg me-1"></i>Duyệt bản lương
                            </button>
                          )}
                          {isSuperAdmin && p.status === "APPROVED" && (
                            <>
                              <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => handleStartPay(p)}>
                                <i className="bi bi-credit-card me-1"></i>Thanh toán
                              </button>
                              <button className="btn btn-sm btn-outline-secondary" disabled={busy} onClick={() => handleUnapprove(p.id)}>
                                Hủy xuất bản
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {payPayment && isSuperAdmin && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.5)" }}>
          <div className="modal-content" style={{ maxWidth: 480, width: "100%", padding: 20 }}>
            <div className="modal-header" style={{ borderBottom: "1px solid #eee", marginBottom: 12 }}>
              <h5 className="modal-title">Xem lại thông tin thanh toán</h5>
              <button className="btn-close" onClick={() => setPayPayment(null)}></button>
            </div>
            <div className="modal-body">
              <p><strong>Giảng viên:</strong> {payPayment.instructor_name}</p>
              <p><strong>Lương tháng:</strong> {payPayment.month}</p>
              <p><strong>Số giờ làm:</strong> {payPayment.regular_hours}</p>
              <p><strong>Giờ dạy thêm:</strong> {payPayment.overtime_hours}</p>
              <p><strong>Thành tiền:</strong> {fmtMoney(payPayment.salary_amount)}</p>
              <p className="fw-bold"><strong>Thực nhận:</strong> {fmtMoney(payPayment.net_amount)}</p>
              {!confirmPay ? (
                <button className="btn btn-primary w-100" onClick={() => setConfirmPay(true)}>
                  <i className="bi bi-eye me-1"></i>Xác nhận đã xem lại — Thanh toán
                </button>
              ) : (
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary flex-fill" onClick={() => setConfirmPay(false)}>Quay lại</button>
                  <button className="btn btn-success flex-fill" disabled={busy} onClick={handleConfirmPay}>
                    {busy ? <><span className="spinner-border spinner-border-sm" role="status"></span> Đang xử lý...</> : <><i className="bi bi-check-lg me-1"></i>Xác nhận thanh toán</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminInstructorPaymentsPage;