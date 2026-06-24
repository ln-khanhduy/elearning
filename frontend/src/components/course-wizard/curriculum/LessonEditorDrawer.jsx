import { memo, useState, useEffect, useCallback } from "react";

function LessonEditorDrawer({
  lesson,
  sectionId,
  open,
  onClose,
  onSave,
  saving,
}) {
  const [form, setForm] = useState({ title: "", description: "", content_type: "VIDEO", duration: "" });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (lesson) {
      setForm({
        title: lesson.title || "",
        description: lesson.description || "",
        content_type: lesson.content_type || "VIDEO",
        duration: lesson.duration || "",
      });
      setDirty(false);
    }
  }, [lesson]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    onSave?.({ ...form, id: lesson?.id, section_id: sectionId });
    setDirty(false);
  }, [form, lesson, sectionId, onSave]);

  const handleKeyDown = useCallback(
    (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave]
  );

  return (
    <>
      <div className={`cw-drawer-overlay ${open ? "open" : ""}`} onClick={onClose} />
      <div className={`cw-drawer ${open ? "open" : ""}`} onKeyDown={handleKeyDown}>
        <div className="cw-drawer-header">
          <h4>{lesson?.id ? "Chỉnh sửa bài học" : "Thêm bài học mới"}</h4>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {dirty && (
              <span className="cw-save-indicator">
                <i className="bi bi-circle-fill text-warning" style={{ fontSize: 8 }}></i>
                Chưa lưu
              </span>
            )}
            <button className="cw-drawer-close" onClick={onClose}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <div className="cw-drawer-body">
          <div className="cw-form-group">
            <label className="cw-form-label">
              <span className="cw-form-label-text">
                Tiêu đề bài học <span className="text-danger">*</span>
              </span>
            </label>
            <input
              type="text"
              name="title"
              className="cw-input"
              value={form.title}
              onChange={handleChange}
              placeholder="VD: Giới thiệu về Python"
            />
          </div>

          <div className="cw-form-group">
            <label className="cw-form-label">
              <span className="cw-form-label-text">Mô tả</span>
            </label>
            <textarea
              name="description"
              className="cw-textarea"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Mô tả ngắn về bài học..."
            />
          </div>

          <div className="cw-form-group">
            <label className="cw-form-label">
              <span className="cw-form-label-text">Loại nội dung</span>
            </label>
            <select
              name="content_type"
              className="cw-select"
              value={form.content_type}
              onChange={handleChange}
            >
              <option value="VIDEO">Video</option>
              <option value="DOCUMENT">Tài liệu</option>
            </select>
          </div>

          <div className="cw-form-group">
            <label className="cw-form-label">
              <span className="cw-form-label-text">Thời lượng (phút)</span>
            </label>
            <input
              type="number"
              name="duration"
              className="cw-input"
              value={form.duration}
              onChange={handleChange}
              placeholder="VD: 15"
              min="0"
            />
          </div>
        </div>

        <div className="cw-drawer-footer">
          <button className="cw-btn cw-btn-secondary" onClick={onClose}>
            Hủy
          </button>
          <button
            className="cw-btn cw-btn-primary"
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm"></span>
                Đang lưu...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg"></i>
                Lưu
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

export default memo(LessonEditorDrawer);
