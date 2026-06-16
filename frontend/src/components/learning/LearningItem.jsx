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

  return (
    <button
      className={`learning-item ${isActive ? "learning-item--active" : ""} ${
        isCompleted ? "learning-item--completed" : ""
      }`}
      onClick={() => onClick(lesson.id)}
      title={lesson.title}
    >
      <span className="learning-item-icon">
        {isCompleted ? (
          <i className="bi bi-check-circle-fill learning-item-check"></i>
        ) : (
          <i className={`bi ${getIcon(lesson.content_type)}`}></i>
        )}
      </span>
      <span className="learning-item-title">{lesson.title}</span>
      {lesson.is_free && <span className="learning-item-free">Miễn phí</span>}
    </button>
  );
}

export default LearningItem;
