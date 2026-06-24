import { Link } from "react-router-dom";

/**
 * Card hiển thị thông tin khóa học
 * Bao gồm: thumbnail, title, instructor (avatar + tên), rating, level, category, price
 * Có fallback cho các trường thiếu dữ liệu
 */
function CourseCard({ course }) {
  const {
    id,
    title,
    thumbnail_url,
    assigned_instructor_name,
    assigned_instructor_avatar,
    category_name,
    level,
    price,
    rating,
    student_count,
    duration,
  } = course;

  const instructor_name = assigned_instructor_name;
  const instructor_avatar = assigned_instructor_avatar;

  // Format giá
  const formatPrice = (val) => {
    if (val === undefined || val === null) return null;
    const num = Number(val);
    if (num === 0) return "Miễn phí";
    return `${num.toLocaleString("vi-VN")}₫`;
  };

  // Format đánh giá
  const displayRating = rating ? Number(rating).toFixed(1) : null;

  // Level badge color
  const levelLabel = level
    ? { BEGINNER: "Cơ bản", INTERMEDIATE: "Trung cấp", ADVANCED: "Nâng cao" }[
        level
      ] || level
    : null;

  // Get first letter for avatar fallback
  const avatarLetter = (instructor_name || "G")[0].toUpperCase();

  return (
    <div className="course-card">
      {/* Thumbnail */}
      <Link to={`/courses/${id}`} className="course-card-image-link">
        <div className="course-card-image">
          {thumbnail_url ? (
            <img
              src={thumbnail_url}
              alt={title}
              loading="lazy"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className="course-card-placeholder"
            style={{ display: thumbnail_url ? "none" : "flex" }}
          >
            <i className="bi bi-book"></i>
            <span>{category_name || "Khóa học"}</span>
          </div>
          {category_name && (
            <span className="course-card-badge">{category_name}</span>
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="course-card-body">
        <Link to={`/courses/${id}`} className="course-card-title-link">
          <h3 className="course-card-title">{title}</h3>
        </Link>

        {/* Instructor with avatar */}
        <div className="course-card-instructor">
          {instructor_avatar ? (
            <img
              src={instructor_avatar}
              alt={instructor_name}
              className="course-card-instructor-avatar"
            />
          ) : (
            <span className="course-card-instructor-avatar-fallback">
              {avatarLetter}
            </span>
          )}
          <span className="course-card-instructor-name">
            {instructor_name || "Giảng viên"}
          </span>
        </div>

        {/* Rating & Students */}
        <div className="course-card-meta">
          {displayRating && (
            <span className="course-card-rating">
              <i className="bi bi-star-fill"></i>
              <span>{displayRating}</span>
            </span>
          )}
          {student_count > 0 && (
            <span className="course-card-students">
              <i className="bi bi-people"></i>
              <span>{student_count}</span>
            </span>
          )}
          {duration && (
            <span className="course-card-duration">
              <i className="bi bi-clock"></i>
              <span>{duration}h</span>
            </span>
          )}
        </div>

        {/* Level */}
        {levelLabel && (
          <span className="course-card-level">{levelLabel}</span>
        )}

        {/* Footer */}
        <div className="course-card-footer">
          <span
            className={`course-card-price ${
              Number(price) === 0 ? "free" : ""
            }`}
          >
            {formatPrice(price) || "Liên hệ"}
          </span>
          <Link to={`/courses/${id}`} className="course-card-btn">
            Xem chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CourseCard;
