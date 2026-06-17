import React from "react";

/**
 * LearningNavigation - Thanh điều hướng giữa các bài học.
 * Hiển thị nút "Bài trước", "Đánh dấu hoàn thành", "Bài tiếp theo".
 */
function LearningNavigation({
  prevLesson,
  nextLesson,
  currentLesson,
  onPrev,
  onNext,
  onMarkComplete,
  isCompleted,
  isEnrolled = true,
}) {
  return (
    <div className="learning-navigation">
      <div className="learning-navigation-left">
        {prevLesson ? (
          <button className="learning-nav-btn learning-nav-btn--prev" onClick={onPrev}>
            <i className="bi bi-chevron-left"></i>
            <span className="learning-nav-text">
              <span className="learning-nav-label">Bài trước</span>
              <span className="learning-nav-title">{prevLesson.title}</span>
            </span>
          </button>
        ) : (
          <div></div>
        )}
      </div>

      <div className="learning-navigation-center">
        {isEnrolled && currentLesson && !isCompleted && (
          <button className="learning-nav-btn learning-nav-btn--complete" onClick={onMarkComplete}>
            <i className="bi bi-check-lg"></i>
            Đánh dấu hoàn thành
          </button>
        )}
        {isEnrolled && currentLesson && isCompleted && (
          <span className="learning-nav-completed">
            <i className="bi bi-check-circle-fill"></i>
            Đã hoàn thành
          </span>
        )}
        {!isEnrolled && currentLesson && (
          <span className="learning-nav-free-notice">
            <i className="bi bi-unlock"></i>
            Bài học miễn phí
          </span>
        )}
      </div>

      <div className="learning-navigation-right">
        {nextLesson ? (
          <button className="learning-nav-btn learning-nav-btn--next" onClick={onNext}>
            <span className="learning-nav-text">
              <span className="learning-nav-label">Bài tiếp theo</span>
              <span className="learning-nav-title">{nextLesson.title}</span>
            </span>
            <i className="bi bi-chevron-right"></i>
          </button>
        ) : (
          <div></div>
        )}
      </div>
    </div>
  );
}

export default LearningNavigation;
