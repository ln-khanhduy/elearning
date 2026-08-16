import { memo, useCallback, useState, useRef } from "react";
import { toast } from "react-toastify";
import { Upload } from "tus-js-client";
import { initBunnyUploadApi } from "../../../api/lessonAPI";
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

  // ===== Upload trailer lên Bunny  =====
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoInputRef = useRef(null);

  const handleVideoFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVideoFile(file);
  }, []);

  const handleUploadVideo = useCallback(async () => {
    if (!videoFile) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const initRes = await initBunnyUploadApi(formData.title || "Video giới thiệu");
      const init = initRes?.data || initRes;
      if (!init?.tus_upload_url || !init?.signature || !init?.expiration_time) {
        throw new Error("Không thể khởi tạo upload Bunny.");
      }
      const upload = new Upload(videoFile, {
        endpoint: init.tus_upload_url,
        retryDelays: [0, 3000, 5000, 10000],
        headers: {
          AuthorizationSignature: init.signature,
          AuthorizationExpire: String(init.expiration_time),
          VideoId: init.video_id,
          LibraryId: String(init.library_id),
        },
        metadata: {
          filetype: videoFile.type,
          title: formData.title || "Video giới thiệu",
        },
        onProgress: (bytesSent, bytesTotal) => {
          const pct = bytesTotal > 0 ? Math.round((bytesSent / bytesTotal) * 100) : 0;
          setUploadProgress(pct);
        },
        onSuccess: () => {
          // Lưu playback_url vào preview_video_url
          const url = init.playback_url || "";
          onFieldChange("preview_video_url", url);
          setVideoFile(null);
          if (videoInputRef.current) videoInputRef.current.value = "";
          toast.success("Upload trailer lên Bunny thành công!");
          setUploading(false);
          setUploadProgress(100);
        },
        onError: (err) => {
          setUploading(false);
          toast.error(err?.message || "Upload trailer thất bại.");
        },
      });
      upload.start();
    } catch (err) {
      toast.error(err.message || "Upload trailer thất bại.");
      setUploading(false);
      setUploadProgress(0);
    }
  }, [videoFile, formData.title, onFieldChange]);

  const handleRemoveVideo = useCallback(() => {
    onFieldChange("preview_video_url", "");
    setVideoFile(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
  }, [onFieldChange]);

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
            minLength={5}
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
            rows={6}
            placeholder="Mô tả chi tiết về khóa học, kiến thức đạt được, đối tượng phù hợp..."
            maxLength={500}
            minLength={10}
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

        {/* Preview Video - Upload lên Bunny */}
        <div className="cw-form-group full-width">
          <label className="cw-form-label">
            <span className="cw-form-label-text">Video giới thiệu (trailer)</span>
          </label>
          {!formData.preview_video_url && !videoFile && (
            <div className="cw-dropzone" onClick={() => videoInputRef.current?.click()}>
              <div className="cw-dropzone-icon"><i className="bi bi-cloud-upload"></i></div>
              <div className="cw-dropzone-text">Chọn file video trailer để upload lên Bunny</div>
              <div className="cw-dropzone-hint">Hỗ trợ: MP4, MOV, MKV,... (TUS, tự resume nếu mất mạng)</div>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                style={{ display: "none" }}
                onChange={handleVideoFileChange}
              />
            </div>
          )}
          {videoFile && (
            <div className="cw-file-preview">
              <div className="cw-file-preview-info">
                <i className="bi bi-film"></i>
                <span>{videoFile.name}</span>
              </div>
              <div className="cw-file-preview-actions">
                <button
                  type="button"
                  className="cw-btn cw-btn-outline cw-btn-sm"
                  onClick={() => videoInputRef.current?.click()}
                >
                  Đổi
                </button>
                <button
                  type="button"
                  className="cw-btn cw-btn-primary cw-btn-sm"
                  onClick={handleUploadVideo}
                  disabled={uploading}
                >
                  {uploading ? `${uploadProgress}%` : "Upload lên Bunny"}
                </button>
              </div>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                style={{ display: "none" }}
                onChange={handleVideoFileChange}
              />
            </div>
          )}
          {uploading && (
            <div className="progress mt-2" style={{ height: 8 }}>
              <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          )}
          {formData.preview_video_url && (
            <div className="cw-file-preview">
              <div className="cw-file-preview-info">
                <i className="bi bi-check-circle-fill text-success"></i>
                <span>Trailer đã sẵn sàng (Bunny Stream)</span>
              </div>
              <div className="cw-file-preview-actions">
                <a
                  href={formData.preview_video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cw-btn cw-btn-outline cw-btn-sm"
                >
                  Xem
                </a>
                <button
                  type="button"
                  className="cw-btn cw-btn-danger cw-btn-sm"
                  onClick={handleRemoveVideo}
                >
                  <i className="bi bi-trash"></i> Xóa
                </button>
              </div>
            </div>
          )}
          <div className="cw-hint-text">
            <i className="bi bi-info-circle"></i>
            Video giới thiệu ngắn để thu hút học viên.
          </div>
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