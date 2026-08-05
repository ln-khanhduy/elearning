import React from "react";

/**
 * CourseInstructor - Hiển thị thông tin giảng viên
 * Gồm: avatar + tên giảng viên
 */
function CourseInstructor({ name, avatar }) {
  return (
    <div className="course-hero-instructor">
      {avatar ? (
        <img src={avatar} alt={name} className="instructor-avatar" />
      ) : (
        <div className="instructor-avatar-placeholder">{(name || "G")[0].toUpperCase()}</div>
      )}
      <div className="instructor-info">
        <span className="instructor-label">Giảng viên</span>
        <span className="instructor-name">{name || "Giảng viên"}</span>
      </div>
    </div>
  );
}

export default CourseInstructor;
