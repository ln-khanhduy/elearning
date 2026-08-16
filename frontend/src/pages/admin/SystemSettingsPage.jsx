import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { getSystemConfigsApi, updateSystemConfigsApi } from "../../api/systemAPI";
import "../../style/admin/system-settings.css";

const configMeta = {
  // Lương & giờ dạy
  duty_min_teaching_hours: { label: "Thời gian tối thiểu giảng dạy / tháng (giờ)", unit: "giờ" },
  duty_max_teaching_hours: { label: "Thời gian tối đa giảng dạy / tháng (giờ)", unit: "giờ" },
  duty_max_hours_per_day: { label: "Thời gian dạy tối đa / ngày (giờ)", unit: "giờ" },
  duty_salary_min_rate: { label: "Tiền lương theo giờ tối thiểu (VNĐ)", unit: "đ" },
  duty_salary_overtime_rate: { label: "Tiền lương cho giờ dạy thêm (VNĐ)", unit: "đ" },
  // Ca trực
  duty_late_penalty_minutes: { label: "Số phút trễ cho phép trước khi tính là trễ ca", unit: "phút" },
  duty_grace_minutes: { label: "Ngưỡng phút thiếu để yêu cầu bù ca", unit: "phút" },
};

const configGroups = Object.entries(configMeta).reduce(
  (groups, [key, meta]) => {
    const isSalary = key.includes("teaching_hours") || key.includes("hours_per_day") || key.startsWith("duty_salary");
    groups[isSalary ? "Lương & giờ dạy" : "Ca trực"].push([key, meta]);
    return groups;
  },
  { "Lương & giờ dạy": [], "Ca trực": [] }
);

// Trang cấu hình hệ thống: xem và cập nhật các cấu hình của hệ thống
function SystemSettingsPage() {
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getSystemConfigsApi();
      const data = result.data || result;
      setConfigs(data || {});
    } catch {
      toast.error("Không thể tải cấu hình.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConfigs();
  }, [fetchConfigs]);

  const handleChange = (key, value) => {
    setConfigs((prev) => ({
      ...prev,
      [key]: { ...prev[key], value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {};
      Object.entries(configs).forEach(([key, cfg]) => {
        // Không cho phép cấu hình các chỉ số ca trực cố định tại trang này
        if ([
          "duty_max_small_shifts_per_big_shift",
          "duty_min_gap_minutes",
          "duty_min_duration_minutes",
          "duty_max_shifts_per_day",
        ].includes(key)) return;
        updateData[key] = cfg.value;
      });
      await updateSystemConfigsApi(updateData);
      toast.success("Cập nhật cấu hình thành công.");
      fetchConfigs();
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-instructor-list-page">
        <div className="inst-loading"><div className="spinner-border text-primary" role="status"></div></div>
      </div>
    );
  }

  return (
    <div className="admin-instructor-list-page">
      <div className="inst-page-header">
        <div>
          <h2>Cấu hình hệ thống</h2>
          <p>Quản lý các thông số cấu hình chung của hệ thống.</p>
        </div>
      </div>

      <div className="sys-config-card">
        <div>
          {Object.entries(configGroups).map(([groupName, items]) => (
            <div key={groupName} className="sys-config-group mb-4">
              <h5 className="sys-config-title">{groupName}</h5>
              {items.map(([key, meta]) => (
                <div key={key} className="sys-config-field">
                  <label className="sys-config-label">{meta.label}</label>
                  <div className="sys-config-input-row">
                    <input
                      type="number"
                      step={key.startsWith("duty_salary") ? "1000" : "1"}
                      min="0"
                      className="inst-search-input sys-config-input"
                      value={configs[key]?.value || ""}
                      onChange={(e) => handleChange(key, e.target.value)}
                    />
                    <span className="sys-config-unit">{meta.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <button
          className="inst-btn-confirm sys-config-save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Đang lưu..." : "Lưu cấu hình"}
        </button>
      </div>
    </div>
  );
}

export default SystemSettingsPage;