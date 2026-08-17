import { useState } from "react";
import { toast } from "react-toastify";
import { downloadAndSaveLessonMaterial } from "../../api/lessonAPI";

/**
 * DocumentLesson - Hiển thị bài học dạng tài liệu.
 * Tài liệu đính kèm được tải VỀ MÁY qua API (giữ tên file gốc), không mở tab mới.
 */
function DocumentLesson({ lesson }) {
  const [downloading, setDownloading] = useState(false);

  if (!lesson) return null;

  const handleDownloadMaterial = async () => {
    if (downloading || !lesson.id) return;
    setDownloading(true);
    try {
      await downloadAndSaveLessonMaterial(lesson.id, lesson.material_url);
      toast.success("Đang tải tài liệu về máy...");
    } catch (err) {
      toast.error(err.message || "Không thể tải tài liệu.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="document-lesson">
      <div className="document-lesson-header">
        <i className="bi bi-file-earmark-text document-lesson-icon"></i>
        <div>
          <h2 className="document-lesson-title">{lesson.title}</h2>
          {lesson.description && (
            <p className="document-lesson-description">{lesson.description}</p>
          )}
        </div>
      </div>

      {lesson.material_url && (
        <div className="document-lesson-download">
          <button
            type="button"
            onClick={handleDownloadMaterial}
            disabled={downloading}
            className="document-lesson-btn"
          >
            {downloading ? (
              <>
                <span className="spinner-border spinner-border-sm me-1"></span> Đang tải...
              </>
            ) : (
              <>
                <i className="bi bi-download"></i> Tải tài liệu về máy
              </>
            )}
          </button>
        </div>
      )}

      {!lesson.material_url && (
        <div className="document-lesson-empty">
          <i className="bi bi-file-earmark"></i>
          <p>Không có tài liệu đính kèm cho bài học này.</p>
        </div>
      )}
    </div>
  );
}

export default DocumentLesson;