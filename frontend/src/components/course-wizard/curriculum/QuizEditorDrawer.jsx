import { memo, useState, useEffect, useCallback } from "react";

function QuizEditorDrawer({
  quiz,
  sectionId,
  open,
  onClose,
  onSave,
  saving,
  onImportQuestions,
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    time_limit_minutes: "",
    passing_score: "",
  });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (quiz) {
      setForm({
        title: quiz.title || "",
        description: quiz.description || "",
        time_limit_minutes: quiz.time_limit_minutes || "",
        passing_score: quiz.passing_score || "",
      });
      setDirty(false);
    }
  }, [quiz]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    onSave?.({ ...form, id: quiz?.id, section_id: sectionId });
    setDirty(false);
  }, [form, quiz, sectionId, onSave]);

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
          <h4>{quiz?.id ? "Chỉnh sửa bài tập" : "Thêm bài tập mới"}</h4>
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
                Tiêu đề bài tập <span className="text-danger">*</span>
              </span>
            </label>
            <input
              type="text"
              name="title"
              className="cw-input"
              value={form.title}
              onChange={handleChange}
              placeholder="VD: Bài tập về biến và kiểu dữ liệu"
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
              placeholder="Mô tả bài tập..."
            />
          </div>

          <div className="cw-form-group">
            <label className="cw-form-label">
              <span className="cw-form-label-text">Thời gian làm bài (phút)</span>
            </label>
            <input
              type="number"
              name="time_limit_minutes"
              className="cw-input"
              value={form.time_limit_minutes}
              onChange={handleChange}
              placeholder="VD: 30"
              min="1"
            />
          </div>

          <div className="cw-form-group">
            <label className="cw-form-label">
              <span className="cw-form-label-text">Điểm đạt tối thiểu</span>
            </label>
            <input
              type="number"
              name="passing_score"
              className="cw-input"
              value={form.passing_score}
              onChange={handleChange}
              placeholder="VD: 5"
              min="0"
              max="10"
            />
          </div>

          {quiz?.id && quiz?.quiz_type === "MCQ" && (
            <div className="cw-form-group" style={{ marginTop: 24 }}>
              <label className="cw-form-label">
                <span className="cw-form-label-text">Câu hỏi</span>
              </label>
              <p className="text-muted" style={{ fontSize: 13, marginBottom: 8 }}>
                {quiz.question_count || 0} câu hỏi trong bài tập này.
              </p>
              <button
                className="cw-btn cw-btn-outline cw-btn-sm"
                onClick={() => onImportQuestions?.(quiz.id)}
              >
                <i className="bi bi-upload"></i>
                Import câu hỏi từ file
              </button>
            </div>
          )}
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

export default memo(QuizEditorDrawer);
