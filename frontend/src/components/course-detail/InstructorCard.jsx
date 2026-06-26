import React from "react";
import "../../style/course-detail/instructor-card.css";

/**
 * InstructorCard - Card thông tin giảng viên (tab Giảng viên)
 * Hiển thị: avatar, tên, mô tả
 */
function InstructorCard({ course }) {
  if (!course) return null;

  const { assigned_instructor_name, assigned_instructor_avatar, assigned_instructor_bio } = course;

  return (
    <div className="instructor-card">
      <div className="instructor-card-header"><h3>Giảng viên</h3></div>
      <div className="instructor-card-body">
        {/* Avatar + tên  */}
        <div className="instructor-avatar-section">
          {assigned_instructor_avatar
            ? <img src={assigned_instructor_avatar} alt={assigned_instructor_name} className="instructor-avatar-lg" />
            : <div className="instructor-avatar-placeholder-lg">{(assigned_instructor_name || "G")[0].toUpperCase()}</div>}
          <div className="instructor-detail">
            <h4 className="instructor-name">{assigned_instructor_name || "Giảng viên"}</h4>
          </div>
        </div>
        {/* Mô tả giảng viên */}
        {assigned_instructor_bio && <p className="instructor-bio">{assigned_instructor_bio}</p>}
      </div>
    </div>
  );
}

export default InstructorCard;
