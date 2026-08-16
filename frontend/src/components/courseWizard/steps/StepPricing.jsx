import { memo, useState } from "react";
import { toast } from "react-toastify";
import {
  createCoursePlanApi,
  updateCoursePlanApi,
  deleteCoursePlanApi,
} from "../../../api/courseAPI";

import { formatVND } from "../../../utils/formatPrice";
import ConfirmModal from "../../common/ConfirmModal";

function StepPricing({ courseId, plans, onPlansChange }) {
  const [loading, setLoading] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);

  const updateLocal = (row, field, value) => {
    onPlansChange((prev) => prev.map((p) => (p.id === row.id ? { ...p, [field]: value } : p)));
  };

  const addRow = () => {
    onPlansChange((prev) => [
      ...prev,
      { id: `temp_${Date.now()}`, name: "", duration_days: "", price: "", isNew: true },
    ]);
  };

  const removeRow = (row) => {
    if (row.isNew) {
      onPlansChange((prev) => prev.filter((p) => p.id !== row.id));
      return;
    }
    setRowToDelete(row);
  };

  const handleConfirmDelete = async () => {
    if (!rowToDelete) return;
    setLoading(true);
    try {
      await deleteCoursePlanApi(courseId, rowToDelete.id);
      onPlansChange((prev) => prev.filter((p) => p.id !== rowToDelete.id));
      toast.success("Đã xóa gói truy cập.");
    } catch (e) {
      toast.error(e.message || "Không thể xóa gói.");
    } finally {
      setLoading(false);
      setRowToDelete(null);
    }
  };

  const saveRow = async (row) => {
    const name = (row.name || "").trim();
    const duration = row.duration_days === "" ? null : Number(row.duration_days);
    // Giá luôn là số nguyên — không dùng replace để tránh gộp dấu chấm thập phân của Decimal
    const price = row.price === "" ? null : Math.floor(Number(row.price));

    // Ràng buộc
    if (!name) return toast.error("Tên gói không được để trống.");
    if (name.length > 100) return toast.error("Tên gói không được dài quá 100 ký tự.");
    if (duration === null || Number.isNaN(duration)) return toast.error("Thời gian truy cập bắt buộc nhập số.");
    if (duration <= 0) return toast.error("Thời gian truy cập phải lớn hơn 0 ngày.");
    if (price === null || Number.isNaN(price)) return toast.error("Giá bắt buộc nhập số.");
    if (price < 50000) return toast.error("Giá không được thấp hơn 50.000 VND.");

    const payload = { name, duration_days: duration, price };
    setLoading(true);
    try {
      if (row.isNew) {
        const res = await createCoursePlanApi(courseId, payload);
        const created = res?.data ?? res;
        onPlansChange((prev) => prev.map((p) => (p.id === row.id ? { ...created, isNew: false } : p)));
        toast.success("Đã thêm gói truy cập.");
      } else {
        await updateCoursePlanApi(courseId, row.id, payload);
        onPlansChange((prev) => prev.map((p) => (p.id === row.id ? { ...p, ...payload } : p)));
        toast.success("Đã cập nhật gói truy cập.");
      }
    } catch (e) {
      toast.error(e.message || "Không thể lưu gói truy cập.");
    } finally {
      setLoading(false);
    }
  };

  const validCount = plans.filter(
    (p) => (p.name || "").trim().length > 0 && Number(p.duration_days) > 0 && Number(p.price) >= 50000
  ).length;

  return (
    <div className="cw-card">
      <h3 className="cw-card-title">Gói truy cập khóa học</h3>
      <div className="cw-plans-table-wrap">
        <table className="table table-bordered align-middle cw-plans-table" style={{ fontSize: 14, marginTop: 12 }}>
          <thead>
            <tr>
              <th style={{ width: 50 }}>STT</th>
              <th>Tên gói</th>
              <th style={{ width: 150 }}>Thời gian (ngày)</th>
              <th style={{ width: 200 }}>Giá (VNĐ)</th>
              <th style={{ width: 160 }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p, idx) => (
              <tr key={p.id}>
                <td className="text-center fw-bold text-muted">{idx + 1}</td>
                <td>
                  <input type="text" className="form-control form-control-sm" value={p.name}
                    onChange={(e) => updateLocal(p, "name", e.target.value)} placeholder="VD: Gói 1 tháng" />
                </td>
                <td>
                  <input type="number" min="1" className="form-control form-control-sm" value={p.duration_days}
                    onChange={(e) => updateLocal(p, "duration_days", e.target.value)} placeholder="VD: 30" />
                </td>
                <td>
                  <div className="input-group input-group-sm">
                    <input type="text" inputMode="numeric" className="form-control text-end"
                      value={formatVND(p.price)}
                      onChange={(e) => updateLocal(p, "price", e.target.value.replace(/[^\d]/g, ""))}
                      placeholder="VD: 100.000" />
                    <span className="input-group-text">₫</span>
                  </div>
                </td>
                <td className="text-center">
                  <button type="button" className="cw-plans-save-btn me-1" onClick={() => saveRow(p)} disabled={loading}>
                    {p.isNew ? "Thêm" : "Lưu"}
                  </button>
                  <button type="button" className="cw-plans-delete-btn" onClick={() => removeRow(p)}>
                    <i className="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={addRow} disabled={loading}>
        <i className="bi bi-plus-lg me-1"></i>Thêm gói
      </button>

      {validCount > 0 && (
        <div className="cw-price-preview" style={{ marginTop: 16 }}>
          <div className="cw-price-preview-row total">
            <span>Số gói hợp lệ</span>
            <span>{validCount}</span>
          </div>
        </div>
      )}

      <ConfirmModal
        show={!!rowToDelete}
        title="Xóa gói truy cập"
        message={`Bạn có chắc chắn muốn xóa gói "${rowToDelete?.name}"?`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setRowToDelete(null)}
      />
    </div>
  );
}

export default memo(StepPricing);