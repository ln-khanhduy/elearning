import React, { useState } from "react";
import { Link } from "react-router-dom";
import LearningProgress from "./LearningProgress";
import LearningChapterAccordion from "./LearningChapterAccordion";

/**
 * LearningSidebar - Sidebar bên trái của learning page.
 * Hiển thị tiến độ và danh sách chương/bài học dạng accordion.
 */
function LearningSidebar({
  chapters,
  currentLessonId,
  progress,
  courseCompleted,
  certificate,
  onSelectLesson,
  onCompleteCourse,
  isOpen,
  onClose,
}) {
  const [completing, setCompleting] = useState(false);

  if (!chapters) return null;

  const progressPercent = progress?.progress_percent ?? 0;

  const handleCompleteCourse = async () => {
    if (completing) return;
    setCompleting(true);
    try {
      await onCompleteCourse();
    } catch (err) {
      // Error handled by parent
    } finally {
      setCompleting(false);
    }
  };

  return (
    <>
      {/* Overlay cho mobile */}
      {isOpen && <div className="learning-sidebar-overlay" onClick={onClose}></div>}

      <aside className={`learning-sidebar ${isOpen ? "learning-sidebar--open" : ""}`}>
        <div className="learning-sidebar-header">
          <h3 className="learning-sidebar-title">Nội dung khóa học</h3>
          <button className="learning-sidebar-close d-lg-none" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <LearningProgress progress={progress} />

        <div className="learning-sidebar-content">
          {chapters.map((chapter, index) => (
            <LearningChapterAccordion
              key={chapter.id}
              chapter={chapter}
              currentLessonId={currentLessonId}
              onSelectLesson={onSelectLesson}
              defaultOpen={
                chapter.lessons.some((l) => l.id === currentLessonId) || index === 0
              }
            />
          ))}
        </div>

        {/* Certificate section - shown at bottom when course is completed */}
        {certificate && certificate.image_url && (
          <div className="learning-completion-box">
            <button
              className="certificate-view-btn"
              onClick={() => window.open(certificate.image_url, "_blank")}
            >
              Xem chứng chỉ
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

export default LearningSidebar;
