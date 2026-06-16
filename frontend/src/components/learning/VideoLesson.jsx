import React from "react";

/**
 * VideoLesson - Hiển thị bài học dạng video.
 * Hỗ trợ YouTube embed và các URL video khác.
 */
function VideoLesson({ lesson }) {
  if (!lesson) return null;

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    // youtube.com/watch?v=VIDEO_ID
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
    );
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
    </div>
  );
}

export default VideoLesson;
