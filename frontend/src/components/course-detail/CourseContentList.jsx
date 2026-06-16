import React from "react";
import CourseSectionAccordion from "./CourseSectionAccordion";
import "../../style/course-detail/course-content-list.css";

/**
 * Danh sách nội dung khóa học
 * Hiển thị tổng số chương/bài và danh sách accordion các chương
 */
function CourseContentList({ curriculum, completedLessons, isEnrolled }) {
  if (!curriculum || curriculum.length === 0) {
    return (
      <div className="course-content-empty">
        <i className="bi bi-journal-text"></i>
        <p>Nội dung khóa học đang được cập nhật...</p>
      </div>
    );
  }

  const totalLessons = curriculum.reduce(
    (sum, ch) => sum + (ch.lessons || []).length,
    0
  );

  const completedIds = new Set(completedLessons || []);

  return (
    <div className="course-content-list">
      <div className="content-list-header">
        <h2>Nội dung khóa học</h2>
        <div className="content-list-stats">
          <span>
            <strong>{curriculum.length}</strong> chương
          </span>
          <span className="stats-separator">•</span>
          <span>
            <strong>{totalLessons}</strong> bài học
          </span>
        </div>
      </div>

      <div className="content-list-accordion">
        {curriculum.map((chapter, index) => (
          <CourseSectionAccordion
            key={chapter.id || index}
            chapter={chapter}
            index={index}
            completedLessons={completedIds}
            isEnrolled={isEnrolled}
          />
        ))}
      </div>
    </div>
  );
}

export default CourseContentList;
