import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { memo } from "react";
import { getManagedInstructorsApi } from "../../../api/instructorManagerAPI";
import {
  assignInstructorApi,
  getAssignedInstructorApi,
} from "../../../api/courseAPI";

// Bước 4: Phân công giảng viên phụ trách cho khóa học
function StepAssignInstructor({ courseId, assignedInstructor, onAssignedChange }) {
  const [instructors, setInstructors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load danh sách giảng viên quản lý được
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getManagedInstructorsApi({ page_size: 100 });
        const list = res?.data?.results || res?.data || res || [];
        setInstructors(list);
      } catch {
        toast.error("Không thể tải danh sách giảng viên.");
      } finally {
        setLoading(false);
      }
    };
    if (courseId) load();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    else setLoading(false);
  }, [courseId]);

  // Đồng bộ giảng viên đang được phân công
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedId(assignedInstructor?.id ? assignedInstructor.id.toString() : "");
  }, [assignedInstructor]);

  // Lọc theo từ khóa tìm kiếm
  const filteredInstructors = useMemo(() => {
    if (!searchTerm.trim()) return instructors;
    const term = searchTerm.toLowerCase().trim();
    return instructors.filter((inst) =>
      `${inst.get_full_name || inst.username || ""} ${inst.email || ""}`
        .toLowerCase()
        .includes(term)
    );
  }, [searchTerm, instructors]);

  const handleAssign = async () => {
    if (!selectedId) {
      toast.error("Vui lòng chọn giảng viên.");
      return;
    }
    setSaving(true);
    try {
      await assignInstructorApi(courseId, selectedId);
      const res = await getAssignedInstructorApi(courseId);
      const data = res?.data || res;
      onAssignedChange({
        id: data?.assigned_instructor_id,
        name: data?.assigned_instructor_name,
        avatar: data?.assigned_instructor_avatar,
      });
      toast.success("Phân công giảng viên thành công!");
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra khi phân công giảng viên.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      await assignInstructorApi(courseId, null);
      onAssignedChange(null);
      setSelectedId("");
      toast.success("Đã gỡ giảng viên khỏi khóa học.");
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="cw-card" style={{ textAlign: "center", padding: 60 }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (!courseId) {
    return (
      <div className="cw-card" style={{ textAlign: "center", padding: 60 }}>
        <div style={{ fontSize: 48, color: "#adb5bd", marginBottom: 16 }}>
          <i className="bi bi-person-plus"></i>
        </div>
        <h4 style={{ fontWeight: 700, color: "#495057" }}>Chưa thể phân công giảng viên</h4>
        <p className="text-muted" style={{ marginBottom: 0 }}>
          Vui lòng lưu thông tin khóa học trước khi phân công giảng viên.
        </p>
      </div>
    );
  }

  return (
    <div className="cw-card">
      <h3 className="cw-card-title">Phân công giảng viên</h3>
      <p className="cw-form-help-text" style={{ marginBottom: 20 }}>
        Chọn giảng viên phụ trách khóa học. Khóa học chỉ có thể xuất bản sau khi đã phân công giảng viên.
      </p>

      {/* Giảng viên hiện tại */}
      {assignedInstructor && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: 16,
            borderRadius: 10,
            background: "#d1e7dd",
            marginBottom: 24,
          }}
        >
          <div
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{
              width: 48,
              height: 48,
              backgroundColor: "#fff",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {assignedInstructor.avatar ? (
              <img
                src={assignedInstructor.avatar}
                alt={assignedInstructor.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <i className="bi bi-person-fill" style={{ fontSize: 20, color: "#6c757d" }}></i>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f5132" }}>
              {assignedInstructor.name || "Giảng viên"}
            </div>
            <span className="badge bg-success">Đang phụ trách</span>
          </div>
          <button
            type="button"
            className="cw-btn cw-btn-secondary cw-btn-sm"
            onClick={handleRemove}
            disabled={saving}
          >
            <i className="bi bi-x-lg"></i> Gỡ giảng viên
          </button>
        </div>
      )}

      {/* Tìm kiếm */}
      <div className="cw-form-group">
        <label className="cw-form-label">Tìm kiếm giảng viên</label>
        <input
          type="text"
          className="cw-input"
          placeholder="Nhập tên hoặc email giảng viên..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Danh sách giảng viên */}
      <div className="cw-form-group">
        <label className="cw-form-label">
          Danh sách giảng viên ({filteredInstructors.length})
        </label>
        <div
          style={{
            maxHeight: 320,
            overflowY: "auto",
            border: "1px solid #dee2e6",
            borderRadius: 8,
          }}
        >
          {filteredInstructors.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-search" style={{ fontSize: 24 }}></i>
              <p className="mt-2 mb-0">Không tìm thấy giảng viên nào</p>
            </div>
          ) : (
            filteredInstructors.map((inst) => {
              const isSelected = selectedId === inst.id.toString();
              const isCurrent =
                assignedInstructor && assignedInstructor.id === inst.id;
              return (
                <div
                  key={inst.id}
                  className={`d-flex align-items-center gap-3 px-3 py-2 ${
                    isSelected ? "bg-primary bg-opacity-10" : ""
                  } ${isCurrent ? "bg-success bg-opacity-10" : ""}`}
                  style={{
                    cursor: "pointer",
                    borderBottom: "1px solid #f0f0f0",
                    transition: "background-color 0.15s",
                  }}
                  onClick={() => setSelectedId(inst.id.toString())}
                  onMouseEnter={(e) => {
                    if (!isSelected && !isCurrent)
                      e.currentTarget.style.backgroundColor = "#f8f9fa";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected && !isCurrent)
                      e.currentTarget.style.backgroundColor = "";
                  }}
                >
                  <div className="form-check" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="radio"
                      className="form-check-input"
                      name="instructor"
                      checked={isSelected}
                      onChange={() => setSelectedId(inst.id.toString())}
                    />
                  </div>
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: "#e9ecef",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {inst.avatar_url ? (
                      <img
                        src={inst.avatar_url}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <i className="bi bi-person-fill" style={{ fontSize: 18, color: "#6c757d" }}></i>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="fw-medium">
                      {inst.get_full_name || inst.username || inst.email}
                      {isCurrent && (
                        <span className="badge bg-success ms-2" style={{ fontSize: 11 }}>
                          Đang phụ trách
                        </span>
                      )}
                    </div>
                    <small className="text-muted">{inst.email}</small>
                  </div>
                  {isSelected && <i className="bi bi-check-circle-fill text-primary"></i>}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Hành động */}
      <div className="d-flex justify-content-end gap-2 mt-4">
        <button
          type="button"
          className="cw-btn cw-btn-primary"
          onClick={handleAssign}
          disabled={saving || !selectedId || (assignedInstructor && assignedInstructor.id.toString() === selectedId)}
        >
          {saving ? (
            <>
              <span className="spinner-border spinner-border-sm"></span>
              Đang lưu...
            </>
          ) : (
            <>
              <i className="bi bi-check-lg"></i>
              {assignedInstructor ? "Xác nhận thay đổi" : "Xác nhận phân công"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default memo(StepAssignInstructor);