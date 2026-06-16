/**
 * Error state khi API lỗi
 * Hiển thị thông báo lỗi và nút thử lại
 */
function CourseErrorState({ message, onRetry }) {
  return (
    <div className="course-error-state">
      <div className="course-error-icon">
        <i className="bi bi-exclamation-triangle"></i>
      </div>
      <h3 className="course-error-title">Đã có lỗi xảy ra</h3>
      <p className="course-error-desc">
        {message || "Không thể tải danh sách khóa học. Vui lòng thử lại sau."}
      </p>
      {onRetry && (
        <button className="course-error-btn" onClick={onRetry}>
          <i className="bi bi-arrow-clockwise"></i>
          Thử lại
        </button>
      )}
    </div>
  );
}

export default CourseErrorState;
