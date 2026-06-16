import React, { useState } from "react";
import LessonItem from "./LessonItem";
import "../../style/course-detail/course-section-accordion.css";

/**
 * Accordion cho mỗi chương học
 * Hiển thị tiêu đề chương, số bài, thời lượng, và danh sách bài học bên trong
 * Mỗi lesson có thể có quizzes hiển thị như các item con
 */
function CourseSectionAccordion({ chapter, index, completedLessons, isEnrolled }) {
  const [isOpen, setIsOpen] = useState(index === 0); // Mở chương đầu tiên mặc định

  const lessons = chapter.lessons || [];
  
  // Đếm tổng số items (lessons + quizzes)
  const allItems = lessons.flatMap((lesson) => {
    const items = [lesson];
    if (lesson.quizzes && lesson.quizzes.length > 0) {
      lesson.quizzes.forEach((quiz) => items.push({ ...quiz, _isQuiz: true, _parentLessonId: lesson.id }));
    }
    return items;
  });

  const totalItems = allItems.length;
  const completedInChapter = allItems.filter((item) =>
    completedLessons.has(item.id)
  ).length;

  const totalDuration = lessons.reduce((sum, l) => {
    const dur = parseInt(l.duration) || 0;
    return sum + dur;
  }, 0);

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} phút`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}g ${m}p` : `${h} giờ`;
  };

  return (
    <div className={`course-section ${isOpen ? "section-open" : ""}`}>
      <button
        type="button"
        className="section-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="section-header-left">
          <i className={`bi ${isOpen ? "bi-chevron-down" : "bi-chevron-right"}`}></i>
          <div className="section-info">
            <span className="section-title">
              Chương {index + 1}: {chapter.title || `Chương ${index + 1}`}
            </span>
            <span className="section-meta">
              {completedInChapter > 0 && (
                <span className="section-completed-badge">
                  {completedInChapter}/{totalItems}
                </span>
              )}
              <span>{totalItems} bài học</span>
              {totalDuration > 0 && (
                <>
                  <span className="meta-separator">•</span>
                  <span>{formatDuration(totalDuration)}</span>
                </>
              )}
            </span>
          </div>
        </div>
        <div className="section-header-right">
          {completedInChapter === totalItems && totalItems > 0 && (
            <i className="bi bi-check-circle-fill section-done-icon"></i>
          )}
        </div>
      </button>

      <div className={`section-body ${isOpen ? "body-open" : ""}`}>
        {lessons.length > 0 ? (
          <ul className="lesson-list">
            {lessons.map((lesson, lIndex) => {
              // Render lesson item
              const lessonItems = [];
              lessonItems.push(
                <LessonItem
                  key={lesson.id || `lesson-${lIndex}`}
                  lesson={lesson}
                  index={lIndex}
                  isCompleted={completedLessons.has(lesson.id)}
                  isEnrolled={isEnrolled}
                  isQuiz={false}
                />
              );
              // Render quiz items under this lesson
              if (lesson.quizzes && lesson.quizzes.length > 0) {
                lesson.quizzes.forEach((quiz, qIndex) => {
                  lessonItems.push(
                    <LessonItem
                      key={quiz.id || `quiz-${lesson.id}-${qIndex}`}
                      lesson={quiz}
                      index={lIndex + qIndex + 1}
                      isCompleted={completedLessons.has(quiz.id)}
                      isEnrolled={isEnrolled}
                      isQuiz={true}
                    />
                  );
                });
              }
              return lessonItems;
            })}
          </ul>
        ) : (
          <div className="section-empty">Chưa có bài học nào</div>
        )}
      </div>
    </div>
  );
}

export default CourseSectionAccordion;
