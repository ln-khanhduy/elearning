import React from "react";

/**
 * VideoLesson - Hiển thị bài học dạng video.
 * Hỗ trợ YouTube embed và các URL video khác.
 * Nếu bài học có tài liệu đính kèm (material_url), hiển thị thêm phần tải tài liệu.
 */
function VideoLesson({ lesson }) {
  if (!lesson) return null;

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    // youtube.com/watch?v=VIDEO_ID
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return url;
  };

  const embedUrl = getYouTubeEmbedUrl(lesson.video_url);

  return (
    <div className="video-lesson">
      <div className="video-lesson-wrapper">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={lesson.title}
            className="video-lesson-iframe"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            frameBorder="0"
          ></iframe>
        ) : (
          <div className="video-lesson-placeholder">
            <i className="bi bi-play-circle"></i>
            <p>Video không khả dụng</p>
          </div>
        )}
      </div>
      <div className="video-lesson-info">
        <h2 className="video-lesson-title">{lesson.title}</h2>
        {lesson.description && (
          <p className="video-lesson-description">{lesson.description}</p>
        )}
      </div>

      {/* Tài liệu đính kèm (nếu có) */}
      {lesson.material_url && (
        <div className="video-lesson-materials">
          <div className="video-lesson-materials-divider">
            <i className="bi bi-paperclip"></i>
            <span>Tài liệu đính kèm</span>
          </div>
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
        </div>
      )}
    </div>
  );
}

export default VideoLesson;
