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

        {/* Course completion box */}
        <div className="learning-completion-box">
          <div className="completion-title">Tiến độ khóa học</div>
          <div className="completion-percent">{Math.round(progressPercent)}%</div>

          {progressPercent >= 100 && !courseCompleted && (
            <button
              className="complete-course-btn"
              onClick={handleCompleteCourse}
              disabled={completing}
            >
              {completing ? "Đang hoàn tất..." : "Hoàn thành khóa học"}
            </button>
          )}

          {courseCompleted && progressPercent >= 100 && (
            <div className="course-completed-badge">
              <i className="bi bi-check-circle-fill"></i> Đã hoàn thành khóa học
            </div>
          )}

          {certificate && (
            <div className="certificate-info">
              <div className="certificate-code">
                <i className="bi bi-award-fill"></i> {certificate.certificate_code}
              </div>
              <div className="certificate-date">
                Cấp ngày: {new Date(certificate.issued_at).toLocaleDateString("vi-VN")}
              </div>
              {certificate.image_url && (
                <button
                  className="certificate-view-btn"
                  onClick={() => window.open(certificate.image_url, "_blank")}
                >
                  <i className="bi bi-image"></i> Xem chứng chỉ
                </button>
              )}
              <Link to="/my-certificates" className="certificates-link">
                <i className="bi bi-box-arrow-up-right"></i> Xem tất cả chứng chỉ
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default LearningSidebar;
