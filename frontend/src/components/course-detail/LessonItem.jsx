import React from "react";
import "../../style/course-detail/lesson-item.css";

/**
 * Mỗi item bài học trong danh sách
 * Hiển thị: icon loại bài, tiêu đề, thời lượng, trạng thái hoàn thành
 * Hỗ trợ: lesson (content_type: VIDEO/DOCUMENT) và quiz items
 */
function LessonItem({ lesson, index, isCompleted, isEnrolled, isQuiz = false }) {
  const getLessonIcon = (type) => {
    if (isQuiz) return "bi-puzzle";
    switch (type?.toUpperCase()) {
      case "VIDEO":
        return "bi-play-circle";
      case "DOCUMENT":
        return "bi-file-text";
      default:
        return "bi-file-earmark-play";
    }
  };

  const getLessonTypeLabel = (type) => {
    if (isQuiz) return "Bài tập";
    switch (type?.toUpperCase()) {
      case "VIDEO":
        return "Video";
      case "DOCUMENT":
        return "Tài liệu";
      default:
        return "Bài học";
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return null;
    const num = parseInt(minutes);
    if (num < 60) return `${num}:00`;
    const h = Math.floor(num / 60);
    const m = num % 60;
    return `${h}:${m.toString().padStart(2, "0")}`;
  };

  return (
    <li className={`lesson-item ${isCompleted ? "lesson-completed" : ""} ${isQuiz ? "lesson-quiz" : ""}`}>
      <div className="lesson-item-left">
        <span className="lesson-index">{index + 1}</span>
        <i className={`bi ${getLessonIcon(lesson.content_type)} lesson-type-icon`}></i>
        <div className="lesson-info">
          <span className="lesson-title">{lesson.title || `Bài ${index + 1}`}</span>
          <span className="lesson-type-label">
            {getLessonTypeLabel(lesson.content_type)}
          </span>
        </div>
      </div>
      <div className="lesson-item-right">
        {lesson.duration && !isQuiz && (
          <span className="lesson-duration">
            <i className="bi bi-clock"></i>
            {formatDuration(lesson.duration)}
          </span>
        )}
        {isCompleted ? (
          <span className="lesson-status status-done">
            <i className="bi bi-check-circle-fill"></i>
          </span>
        ) : isEnrolled ? (
          <span className="lesson-status status-pending">
            <i className="bi bi-circle"></i>
          </span>
        ) : (
          <span className="lesson-status status-locked">
            <i className="bi bi-lock"></i>
          </span>
        )}
      </div>
    </li>
  );
}

export default LessonItem;
