import { memo, useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { validateQuizForm, buildQuizPayload } from "../../../services/quizService";

// Định nghĩa nhãn hiển thị cho từng loại câu hỏi
const QUIZ_TYPE_LABELS = {
  MCQ: "Trắc nghiệm",
  ESSAY: "Tự luận",
  FILL_BLANK: "Điền khuyết",
};

function QuizEditorPanel({ quiz, sectionId, onClose, onSave, saving, onImportQuestions }) {
  // === Khai báo state ===
  // form: lưu dữ liệu nhập từ người dùng
  const [form, setForm] = useState({
    title: "", description: "", time_limit_minutes: "", passing_score: "",
    question_type: "MCQ", prompt: "", correct_text_answer: "",
  });
  // dirty: đánh dấu form đã thay đổi so với dữ liệu gốc
  const [dirty, setDirty] = useState(false);

  // === Hook ===
  // Đổ dữ liệu quiz vào form khi quiz thay đổi
  useEffect(() => {
    if (!quiz) return;
    const firstQuestion = quiz.questions?.[0];
    const promptValue = quiz.prompt || firstQuestion?.prompt || "";
    setForm({
      title: quiz.title || "", description: quiz.description || "",
      time_limit_minutes: quiz.time_limit_minutes || "", passing_score: quiz.passing_score || "",
      question_type: quiz.quiz_type || quiz.question_type || "MCQ",
      prompt: promptValue, correct_text_answer: firstQuestion?.correct_text_answer || "",
    });
    setDirty(false); // Reset cờ dirty vì form vừa đồng bộ với dữ liệu gốc
  }, [quiz]);

  // === Xử lý sự kiện ===
  // Cập nhật form khi người dùng nhập liệu
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setDirty(true); // Đánh dấu form đã thay đổi
  }, []);

  // Kiểm tra tính hợp lệ rồi lưu quiz lên server
  const handleSave = useCallback(() => {
    const validation = validateQuizForm(form);
    if (!validation.valid) { toast.warning(validation.message); return; }
    const payload = buildQuizPayload(form, quiz, sectionId);
    onSave?.(payload);
    setDirty(false);
  }, [form, quiz, sectionId, onSave]);

  // Xử lý phím tắt Ctrl+S để lưu nhanh
  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
  }, [handleSave]);

  // === Biến tiện ích ===
  const questionType = form.question_type;
  const isMCQ = questionType === "MCQ";
  const isESSAY = questionType === "ESSAY";
  const isFillBlank = questionType === "FILL_BLANK";
  const isSavedQuiz = quiz?.id && !String(quiz.id).startsWith("temp_");

  // === Render UI ===
  return (
    <div className="cw-editor-panel-inner" onKeyDown={handleKeyDown}>
      {/* Header: tiêu đề + nút đóng */}
      <div className="cw-editor-panel-header">
        <h4>{quiz?.id ? "Chỉnh sửa bài tập" : "Thêm bài tập mới"}</h4>
        <div className="cw-editor-panel-header-right">
          {dirty && (
            <span className="cw-save-indicator">
              <i className="bi bi-circle-fill text-warning cw-save-dot"></i> Chưa lưu
            </span>
          )}
          <button className="cw-editor-panel-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
      </div>

      {/* Body: các field nhập liệu */}
      <div className="cw-editor-panel-body">
        {/* Tiêu đề bài tập */}
        <div className="cw-form-group">
          <label className="cw-form-label">
            <span className="cw-form-label-text">Tiêu đề bài tập <span className="text-danger">*</span></span>
          </label>
          <input type="text" name="title" className="cw-input" value={form.title} 
          onChange={handleChange} placeholder="VD: Bài tập về biến và kiểu dữ liệu" />
        </div>

        {/* Mô tả bài tập */}
        <div className="cw-form-group">
          <label className="cw-form-label"><span className="cw-form-label-text">Mô tả</span></label>
          <textarea name="description" className="cw-textarea" value={form.description} 
          onChange={handleChange} rows={3} placeholder="Mô tả bài tập..." />
        </div>

        {/* Thời gian làm bài */}
        <div className="cw-form-group">
          <label className="cw-form-label">
            <span className="cw-form-label-text">Thời gian làm bài (phút) <span className="text-danger">*</span></span>
          </label>
          <input type="number" name="time_limit_minutes" className="cw-input" value={form.time_limit_minutes} 
          onChange={handleChange} placeholder="VD: 30" min="1" max="120" required />
        </div>

        {/* Điểm đạt tối đa */}
        <div className="cw-form-group">
          <label className="cw-form-label">
            <span className="cw-form-label-text">Điểm đạt <span className="text-danger">*</span></span>
          </label>
          <input type="number" name="passing_score" className="cw-input" value={form.passing_score} 
          onChange={handleChange} placeholder="VD: 10" min="1" max="10" required />
          <p className="cw-form-help-text">Điểm của mỗi câu hỏi sẽ được chia đều dựa trên tổng số câu.</p>
        </div>

        {/* ESSAY: textarea nhập nội dung câu hỏi tự luận */}
        {isESSAY && (
          <div className="cw-form-group">
            <label className="cw-form-label">
              <span className="cw-form-label-text">Nội dung câu hỏi <span className="text-danger">*</span></span>
            </label>
            <textarea name="prompt" className="cw-textarea" value={form.prompt} 
            onChange={handleChange} rows={5} placeholder="Nhập nội dung câu hỏi tự luận..." />
          </div>
        )}

        {/* FILL_BLANK: textarea + input đáp án điền khuyết */}
        {isFillBlank && (
          <>
            <div className="cw-form-group">
              <label className="cw-form-label">
                <span className="cw-form-label-text">Nội dung câu hỏi <span className="text-danger">*</span></span>
              </label>
              <textarea name="prompt" className="cw-textarea" value={form.prompt} 
              onChange={handleChange} rows={5} placeholder={"VD: Python là {{ngôn ngữ lập trình}} được phát triển bởi {{Guido van Rossum}}."} />
              <p className="cw-form-help-text">Dùng <code>{`{{đáp án}}`}</code> để tạo chỗ trống. Nhiều đáp án: <code>{`{{đáp án 1|đáp án 2}}`}</code></p>
            </div>
            <div className="cw-form-group">
              <label className="cw-form-label">
                <span className="cw-form-label-text">Đáp án đúng <span className="text-danger">*</span></span>
              </label>
              <input type="text" name="correct_text_answer" className="cw-input" value={form.correct_text_answer} 
              onChange={handleChange} placeholder="VD: ngôn ngữ lập trình" />
              <p className="cw-form-help-text">Nhập đáp án đúng cho câu hỏi điền khuyết.</p>
            </div>
          </>
        )}

        {/* MCQ: nút import câu hỏi từ file (chỉ khi quiz đã lưu) */}
        {isMCQ && isSavedQuiz && (
          <div className="cw-form-group cw-import-section">
            <label className="cw-form-label"><span className="cw-form-label-text">Câu hỏi trắc nghiệm</span></label>
            <p className="text-muted cw-import-desc">Import danh sách câu hỏi từ file CSV hoặc XLSX.</p>
            <button className="cw-btn cw-btn-outline cw-btn-sm" onClick={() => onImportQuestions?.(quiz.id)}>
              <i className="bi bi-upload"></i> Import câu hỏi từ file
            </button>
          </div>
        )}
      </div>

      {/* Footer: nút Hủy và nút Lưu */}
      <div className="cw-editor-panel-footer">
        <button className="cw-btn cw-btn-secondary" onClick={onClose}>Hủy</button>
        <button className="cw-btn cw-btn-primary" onClick={handleSave} 
        disabled={saving || !form.title.trim() || !form.time_limit_minutes || !form.passing_score}>
          {saving ? (
            <><span className="spinner-border spinner-border-sm"></span> Đang lưu...</>
          ) : (
            <><i className="bi bi-check-lg"></i> Lưu</>
          )}
        </button>
      </div>
    </div>
  );
}

export default memo(QuizEditorPanel);