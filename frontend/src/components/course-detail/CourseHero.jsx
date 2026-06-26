import React from "react";
import { formatPrice } from "../../utils/formatPrice";
import "../../style/course-detail/course-hero.css";
import CourseRating from "./CourseRating";
import CourseInstructor from "./CourseInstructor";
import CourseHeroMedia from "./CourseHeroMedia";

/**
 * CourseHero - Hero section hiển thị thông tin tổng quan khóa học
 * Gồm: breadcrumb, tiêu đề, mô tả, đánh giá, giảng viên, giá, ảnh bìa/video
 */
function CourseHero({ course }) {
  if (!course) return null;

  // Giải nén dữ liệu khóa học
  const { title, description, thumbnail_url, preview_video_url, assigned_instructor_name, assigned_instructor_avatar,
    average_rating, review_count, student_count, price, category_name } = course;

  return (
    <section className="course-hero">
      <div className="course-hero-bg"></div>
      <div className="course-hero-container">
        <div className="course-hero-content">
          {/* Breadcrumb: đường dẫn đến khóa học */}
          <div className="course-hero-breadcrumb">
            <a href="/courses">Khóa học</a>
            <i className="bi bi-chevron-right"></i>
            <span>{category_name || "Đa năng"}</span>
          </div>

          {/* Hiển thị tiêu đề khóa học */}
          <h1 className="course-hero-title">{title}</h1>

          {/* Hiển thị mô tả khóa học */}
          <p className="course-hero-desc">{description}</p>

          {/* Hiển thị đánh giá sao, số lượng đánh giá và học viên */}
          <CourseRating rating={average_rating} reviewCount={review_count} studentCount={student_count} />

          {/* Hiển thị thông tin giảng viên: avatar + tên */}
          <CourseInstructor name={assigned_instructor_name} avatar={assigned_instructor_avatar} />

          {/* Hiển thị giá khóa học trên mobile */}
          <div className="course-hero-price-mobile">
            {price !== null && price !== undefined && (
              <span className="price-current">{formatPrice(price)}</span>
            )}
          </div>
        </div>

        {/* Hiển thị ảnh bìa hoặc video giới thiệu */}
        <CourseHeroMedia title={title} thumbnailUrl={thumbnail_url} previewVideoUrl={preview_video_url} />
      </div>
    </section>
  );
}

export default CourseHero;
