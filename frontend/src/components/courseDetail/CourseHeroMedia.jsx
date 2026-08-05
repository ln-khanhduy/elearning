import React, { useState } from "react";
import { getYouTubeEmbedUrl } from "../../utils/youtube";

/**
 * CourseHeroMedia - Hiển thị ảnh bìa hoặc video giới thiệu khóa học
 * Quản lý state showPreview để chuyển đổi giữa ảnh và video
 */
function CourseHeroMedia({ title, thumbnailUrl, previewVideoUrl }) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="course-hero-thumbnail">
      <div className="course-hero-thumb-mockup">
        {showPreview && previewVideoUrl ? (
          // Đã bật preview: hiển thị iframe video YouTube
          <div className="course-hero-video-wrapper">
            <iframe src={getYouTubeEmbedUrl(previewVideoUrl)} title="Video giới thiệu khóa học"
              className="course-hero-video-iframe"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen frameBorder="0"></iframe>
          </div>
        ) : thumbnailUrl ? (
          // Có ảnh bìa: hiển thị ảnh + nút xem video giới thiệu
          <>
            <img
              src={thumbnailUrl}
              alt={title}
              className="course-hero-thumb-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = "none";
              }}
            />
            {previewVideoUrl && (
              <button className="course-hero-play-btn" onClick={() => setShowPreview(true)} title="Xem video giới thiệu">
                <i className="bi bi-play-circle-fill"></i><span>Xem giới thiệu</span>
              </button>
            )}
          </>
        ) : (
          // Không có ảnh bìa: hiển thị placeholder + nút xem video hoặc icon mặc định
          <div className="course-hero-thumb-placeholder">
            {previewVideoUrl ? (
              <button className="course-hero-play-btn course-hero-play-btn--center" onClick={() => setShowPreview(true)} title="Xem video giới thiệu">
                <i className="bi bi-play-circle-fill"></i><span>Xem giới thiệu</span>
              </button>
            ) : (
              <><i className="bi bi-play-circle"></i><span>Xem preview</span></>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CourseHeroMedia;
