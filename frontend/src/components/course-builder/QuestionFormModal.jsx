import OptionEditor from "./OptionEditor";

export default function QuestionFormModal({
  questionForm,
  editingQuestionId,
  onChange,
  onSave,
  onCancel,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
}) {
  return (
    <div className="modal-backdrop-custom">
      <div className="modal-content-custom">
        <h5 className="fw-bold mb-3">
          {editingQuestionId ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
        </h5>
        <div className="course-form-group">
          <label className="course-form-label">Loại câu hỏi</label>
          <select
            className="course-form-input"
            value={questionForm.question_type}
            onChange={(e) => onChange({ ...questionForm, question_type: e.target.value })}
          >
            <option value="MCQ">Trắc nghiệm</option>
            <option value="FILL_BLANK">Điền khuyết</option>
            <option value="ESSAY">Tự luận</option>
          </select>
        </div>
        <div className="course-form-group">
          <label className="course-form-label">Nội dung câu hỏi <span className="text-danger">*</span></label>
          <textarea
            className="course-form-textarea" rows={3}
            value={questionForm.prompt}
            onChange={(e) => onChange({ ...questionForm, prompt: e.target.value })}
          />
        </div>
        <div className="course-form-row">
          <div className="course-form-group">
            <label className="course-form-label">Điểm</label>
            <input
              type="number" className="course-form-input" min="0.5" step="0.5"
              value={questionForm.points}
              onChange={(e) => onChange({ ...questionForm, points: e.target.value })}
            />
          </div>
          <div className="course-form-group">
            <label className="course-form-label">Thứ tự</label>
            <input
              type="number" className="course-form-input" min="1"
              value={questionForm.order}
              onChange={(e) => onChange({ ...questionForm, order: e.target.value })}
            />
          </div>
        </div>

        {questionForm.question_type === "FILL_BLANK" && (
          <div className="course-form-group">
            <label className="course-form-label">Đáp án đúng <span className="text-danger">*</span></label>
            <input
              type="text" className="course-form-input"
              value={questionForm.correct_text_answer}
              onChange={(e) => onChange({ ...questionForm, correct_text_answer: e.target.value })}
              placeholder="Nhập đáp án đúng"
            />
          </div>
        )}

        {questionForm.question_type === "MCQ" && (
          <OptionEditor
            options={questionForm.options}
            onAdd={onAddOption}
            onUpdate={onUpdateOption}
            onRemove={onRemoveOption}
          />
        )}

        <div className="d-flex gap-2 mt-3">
          <button type="button" className="course-btn-primary btn-sm" onClick={onSave}>
            {editingQuestionId ? "Cập nhật" : "Thêm"}
          </button>
          <button type="button" className="course-btn-outline btn-sm" onClick={onCancel}>Hủy</button>
        </div>
      </div>
    </div>
  );
}
