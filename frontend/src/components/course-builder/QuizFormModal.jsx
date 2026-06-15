export default function QuizFormModal({
  quizForm,
  editingQuizId,
  onChange,
  onSave,
  onCancel,
}) {
  return (
    <div className="modal-backdrop-custom">
      <div className="modal-content-custom">
        <h5 className="fw-bold mb-3">
          {editingQuizId ? "Chỉnh sửa bài tập" : "Thêm bài tập mới"}
        </h5>
        <div className="course-form-group">
          <label className="course-form-label">Tên bài tập <span className="text-danger">*</span></label>
          <input
            type="text" className="course-form-input"
            value={quizForm.title}
            onChange={(e) => onChange({ ...quizForm, title: e.target.value })}
          />
        </div>
        <div className="course-form-group">
          <label className="course-form-label">Mô tả</label>
          <textarea
            className="course-form-textarea" rows={2}
            value={quizForm.description}
            onChange={(e) => onChange({ ...quizForm, description: e.target.value })}
          />
        </div>
        <div className="course-form-row">
          <div className="course-form-group">
            <label className="course-form-label">Thời gian (phút)</label>
            <input
              type="number" className="course-form-input" min="0"
              value={quizForm.time_limit_minutes || ""}
              onChange={(e) => onChange({ ...quizForm, time_limit_minutes: e.target.value })}
            />
          </div>
          <div className="course-form-group">
            <label className="course-form-label">Điểm đạt</label>
            <input
              type="number" className="course-form-input" min="0"
              value={quizForm.passing_score}
              onChange={(e) => onChange({ ...quizForm, passing_score: e.target.value })}
            />
          </div>
        </div>
        <div className="d-flex gap-2 mt-3">
          <button className="course-btn-primary btn-sm" onClick={onSave}>
            {editingQuizId ? "Cập nhật" : "Thêm"}
          </button>
          <button className="course-btn-outline btn-sm" onClick={onCancel}>Hủy</button>
        </div>
      </div>
    </div>
  );
}
