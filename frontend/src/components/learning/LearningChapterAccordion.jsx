import React, { useState } from "react";
import LearningItem from "./LearningItem";

/**
 * LearningChapterAccordion - Một section/chapter trong sidebar.
 * Dạng accordion, click để expand/collapse.
 * Hiển thị danh sách bài học bên trong.
 */
function LearningChapterAccordion({
  chapter,
  currentLessonId,
  completedLessonIds,
  onSelectLesson,
  defaultOpen = false,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const completedCount = chapter.lessons.filter((l) => l.completed).length;
  const totalCount = chapter.lessons.length;

  return (
    <div className={`learning-chapter ${isOpen ? "learning-chapter--open" : ""}`}>
      <button
        className="learning-chapter-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="learning-chapter-header-left">
          <i className={`bi ${isOpen ? "bi-chevron-down" : "bi-chevron-right"}`}></i>
          <span className="learning-chapter-title">{chapter.title}</span>
        </div>
        <span className="learning-chapter-count">
          {completedCount}/{totalCount}
        </span>
      </button>

      {isOpen && (
        <div className="learning-chapter-body">
          {chapter.lessons.map((lesson) => (
            <LearningItem
              key={lesson.id}
              lesson={lesson}
              isActive={lesson.id === currentLessonId}
              isCompleted={lesson.completed}
              onClick={onSelectLesson}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default LearningChapterAccordion;
