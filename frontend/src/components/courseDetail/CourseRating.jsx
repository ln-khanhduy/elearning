import React from "react";

/**
 * CourseRating - Hiển thị đánh giá khóa học
 * Gồm: số sao, điểm trung bình, số lượng đánh giá, số lượng học viên
 */
function CourseRating({ rating, reviewCount, studentCount }) {
  // Tạo mảng 5 ngôi sao dựa trên điểm đánh giá
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0); // Lấy phần nguyên
    const halfStar = ((rating || 0) - fullStars) >= 0.5; // True nếu >= 0.5
    for (let i = 0; i < 5; i++) {
      if (i < fullStars)
        stars.push(<i key={i} className="bi bi-star-fill"></i>);
      else if ((i === fullStars) && halfStar)
        stars.push(<i key={i} className="bi bi-star-half"></i>);
      else
        stars.push(<i key={i} className="bi bi-star"></i>);
    }
    return stars;
  };

  return (
    <div className="course-hero-rating">
      <span className="rating-stars">{renderStars(rating)}</span>
      <span className="rating-value">{rating ? Number(rating).toFixed(1) : "0.0"}</span>
      <span className="rating-count">({reviewCount || 0} đánh giá)</span>
      <span className="rating-separator">|</span>
      <span className="student-count"><i className="bi bi-people"></i> {(studentCount || 0).toLocaleString("vi-VN")} học viên</span>
    </div>
  );
}

export default CourseRating;
