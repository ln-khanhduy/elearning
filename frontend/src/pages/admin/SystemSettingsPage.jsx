import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { getSystemConfigsApi, updateSystemConfigsApi } from "../../api/systemAPI";
import "../../style/admin-system-settings.css";

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
    } catch (err) {
      toast.error("Không thể tải cấu hình.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
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

  const pf = parseFloat(configs.platform_fee_percent?.value || 0);
  const ins = parseFloat(configs.instructor_share_percent?.value || 0);
  const totalPercent = pf + ins;
  const isValidTotal = Math.abs(totalPercent - 100) < 0.01;

  const configMeta = {
    platform_fee_percent: { label: "Phí nền tảng (%)", unit: "%" },
    instructor_share_percent: { label: "Chia cho giảng viên (%)", unit: "%" },
    tax_percent: { label: "Thuế (%)", unit: "%" },
    payment_fee_percent: { label: "Phí thanh toán (%)", unit: "%" },
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
          <h5 className="sys-config-title">Cấu hình phí & hoa hồng</h5>
          {Object.entries(configMeta).map(([key, meta]) => (
            <div key={key} className="sys-config-field">
              <label className="sys-config-label">
                {meta.label}
              </label>
              <div className="sys-config-input-row">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  className="inst-search-input sys-config-input"
                  value={configs[key]?.value || ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                />
                <span className="sys-config-unit">{meta.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={`sys-config-validation ${isValidTotal ? "valid" : "invalid"}`}>
          <strong>Tổng phí nền tảng + chia giảng viên:</strong> {pf}% + {ins}% = {totalPercent}%
          {isValidTotal ? " Hợp lệ" : " Phải bằng 100%"}
        </div>

        <button
          className="inst-btn-confirm sys-config-save-btn"
          onClick={handleSave}
          disabled={saving || !isValidTotal}
        >
          {saving ? "Đang lưu..." : "Lưu cấu hình"}
        </button>
      </div>
    </div>
  );
}

export default SystemSettingsPage;