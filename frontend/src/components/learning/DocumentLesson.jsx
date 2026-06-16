import React from "react";

/**
 * DocumentLesson - Hiển thị bài học dạng tài liệu.
 * Hiển thị nội dung mô tả và link tải tài liệu.
 */
function DocumentLesson({ lesson }) {
  if (!lesson) return null;

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
          <a
            href={lesson.material_url}
            target="_blank"
            rel="noopener noreferrer"
            className="document-lesson-btn"
          >
            <i className="bi bi-download"></i>
            Tải tài liệu
          </a>
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
