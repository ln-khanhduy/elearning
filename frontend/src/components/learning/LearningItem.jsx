import React from "react";

/**
 * LearningItem - Một item bài học trong sidebar.
 * Hiển thị icon theo content_type, trạng thái completed, và highlight nếu đang active.
 */
function LearningItem({ lesson, isActive, isCompleted, onClick }) {
  const getIcon = (contentType) => {
    switch (contentType) {
      case "VIDEO":
        return "bi-play-circle";
      case "DOCUMENT":
        return "bi-file-text";
      case "QUIZ":
        return "bi-puzzle";
      default:
        return "bi-file-earmark";
    }
  };

  const isLocked = lesson.is_locked === true;

  const handleClick = () => {
    if (!isLocked) {
      onClick(lesson.id);
    }
  };

  return (
    <button
      className={`learning-item ${isActive ? "learning-item--active" : ""} ${
        isCompleted ? "learning-item--completed" : ""
      } ${isLocked ? "learning-item--locked" : ""}`}
      onClick={handleClick}
      title={isLocked ? "Bài học này cần đăng ký khóa học" : lesson.title}
      disabled={isLocked}
    >
      <span className="learning-item-icon">
        {isLocked ? (
          <i className="bi bi-lock-fill learning-item-lock"></i>
        ) : isCompleted ? (
          <i className="bi bi-check-circle-fill learning-item-check"></i>
        ) : (
          <i className={`bi ${getIcon(lesson.content_type)}`}></i>
        )}
      </span>
      <span className="learning-item-title">{lesson.title}</span>
    </button>
  );
}

export default LearningItem;
