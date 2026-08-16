import React from "react";

/**
 * VideoLesson - Hiển thị bài học dạng video.
 * Hỗ trợ: Bunny Stream (iframe.mediadelivery.net), YouTube embed và URL video khác.
 */
function VideoLesson({ lesson }) {
  if (!lesson) return null;

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
    return url;
  };

  const url = lesson.video_url;
  const isBunny = !!url && url.includes("iframe.mediadelivery.net");
  // Bunny: dùng iframe embed (chuyển /play/ -> /embed/ nếu backend trả URL play)
  const bunnyEmbedUrl = isBunny ? url.replace("/play/", "/embed/") : null;
  const youtubeEmbedUrl = isBunny ? null : getYouTubeEmbedUrl(url);
  // Các URL trực tiếp khác (mp4...) phát qua thẻ <video>
  const isDirectVideo = !isBunny && !!url && !youtubeEmbedUrl;

  return (
    <div className="video-lesson">
      <div className="video-lesson-wrapper">
        {bunnyEmbedUrl ? (
          <iframe
            src={bunnyEmbedUrl}
            title={lesson.title}
            className="video-lesson-iframe"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            frameBorder="0"
          ></iframe>
        ) : youtubeEmbedUrl ? (
          <iframe
            src={youtubeEmbedUrl}
            title={lesson.title}
            className="video-lesson-iframe"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            frameBorder="0"
          ></iframe>
        ) : isDirectVideo ? (
          <video controls className="video-lesson-iframe" src={url} style={{ width: "100%", background: "#000" }}></video>
        ) : (
          <div className="video-lesson-placeholder">
            <i className="bi bi-play-circle"></i>
            <p>Video không khả dụng</p>
          </div>
        )}
      </div>
      <div className="video-lesson-info">
        <h2 className="video-lesson-title">{lesson.title}</h2>
        {lesson.description && <p className="video-lesson-description">{lesson.description}</p>}
      </div>

      {lesson.material_url && (
        <div className="video-lesson-materials">
          <div className="video-lesson-materials-divider">
            <i className="bi bi-paperclip"></i>
            <span>Tài liệu đính kèm</span>
          </div>
          <div className="document-lesson-download">
            <a href={lesson.material_url} target="_blank" rel="noopener noreferrer" className="document-lesson-btn">
              <i className="bi bi-download"></i> Tải tài liệu
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoLesson;