export default function CourseInfoForm({
  formData,
  errors,
  categories,
  thumbnailPreview,
  saving,
  onCourseChange,
  onThumbnailChange,
  onSave,
}) {
  return (
    <form className="course-form" onSubmit={onSave}>
      <div className="course-form-card">
        <h4 className="course-form-section-title">Thông tin khóa học</h4>

        <div className="course-form-group">
          <label className="course-form-label">Tiêu đề <span className="text-danger">*</span></label>
          <input
            type="text" name="title"
            className={`course-form-input ${errors.title ? "is-invalid" : ""}`}
            value={formData.title} onChange={onCourseChange}
          />
          {errors.title && <small className="course-form-error">{errors.title}</small>}
        </div>

        <div className="course-form-group">
          <label className="course-form-label">Mô tả <span className="text-danger">*</span></label>
          <textarea
            name="description" rows={4}
            className={`course-form-textarea ${errors.description ? "is-invalid" : ""}`}
            value={formData.description} onChange={onCourseChange}
          />
          {errors.description && <small className="course-form-error">{errors.description}</small>}
        </div>

        <div className="course-form-row">
          <div className="course-form-group">
            <label className="course-form-label">Giá (VNĐ) <span className="text-danger">*</span></label>
            <input
              type="number" name="price" min="0"
              className={`course-form-input ${errors.price ? "is-invalid" : ""}`}
              value={formData.price} onChange={onCourseChange}
            />
            {errors.price && <small className="course-form-error">{errors.price}</small>}
          </div>
          <div className="course-form-group">
            <label className="course-form-label">Danh mục</label>
            <select
              name="category"
              className="course-form-input"
              value={formData.category}
              onChange={onCourseChange}
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="course-form-group">
          <label className="course-form-label">URL Video giới thiệu</label>
          <input
            type="url" name="preview_video_url"
            className={`course-form-input ${errors.preview_video_url ? "is-invalid" : ""}`}
            value={formData.preview_video_url} onChange={onCourseChange}
          />
          {errors.preview_video_url && <small className="course-form-error">{errors.preview_video_url}</small>}
        </div>

        <div className="course-form-group">
          <label className="course-form-label">Ảnh bìa</label>
          <div className="course-form-upload" onClick={() => document.getElementById("edit-thumb-input").click()}>
            <input id="edit-thumb-input" type="file" accept=".jpg,.jpeg,.png,.webp" className="d-none" onChange={onThumbnailChange} />
            {thumbnailPreview ? (
              <img src={thumbnailPreview} alt="Preview" className="course-form-upload-preview" />
            ) : (
              <div className="course-form-upload-placeholder">
                <i className="bi bi-cloud-upload"></i>
                <span>Nhấp để tải ảnh bìa</span>
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="course-form-actions">
        <button type="submit" className="course-btn-primary" disabled={saving}>
          {saving ? (
            <><span className="spinner-border spinner-border-sm me-2"></span>Đang lưu...</>
          ) : (
            <><i className="bi bi-check-lg me-2"></i>Lưu thay đổi</>
          )}
        </button>
      </div>
    </form>
  );
}
