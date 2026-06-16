export default function ChapterFormModal({
  chapterForm,
  editingChapterId,
  onChange,
  onSave,
  onCancel,
}) {
  return (
    <div className="chapter-form mb-3 p-3 bg-light rounded border">
      <h6 className="fw-bold mb-2">
        {editingChapterId ? "Chỉnh sửa chương" : "Thêm chương mới"}
      </h6>
      <div className="course-form-row">
        <div className="course-form-group flex-grow-1">
          <input
            type="text" className="course-form-input"
            placeholder="Tên chương"
            value={chapterForm.title}
            onChange={(e) => onChange({ ...chapterForm, title: e.target.value })}
          />
        </div>
        <div className="course-form-group flex-grow-1">
          <input
            type="text" className="course-form-input"
            placeholder="Mô tả (không bắt buộc)"
            value={chapterForm.description}
            onChange={(e) => onChange({ ...chapterForm, description: e.target.value })}
          />
        </div>
      </div>
      <div className="d-flex gap-2 mt-2">
        <button type="button" className="course-btn-primary btn-sm" onClick={onSave}>
          {editingChapterId ? "Cập nhật" : "Thêm"}
        </button>
        <button type="button" className="course-btn-outline btn-sm" onClick={onCancel}>Hủy</button>
      </div>
    </div>
  );
}
