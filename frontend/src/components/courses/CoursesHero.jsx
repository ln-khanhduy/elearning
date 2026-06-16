import CourseSearchBar from "./CourseSearchBar";

/**
 * Hero section cho trang danh sách khóa học
 * Hiển thị tiêu đề, mô tả và thanh tìm kiếm
 */
function CoursesHero({ searchQuery, onSearch }) {
  return (
    <section className="courses-hero">
      <div className="container">
        <div className="courses-hero-content">
          <h1 className="courses-hero-title">Khám phá khóa học</h1>
          <p className="courses-hero-subtitle">
            Học tập không giới hạn, kiến tạo tương lai cùng hàng ngàn khóa học
            chất lượng
          </p>
          <CourseSearchBar defaultValue={searchQuery} onSearch={onSearch} />
        </div>
      </div>
    </section>
  );
}

export default CoursesHero;
