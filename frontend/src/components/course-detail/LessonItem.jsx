import React from "react";
import "../../style/course-detail/lesson-item.css";

/**
 * LessonItem - Item bài học trong danh sách nội dung khóa học
 * Hiển thị: icon loại bài, tiêu đề, trạng thái hoàn thành
 * Hỗ trợ: lesson (VIDEO/DOCUMENT) và quiz items
 */
function LessonItem({ lesson, index, isCompleted, isEnrolled, isQuiz = false }) {
  // Lấy icon theo loại bài học
  const getLessonIcon = (type) => {
    if (isQuiz) return "bi-puzzle";
    switch (type?.toUpperCase()) {
      case "VIDEO": return "bi-play-circle";
      case "DOCUMENT": return "bi-file-text";
      default: return "bi-file-earmark-play";
    }
  };

  // Lấy nhãn loại bài học
  const getLessonTypeLabel = (type) => {
    if (isQuiz) return "Bài tập";
    switch (type?.toUpperCase()) {
      case "VIDEO": return "Video";
      case "DOCUMENT": return "Tài liệu";
      default: return "Bài học";
    }
  };

  return (
    <li className={`lesson-item ${isCompleted ? "lesson-completed" : ""} ${isQuiz ? "lesson-quiz" : ""}`}>
      <div className="lesson-item-left">
        <span className="lesson-index">{index + 1}</span>
        <i className={`bi ${getLessonIcon(lesson.content_type)} lesson-type-icon`}></i>
        <div className="lesson-info">
          <span className="lesson-title">{lesson.title || `Bài ${index + 1}`}</span>
          <span className="lesson-type-label">{getLessonTypeLabel(lesson.content_type)}</span>
        </div>
      </div>
      <div className="lesson-item-right">
        {isCompleted
          ? <span className="lesson-status status-done"><i className="bi bi-check-circle-fill"></i></span>
          : isEnrolled
            ? <span className="lesson-status status-pending"><i className="bi bi-circle"></i></span>
            : <span className="lesson-status status-locked"><i className="bi bi-lock"></i></span>}
      </div>
    </li>
  );
}

export default LessonItem;
