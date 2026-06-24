import { memo, useCallback } from "react";
import DragDropArea from "../shared/DragDropArea";

function StepCourseInformation({
  formData,
  errors,
  onFieldChange,
  onThumbnailChange,
  thumbnailPreview,
  categories,
}) {
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      onFieldChange(name, value);
    },
    [onFieldChange]
  );

  const handleFile = useCallback(
    (file) => {
      onThumbnailChange(file);
    },
    [onThumbnailChange]
  );

  const titleLen = formData.title?.length || 0;
  const descLen = formData.description?.length || 0;

  return (
    <div className="cw-card">
      <h3 className="cw-card-title">Thông tin khóa học</h3>

      <div className="cw-form-grid">
        {/* Title */}
        <div className="cw-form-group full-width">
          <label className="cw-form-label">
            <span className="cw-form-label-text">
              Tiêu đề khóa học <span className="text-danger">*</span>
            </span>
            <span className={`cw-char-count ${titleLen > 90 ? "warning" : ""}`}>
              {titleLen}/100
            </span>
          </label>
          <input
            type="text"
            name="title"
            className={`cw-input ${errors.title ? "error" : ""}`}
            value={formData.title || ""}
            onChange={handleChange}
            placeholder="VD: Lập trình Python từ cơ bản đến nâng cao"
            maxLength={100}
          />
          {errors.title && (
            <div className="cw-error-text">
              <i className="bi bi-exclamation-circle"></i>
              {errors.title}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="cw-form-group full-width">
          <label className="cw-form-label">
            <span className="cw-form-label-text">
              Mô tả khóa học <span className="text-danger">*</span>
            </span>
            <span className={`cw-char-count ${descLen > 480 ? "warning" : ""}`}>
              {descLen}/500
            </span>
          </label>
          <textarea
            name="description"
            className={`cw-textarea ${errors.description ? "error" : ""}`}
            value={formData.description || ""}
            onChange={handleChange}
            rows={4}
            placeholder="Mô tả chi tiết về khóa học, kiến thức đạt được, đối tượng phù hợp..."
            maxLength={500}
          />
          {errors.description && (
            <div className="cw-error-text">
              <i className="bi bi-exclamation-circle"></i>
              {errors.description}
            </div>
          )}
        </div>

        {/* Category */}
        <div className="cw-form-group">
          <label className="cw-form-label">
            <span className="cw-form-label-text">
              Danh mục <span className="text-danger">*</span>
            </span>
          </label>
          <select
            name="category"
            className={`cw-select ${errors.category ? "error" : ""}`}
            value={formData.category || ""}
            onChange={handleChange}
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category && (
            <div className="cw-error-text">
              <i className="bi bi-exclamation-circle"></i>
              {errors.category}
            </div>
          )}
        </div>

        {/* Thumbnail */}
        <div className="cw-form-group full-width">
          <label className="cw-form-label">
            <span className="cw-form-label-text">Ảnh bìa khóa học</span>
          </label>
          <DragDropArea
            onFile={handleFile}
            preview={thumbnailPreview}
            placeholder="Kéo thả ảnh bìa vào đây hoặc nhấp để chọn"
            hint="Hỗ trợ JPG, PNG, WEBP. Tối đa 5MB. Kích thước đề xuất: 1280x720px"
          />
          {errors.thumbnail && (
            <div className="cw-error-text">
              <i className="bi bi-exclamation-circle"></i>
              {errors.thumbnail}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(StepCourseInformation);
