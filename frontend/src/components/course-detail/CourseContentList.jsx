import React, {useMemo} from "react";
import CourseSectionAccordion from "./CourseSectionAccordion";
import "../../style/course-detail/course-content-list.css";

/**
 * CourseContentList - Hiển thị danh sách nội dung(tab Nội dung) khóa học tại trang chi tiết khóa học
 * Gồm: tổng số chương/bài học + accordion từng chương
 */
function CourseContentList({ curriculum=[], completedLessons=[], isEnrolled }) {
  if (!curriculum || curriculum.length === 0) {
    return (
      <div className="course-content-empty">
        <i className="bi bi-journal-text"></i>
        <p>Nội dung khóa học đang được cập nhật...</p>
      </div>
    );
  }

  // Đếm tổng số bài học từ tất cả chương
  const totalLessons = curriculum.reduce((sum, {lessons}) => sum + (lessons?.length ?? 0), 0);
  // Chuyển mảng completedLessons thành Set để tra cứu nhanh
  const completedIds = useMemo(() => new Set(completedLessons),[completedLessons]);

  return (
    <div className="course-content-list">
      <div className="content-list-header">
        <h2>Nội dung khóa học</h2>
        <div className="content-list-stats">
          <span><strong>{curriculum.length}</strong> chương</span>
          <span className="stats-separator">•</span>
          <span><strong>{totalLessons}</strong> bài học</span>
        </div>
      </div>
      <div className="content-list-accordion">
        {curriculum.map((chapter, index) => (
          <CourseSectionAccordion key={chapter.id} chapter={chapter} index={index}
            completedLessons={completedIds} isEnrolled={isEnrolled} />
        ))}
      </div>
    </div>
  );
}

export default CourseContentList;
