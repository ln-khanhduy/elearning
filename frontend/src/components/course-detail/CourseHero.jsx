import React from "react";
import "../../style/course-detail/course-hero.css";

/**
 * Hero section hiển thị thông tin tổng quan khóa học
 * Gồm: thumbnail, tiêu đề, mô tả, instructor, rating, học viên, cấp độ, thời lượng
 */
function CourseHero({ course }) {
  if (!course) return null;

  const {
    title,
    description,
    thumbnail_url,
    instructor_name,
    instructor_avatar,
    average_rating,
    review_count,
    student_count,
    level,
    duration,
    category_name,
    price,
    original_price,
  } = course;

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalf = (rating || 0) - fullStars >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<i key={i} className="bi bi-star-fill"></i>);
      } else if (i === fullStars && hasHalf) {
        stars.push(<i key={i} className="bi bi-star-half"></i>);
      } else {
        stars.push(<i key={i} className="bi bi-star"></i>);
      }
    }
    return stars;
  };

  const levelLabels = {
    BEGINNER: "Cơ bản",
    INTERMEDIATE: "Trung cấp",
    ADVANCED: "Nâng cao",
    ALL: "Tất cả trình độ",
  };

  const formatPrice = (val) => {
    if (!val && val !== 0) return null;
    return Number(val).toLocaleString("vi-VN") + "₫";
  };

  const hasDiscount = original_price && Number(original_price) > Number(price);
  const discountPercent = hasDiscount
    ? Math.round(
        ((Number(original_price) - Number(price)) / Number(original_price)) * 100
      )
    : 0;

  return (
    <section className="course-hero">
      <div className="course-hero-bg"></div>
      <div className="course-hero-container">
        <div className="course-hero-content">
          {/* Breadcrumb */}
          <div className="course-hero-breadcrumb">
            <a href="/courses">Khóa học</a>
            <i className="bi bi-chevron-right"></i>
            <span>{category_name || "Đa năng"}</span>
          </div>

          {/* Title */}
          <h1 className="course-hero-title">{title}</h1>

          {/* Description */}
          <p className="course-hero-desc">{description}</p>

          {/* Rating */}
          <div className="course-hero-rating">
            <span className="rating-stars">{renderStars(average_rating)}</span>
            <span className="rating-value">
              {average_rating ? Number(average_rating).toFixed(1) : "0.0"}
            </span>
            <span className="rating-count">
              ({review_count || 0} đánh giá)
            </span>
            <span className="rating-separator">|</span>
            <span className="student-count">
              <i className="bi bi-people"></i>{" "}
              {(student_count || 0).toLocaleString("vi-VN")} học viên
            </span>
          </div>

          {/* Meta info */}
          <div className="course-hero-meta">
            {level && (
              <span className="meta-item">
                <i className="bi bi-bar-chart"></i>
                {levelLabels[level] || level}
              </span>
            )}
            {duration && (
              <span className="meta-item">
                <i className="bi bi-clock"></i>
                {duration}
              </span>
            )}
            {category_name && (
              <span className="meta-item">
                <i className="bi bi-tag"></i>
                {category_name}
              </span>
            )}
          </div>

          {/* Instructor */}
          <div className="course-hero-instructor">
            {instructor_avatar ? (
              <img
                src={instructor_avatar}
                alt={instructor_name}
                className="instructor-avatar"
              />
            ) : (
              <div className="instructor-avatar-placeholder">
                {(instructor_name || "G")[0].toUpperCase()}
              </div>
            )}
            <div className="instructor-info">
              <span className="instructor-label">Giảng viên</span>
              <span className="instructor-name">{instructor_name || "Giảng viên"}</span>
            </div>
          </div>

          {/* Price (mobile) */}
          <div className="course-hero-price-mobile">
            {price !== null && price !== undefined && (
              <>
                <span className="price-current">{formatPrice(price)}</span>
                {hasDiscount && (
                  <>
                    <span className="price-original">{formatPrice(original_price)}</span>
                    <span className="price-badge">-{discountPercent}%</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Thumbnail - bọc trong mockup card đẹp */}
        <div className="course-hero-thumbnail">
          <div className="course-hero-thumb-mockup">
            {thumbnail_url ? (
              <img
                src={thumbnail_url}
                alt={title}
                className="course-hero-thumb-img"
              />
            ) : (
              <div className="course-hero-thumb-placeholder">
                <i className="bi bi-play-circle"></i>
                <span>Xem preview</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default CourseHero;
