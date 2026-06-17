import { Link } from "react-router-dom";
import CourseCard from "../courses/CourseCard";
import CourseSkeleton from "../courses/CourseSkeleton";
import CourseEmptyState from "../courses/CourseEmptyState";
import CourseErrorState from "../courses/CourseErrorState";

/**
 * Featured courses section - hiển thị danh sách khóa học nổi bật.
 * Dữ liệu từ API courses, không hard-code.
 * Hiển thị skeleton khi loading, empty state khi không có data, error state khi lỗi.
 */
function HomeFeaturedCourses({ courses, loading, error, onRetry }) {
  const featuredCourses = courses.slice(0, 8);

  return (
    <section className="home-section home-featured-section">
      <div className="home-container">
        <div className="home-section-header">
          <div className="home-section-header-left">
            <span className="home-section-tag">Khóa học mới nhất</span>
            <h2 className="home-section-title">Khóa học được yêu thích nhất</h2>
            <p className="home-section-desc">
              Được hàng nghìn học viên lựa chọn và đánh giá cao
            </p>
          </div>
          <Link to="/courses" className="home-section-link">
            Xem tất cả <i className="bi bi-chevron-right" />
          </Link>
        </div>

        {loading ? (
          <CourseSkeleton />
        ) : error ? (
          <CourseErrorState message={error} onRetry={onRetry} />
        ) : featuredCourses.length === 0 ? (
          <CourseEmptyState />
        ) : (
          <div className="home-course-grid">
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default HomeFeaturedCourses;
