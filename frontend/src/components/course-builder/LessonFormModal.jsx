export default function LessonFormModal({
  lessonForm,
  editingLessonId,
  onChange,
  onSave,
  onCancel,
}) {
  return (
    <div className="modal-backdrop-custom">
      <div className="modal-content-custom">
        <h5 className="fw-bold mb-3">
          {editingLessonId ? "Chỉnh sửa bài học" : "Thêm bài học mới"}
        </h5>
        <div className="course-form-group">
          <label className="course-form-label">Tên bài học <span className="text-danger">*</span></label>
          <input
            type="text" className="course-form-input"
            value={lessonForm.title}
            onChange={(e) => onChange({ ...lessonForm, title: e.target.value })}
          />
        </div>
        <div className="course-form-group">
          <label className="course-form-label">Mô tả</label>
          <textarea
            className="course-form-textarea" rows={2}
            value={lessonForm.description}
            onChange={(e) => onChange({ ...lessonForm, description: e.target.value })}
          />
        </div>
        <div className="course-form-row">
          <div className="course-form-group">
            <label className="course-form-label">Loại nội dung</label>
            <select
              className="course-form-input"
              value={lessonForm.content_type}
              onChange={(e) => onChange({ ...lessonForm, content_type: e.target.value })}
            >
              <option value="VIDEO">Video</option>
              <option value="DOCUMENT">Tài liệu</option>
            </select>
          </div>
          <div className="course-form-group">
            <label className="course-form-label">Miễn phí</label>
            <select
              className="course-form-input"
              value={lessonForm.is_free ? "true" : "false"}
              onChange={(e) => onChange({ ...lessonForm, is_free: e.target.value === "true" })}
            >
              <option value="false">Không</option>
              <option value="true">Có</option>
            </select>
          </div>
        </div>
        {lessonForm.content_type === "VIDEO" && (
          <div className="course-form-group">
            <label className="course-form-label">URL Video (YouTube)</label>
            <input
              type="url" className="course-form-input"
              value={lessonForm.video_url}
              onChange={(e) => onChange({ ...lessonForm, video_url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
        )}
        <div className="course-form-group">
          <label className="course-form-label">Tài liệu đính kèm</label>
          <input
            type="file" className="course-form-input"
            accept=".pdf,.doc,.docx"
            onChange={(e) => onChange({ ...lessonForm, material_file: e.target.files[0] })}
          />
        </div>
        <div className="d-flex gap-2 mt-3">
          <button type="button" className="course-btn-primary btn-sm" onClick={onSave}>
            {editingLessonId ? "Cập nhật" : "Thêm"}
          </button>
          <button type="button" className="course-btn-outline btn-sm" onClick={onCancel}>Hủy</button>
        </div>
      </div>
    </div>
  );
}
