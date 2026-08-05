import React, { useState } from "react";
import LessonItem from "./LessonItem";
import "../../style/courseDetail/course-section-accordion.css";

/**
 * CourseSectionAccordion - Accordion hiển thị từng chương học
 * Gồm: tiêu đề chương, số bài, thời lượng, danh sách bài học bên trong
 * Mỗi lesson có thể có quizzes hiển thị như item con
 */
function CourseSectionAccordion({ chapter, index, completedLessons, isEnrolled }) {
  const [isOpen, setIsOpen] = useState(index === 0); // Mở chương đầu tiên mặc định
  const lessons = chapter.lessons || [];

  // Chỉ đếm lessons, không gộp quizzes vào danh sách đếm hoàn thành
  const totalItems = lessons.length;
  const completedInChapter = lessons.filter((lesson) => completedLessons.has(lesson.id)).length;

  return (
    <div className={`course-section ${isOpen ? "section-open" : ""}`}>
      {/* Click để mở/đóng accordion */}
      <button type="button" className="section-header" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
        <div className="section-header-left">
          <i className={`bi ${isOpen ? "bi-chevron-down" : "bi-chevron-right"}`}></i>
          <div className="section-info">
            <span className="section-title">Chương {index + 1}: {chapter.title || `Chương ${index + 1}`}</span>
            <span className="section-meta">
              {completedInChapter > 0 && <span className="section-completed-badge">{completedInChapter}/{totalItems}</span>}
              <span>{totalItems} bài học</span>
            </span>
          </div>
        </div>
        <div className="section-header-right">
          {completedInChapter === totalItems && totalItems > 0 && <i className="bi bi-check-circle-fill section-done-icon"></i>}
        </div>
      </button>

      {/* Nội dung chương: danh sách bài học + quizzes */}
      <div className={`section-body ${isOpen ? "body-open" : ""}`}>
        {lessons.length > 0 ? (
          <ul className="lesson-list">
            {lessons.map((lesson, lIndex) => {
              const lessonItems = [
                <LessonItem key={lesson.id || `lesson-${lIndex}`} lesson={lesson} index={lIndex}
                  isCompleted={completedLessons.has(lesson.id)} isEnrolled={isEnrolled} isQuiz={false} />
              ];
              // Render quizzes bên dưới lesson tương ứng
              if (lesson.quizzes?.length) {
                lesson.quizzes.forEach((quiz, qIndex) => {
                  lessonItems.push(
                    <LessonItem key={quiz.id || `quiz-${lesson.id}-${qIndex}`} lesson={quiz}
                      index={lIndex + qIndex + 1} isCompleted={completedLessons.has(quiz.id)}
                      isEnrolled={isEnrolled} isQuiz={true} />
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
