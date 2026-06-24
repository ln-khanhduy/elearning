import { memo, useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

const QUIZ_TYPE_LABELS = {
  MCQ: "Trắc nghiệm",
  ESSAY: "Tự luận",
  FILL_BLANK: "Điền khuyết",
};

function QuizEditorPanel({
  quiz,
  sectionId,
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
    question_type: "MCQ",
    prompt: "",
  });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (quiz) {
      setForm({
        title: quiz.title || "",
        description: quiz.description || "",
        time_limit_minutes: quiz.time_limit_minutes || "",
        passing_score: quiz.passing_score || "",
        question_type: quiz.quiz_type || quiz.question_type || "MCQ",
        prompt: quiz.prompt || "",
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
    // Check tiêu đề
    const title = String(form.title).trim();
    if (title.length < 5) {
      toast.warning("Tiêu đề phải từ 5 ký tự bao gồm khoảng cách.");
      return;
    }
    // Check thời gian
    const minutes = Number(form.time_limit_minutes);
    if (minutes <= 0 || minutes > 120) {
      toast.warning("Thời gian làm bài tối đa là 120 phút.");
      return;
    }
    // Check điểm tối đa
    const score = Number(form.passing_score);
    if (score < 0 || score > 10) {
      toast.warning("Điểm tối đa phải từ 1 đến 10.");
      return;
    }

    onSave?.({ ...form, id: quiz?.id, section_id: sectionId, lesson_id: quiz?.lesson_id });
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

  const questionType = form.question_type;
  const isMCQ = questionType === "MCQ";
  const isESSAY = questionType === "ESSAY";
  const isFillBlank = questionType === "FILL_BLANK";

  return (
    <div className="cw-editor-panel-inner" onKeyDown={handleKeyDown}>
      <div className="cw-editor-panel-header">
        <h4>{quiz?.id ? "Chỉnh sửa bài tập" : "Thêm bài tập mới"}</h4>
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
            <span className="cw-form-label-text">
              Thời gian làm bài (phút) <span className="text-danger">*</span>
            </span>
          </label>
          <input
            type="number"
            name="time_limit_minutes"
            className="cw-input"
            value={form.time_limit_minutes}
            onChange={handleChange}
            placeholder="VD: 30"
            min="1"
            max="120"
            required
          />
        </div>

        <div className="cw-form-group">
          <label className="cw-form-label">
            <span className="cw-form-label-text">
              Điểm tối đa <span className="text-danger">*</span>
            </span>
          </label>
          <input
            type="number"
            name="passing_score"
            className="cw-input"
            value={form.passing_score}
            onChange={handleChange}
            placeholder="VD: 10"
            min="1"
            required
          />
          <p className="cw-form-help-text">
            Điểm của mỗi câu hỏi sẽ được chia đều dựa trên tổng số câu.
          </p>
        </div>

        {/* ESSAY: textarea nhập câu hỏi */}
        {isESSAY && (
          <div className="cw-form-group">
            <label className="cw-form-label">
              <span className="cw-form-label-text">
                Nội dung câu hỏi <span className="text-danger">*</span>
              </span>
            </label>
            <textarea
              name="prompt"
              className="cw-textarea"
              value={form.prompt}
              onChange={handleChange}
              rows={5}
              placeholder="Nhập nội dung câu hỏi tự luận..."
            />
          </div>
        )}

        {/* FILL_BLANK: textarea nhập câu hỏi */}
        {isFillBlank && (
          <div className="cw-form-group">
            <label className="cw-form-label">
              <span className="cw-form-label-text">
                Nội dung câu hỏi <span className="text-danger">*</span>
              </span>
            </label>
            <textarea
              name="prompt"
              className="cw-textarea"
              value={form.prompt}
              onChange={handleChange}
              rows={5}
              placeholder='VD: Python là {{ngôn ngữ lập trình}} được phát triển bởi {{Guido van Rossum}}.'
            />
            <p className="cw-form-help-text">
              Dùng <code>{`{{đáp án}}`}</code> để tạo chỗ trống. Nhiều đáp án: <code>{`{{đáp án 1|đáp án 2}}`}</code>
            </p>
          </div>
        )}

        {/* Import questions section - only show for MCQ quizzes that have been saved (real ID, not temp) */}
        {isMCQ && quiz?.id && !String(quiz.id).startsWith("temp_") && (
          <div className="cw-form-group" style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--cw-border)" }}>
            <label className="cw-form-label">
              <span className="cw-form-label-text">Câu hỏi trắc nghiệm</span>
            </label>
            <p className="text-muted" style={{ fontSize: 13, marginBottom: 8 }}>
              Import danh sách câu hỏi từ file CSV hoặc XLSX.
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

      <div className="cw-editor-panel-footer">
        <button className="cw-btn cw-btn-secondary" onClick={onClose}>
          Hủy
        </button>
        <button
          className="cw-btn cw-btn-primary"
          onClick={handleSave}
          disabled={
            saving ||
            !form.title.trim() ||
            !form.time_limit_minutes ||
            !form.passing_score
          }
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

export default memo(QuizEditorPanel);
