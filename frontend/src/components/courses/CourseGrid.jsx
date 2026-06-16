import CourseCard from "./CourseCard";

/**
 * Grid hiển thị danh sách khóa học
 * Hiển thị section title và số lượng khóa học tìm thấy
 */
function CourseGrid({ courses, total, displayedCount }) {
  return (
    <div className="course-grid-wrapper">
      <div className="course-grid-header">
        <h2 className="course-grid-title">Tất cả khóa học</h2>
        <p className="course-grid-count">
          Tìm thấy <strong>{total}</strong> khóa học
        </p>
      </div>
      <div className="course-grid">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}

export default CourseGrid;
