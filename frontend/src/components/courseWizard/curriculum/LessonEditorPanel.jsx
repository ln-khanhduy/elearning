import { memo, useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { Upload } from "tus-js-client";
import { initBunnyUploadApi } from "../../../api/lessonAPI";

function LessonEditorPanel({ lesson, sectionId, onClose, onSave, saving, isPublished = false }) {
  const [form, setForm] = useState({ title: "", description: "", content_type: "VIDEO", video_url: "" });
  const [materialFile, setMaterialFile] = useState(null);
  const [materialPreview, setMaterialPreview] = useState("");
  const [materialRemoved, setMaterialRemoved] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dirty, setDirty] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    if (lesson) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        title: lesson.title || "",
        description: lesson.description || "",
        content_type: lesson.content_type || "VIDEO",
        video_url: lesson.video_url || "",
      });
      setMaterialFile(null);
      setMaterialPreview(lesson.material_url || "");
      setMaterialRemoved(false);
      setVideoFile(null);
      setDirty(false);
    }
  }, [lesson]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    if (isPublished && ["title", "description", "content_type"].includes(name)) {
      return; // Khóa đã public — không cho sửa nội dung ngoài video/material
    }
    setForm((prev) => ({ ...prev, [name]: value }));
    setDirty(true);
  }, [isPublished]);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setMaterialFile(file);
      setMaterialPreview(URL.createObjectURL(file));
      setMaterialRemoved(false);
      setDirty(true);
    }
  }, []);

  const handleRemoveFile = useCallback(() => {
    setMaterialFile(null);
    setMaterialPreview("");
    setMaterialRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setDirty(true);
  }, []);

  const handleVideoFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVideoFile(file);
    setDirty(true);
  }, []);

  // Bunny TUS Upload: backend tạo video + cấp signature; frontend dung tus-js-client
  const handleUploadVideo = useCallback(async () => {
    if (!videoFile) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const initRes = await initBunnyUploadApi(form.title || "Bai hoc video");
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
          title: form.title || "Bai hoc video",
        },
        onProgress: (bytesSent, bytesTotal) => {
          const pct = bytesTotal > 0 ? Math.round((bytesSent / bytesTotal) * 100) : 0;
          setUploadProgress(pct);
        },
        onSuccess: () => {
          setForm((prev) => ({ ...prev, video_url: init.playback_url || "" }));
          setVideoFile(null);
          if (videoInputRef.current) videoInputRef.current.value = "";
          toast.success("Upload video lên Bunny thành công!");
          setDirty(true);
          setUploading(false);
          setUploadProgress(100);
        },
        onError: (err) => {
          setUploading(false);
          if (err?.message) toast.error(err.message);
        },
      });
      upload.start();
    } catch (err) {
      if (err?.message) toast.error(err.message);
      setUploading(false);
      setUploadProgress(0);
    }
  }, [videoFile, form.title]);

  const handleSave = useCallback(() => {
    // Khi khóa PUBLISHED: chỉ gửi video/material — giữ nguyên title/description/content_type gốc
    const payload = { id: lesson?.id, section_id: sectionId };
    if (isPublished) {
      payload.video_url = form.video_url;
    } else {
      Object.assign(payload, form);
    }
    if (materialFile) {
      payload.material_file = materialFile;
    } else if (materialRemoved) {
      payload.material_url = "";
    }
    onSave?.(payload);
    setDirty(false);
  }, [form, materialFile, materialRemoved, lesson, sectionId, onSave, isPublished]);

  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
  }, [handleSave]);

  return (
    <div className="cw-editor-panel-inner" onKeyDown={handleKeyDown}>
      {isPublished && (
        <div className="cw-published-warning">
          <i className="bi bi-exclamation-triangle me-1"></i>
          Khóa đã public — chỉ được phép thay video/tài liệu hỏng. Các trường khác đã khóa.
        </div>
      )}
      <div className="cw-editor-panel-header">
        <h4>{lesson?.id ? "Chỉnh sửa bài học" : "Thêm bài học mới"}</h4>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {dirty && <span className="cw-save-indicator"><i className="bi bi-circle-fill text-warning" style={{ fontSize: 8 }}></i> Chưa lưu</span>}
          <button className="cw-editor-panel-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
      </div>

      <div className="cw-editor-panel-body">
        <div className="cw-form-group">
          <label className="cw-form-label"><span className="cw-form-label-text">Tiêu đề bài học <span className="text-danger">*</span></span></label>
          <input type="text" name="title" className="cw-input" value={form.title} onChange={handleChange} disabled={isPublished} placeholder="VD: Giới thiệu về Python" />
        </div>

        <div className="cw-form-group">
          <label className="cw-form-label"><span className="cw-form-label-text">Mô tả</span></label>
          <textarea name="description" className="cw-textarea" value={form.description} onChange={handleChange} disabled={isPublished} rows={3} placeholder="Mô tả ngắn về bài học..." />
        </div>

        <div className="cw-form-group">
          <label className="cw-form-label"><span className="cw-form-label-text">Loại nội dung</span></label>
          <select name="content_type" className="cw-select" value={form.content_type} onChange={handleChange} disabled={isPublished}>
            <option value="VIDEO">Video</option>
            <option value="DOCUMENT">Tài liệu</option>
          </select>
        </div>

        {form.content_type === "VIDEO" && (
          <div className="cw-form-group">
            <label className="cw-form-label"><span className="cw-form-label-text">Video <span className="text-danger">*</span></span></label>
            {!form.video_url && !videoFile && (
              <div className="cw-dropzone" onClick={() => videoInputRef.current?.click()}>
                <div className="cw-dropzone-icon"><i className="bi bi-cloud-upload"></i></div>
                <div className="cw-dropzone-text">Chọn file video để upload lên Bunny</div>
                <div className="cw-dropzone-hint">Hỗ trợ: MP4, MOV, MKV,... (TUS, tự resume nếu mất mạng)</div>
                <input ref={videoInputRef} type="file" accept="video/*" style={{ display: "none" }} onChange={handleVideoFileChange} />
              </div>
            )}
            {videoFile && (
              <div className="cw-file-preview">
                <div className="cw-file-preview-info">
                  <i className="bi bi-film"></i>
                  <span>{videoFile.name}</span>
                </div>
                <div className="cw-file-preview-actions">
                  <button type="button" className="cw-btn cw-btn-outline cw-btn-sm" onClick={() => videoInputRef.current?.click()}>Đổi</button>
                  <button type="button" className="cw-btn cw-btn-primary cw-btn-sm" onClick={handleUploadVideo} disabled={uploading}>
                    {uploading ? `${uploadProgress}%` : "Upload lên Bunny"}
                  </button>
                </div>
                <input ref={videoInputRef} type="file" accept="video/*" style={{ display: "none" }} onChange={handleVideoFileChange} />
              </div>
            )}
            {uploading && (
              <div className="progress mt-2" style={{ height: 8 }}>
                <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}
            {form.video_url && (
              <div className="cw-file-preview">
                <div className="cw-file-preview-info"><i className="bi bi-check-circle-fill text-success"></i><span>Video đã sẵn sàng (Bunny Stream)</span></div>
                <div className="cw-file-preview-actions">
                  <button type="button" className="cw-btn cw-btn-danger cw-btn-sm" onClick={() => setForm((p) => ({ ...p, video_url: "" }))}>Xóa</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="cw-form-group">
          <label className="cw-form-label"><span className="cw-form-label-text">Tài liệu đính kèm {form.content_type === "DOCUMENT" ? <span className="text-danger">*</span> : <span className="cw-form-label-hint"> (tùy chọn)</span>}</span></label>
            {materialPreview ? (
              <div className="cw-file-preview">
                <div className="cw-file-preview-info"><i className="bi bi-file-earmark-text"></i><span>{materialFile ? materialFile.name : "Tài liệu đã tải lên"}</span></div>
                <div className="cw-file-preview-actions">
                  <button type="button" className="cw-btn cw-btn-outline cw-btn-sm" onClick={() => fileInputRef.current?.click()}><i className="bi bi-arrow-repeat"></i> Đổi file</button>
                  <button type="button" className="cw-btn cw-btn-danger cw-btn-sm" onClick={handleRemoveFile}><i className="bi bi-trash"></i> Xóa</button>
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.rar" style={{ display: "none" }} onChange={handleFileChange} />
              </div>
            ) : (
              <div className="cw-dropzone" onClick={() => fileInputRef.current?.click()}>
                <div className="cw-dropzone-icon"><i className="bi bi-cloud-upload"></i></div>
                <div className="cw-dropzone-text">Kéo thả file hoặc nhấp để chọn</div>
                <div className="cw-dropzone-hint">Hỗ trợ: PDF, DOC, DOCX, PPT, TXT, RAR</div>
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.rar" style={{ display: "none" }} onChange={handleFileChange} />
              </div>
            )}
        </div>
      </div>

      <div className="cw-editor-panel-footer">
        <button className="cw-btn cw-btn-secondary" onClick={onClose}>Hủy</button>
        <button className="cw-btn cw-btn-primary" onClick={handleSave} disabled={saving || !form.title.trim() || (form.content_type === "VIDEO" && !form.video_url) || uploading}>
          {saving ? <><span className="spinner-border spinner-border-sm"></span> Đang lưu...</> : <><i className="bi bi-check-lg"></i> Lưu</>}
        </button>
      </div>
    </div>
  );
}

export default memo(LessonEditorPanel);