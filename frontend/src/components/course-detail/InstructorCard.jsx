import React from "react";
import "../../style/course-detail/instructor-card.css";

/**
 * Card thông tin giảng viên
 * Hiển thị: avatar, tên, chức danh, mô tả, các chỉ số
 */
function InstructorCard({ course }) {
  if (!course) return null;

  const {
    instructor_name,
    instructor_avatar,
    instructor_title,
    instructor_bio,
    instructor_course_count,
    instructor_student_count,
    instructor_rating,
  } = course;

  return (
    <div className="instructor-card">
      <div className="instructor-card-header">
        <h3>Giảng viên</h3>
      </div>
      <div className="instructor-card-body">
        <div className="instructor-avatar-section">
          {instructor_avatar ? (
            <img
              src={instructor_avatar}
              alt={instructor_name}
              className="instructor-avatar-lg"
            />
          ) : (
            <div className="instructor-avatar-placeholder-lg">
              {(instructor_name || "G")[0].toUpperCase()}
            </div>
          )}
          <div className="instructor-detail">
            <h4 className="instructor-name">{instructor_name || "Giảng viên"}</h4>
            {instructor_title && (
              <p className="instructor-title">{instructor_title}</p>
            )}
          </div>
        </div>

        {instructor_bio && (
          <p className="instructor-bio">{instructor_bio}</p>
        )}

        <div className="instructor-stats">
          {instructor_rating && (
            <div className="instructor-stat">
              <i className="bi bi-star-fill"></i>
              <span>{Number(instructor_rating).toFixed(1)}</span>
            </div>
          )}
          {instructor_student_count && (
            <div className="instructor-stat">
              <i className="bi bi-people"></i>
              <span>{(instructor_student_count || 0).toLocaleString("vi-VN")} học viên</span>
            </div>
          )}
          {instructor_course_count && (
            <div className="instructor-stat">
              <i className="bi bi-journal"></i>
              <span>{instructor_course_count} khóa học</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InstructorCard;
