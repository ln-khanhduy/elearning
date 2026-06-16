/**
 * Skeleton loading cho danh sách khóa học
 * Hiển thị 6 card skeleton trong khi loading
 */
function CourseSkeleton() {
  return (
    <div className="course-grid">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="course-card course-card-skeleton">
          <div className="course-card-image skeleton-pulse">
            <div className="skeleton-block" style={{ height: "100%" }} />
          </div>
          <div className="course-card-body">
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-line skeleton-text" />
            <div className="skeleton-line skeleton-text short" />
            <div className="skeleton-line skeleton-meta" />
            <div className="skeleton-line skeleton-price" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default CourseSkeleton;
