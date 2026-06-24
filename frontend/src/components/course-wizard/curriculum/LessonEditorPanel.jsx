import { memo, useState, useEffect, useCallback, useRef } from "react";

function LessonEditorPanel({
  lesson,
  sectionId,
  onClose,
  onSave,
  saving,
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    content_type: "VIDEO",
    video_url: "",
  });
  const [materialFile, setMaterialFile] = useState(null);
  const [materialPreview, setMaterialPreview] = useState("");
  const [dirty, setDirty] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (lesson) {
      setForm({
        title: lesson.title || "",
        description: lesson.description || "",
        content_type: lesson.content_type || "VIDEO",
        video_url: lesson.video_url || "",
      });
      setMaterialFile(null);
      setMaterialPreview(lesson.material_url || "");
      setDirty(false);
    }
  }, [lesson]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setDirty(true);
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setMaterialFile(file);
      setMaterialPreview(URL.createObjectURL(file));
      setDirty(true);
    }
  }, []);

  const handleRemoveFile = useCallback(() => {
    setMaterialFile(null);
    setMaterialPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    const payload = { ...form, id: lesson?.id, section_id: sectionId };
    // If there's a material file, attach it for FormData handling
    if (materialFile) {
      payload.material_file = materialFile;
    }
    onSave?.(payload);
    setDirty(false);
  }, [form, materialFile, lesson, sectionId, onSave]);

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
    <div className="cw-editor-panel-inner" onKeyDown={handleKeyDown}>
      <div className="cw-editor-panel-header">
        <h4>{lesson?.id ? "Chỉnh sửa bài học" : "Thêm bài học mới"}</h4>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {dirty && (
            <span className="cw-save-indicator">
              <i className="bi bi-circle-fill text-warning" style={{ fontSize: 8 }}></i>
              Chưa lưu
            </span>
          )}
          <button className="cw-editor-panel-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      </div>

      <div className="cw-editor-panel-body">
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

        {/* Video URL - chỉ hiển thị khi chọn VIDEO */}
        {form.content_type === "VIDEO" && (
          <div className="cw-form-group">
            <label className="cw-form-label">
              <span className="cw-form-label-text">
                URL Video <span className="text-danger">*</span>
              </span>
            </label>
            <input
              type="text"
              name="video_url"
              className="cw-input"
              value={form.video_url}
              onChange={handleChange}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="cw-form-hint">Nhập link YouTube cho bài học video</p>
          </div>
        )}

        {/* Material file upload - chỉ hiển thị khi chọn DOCUMENT */}
        {form.content_type === "DOCUMENT" && (
          <div className="cw-form-group">
            <label className="cw-form-label">
              <span className="cw-form-label-text">
                Tài liệu đính kèm <span className="text-danger">*</span>
              </span>
            </label>
            {materialPreview ? (
              <div className="cw-file-preview">
                <div className="cw-file-preview-info">
                  <i className="bi bi-file-earmark-text"></i>
                  <span>{materialFile ? materialFile.name : "Tài liệu đã tải lên"}</span>
                </div>
                <div className="cw-file-preview-actions">
                  <button
                    type="button"
                    className="cw-btn cw-btn-outline cw-btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className="bi bi-arrow-repeat"></i>
                    Đổi file
                  </button>
                  <button
                    type="button"
                    className="cw-btn cw-btn-danger cw-btn-sm"
                    onClick={handleRemoveFile}
                  >
                    <i className="bi bi-trash"></i>
                    Xóa
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div
                className="cw-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="cw-dropzone-icon">
                  <i className="bi bi-cloud-upload"></i>
                </div>
                <div className="cw-dropzone-text">
                  Kéo thả file hoặc nhấp để chọn
                </div>
                <div className="cw-dropzone-hint">
                  Hỗ trợ: PDF, DOC, DOCX, PPT, TXT
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="cw-editor-panel-footer">
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
  );
}

export default memo(LessonEditorPanel);
