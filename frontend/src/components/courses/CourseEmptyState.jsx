/**
 * Empty state khi không có khóa học nào
 * Hiển thị icon, thông báo và gợi ý
 */
function CourseEmptyState({ hasFilters }) {
  return (
    <div className="course-empty-state">
      <div className="course-empty-icon">
        <i className="bi bi-journal-bookmark"></i>
      </div>
      <h3 className="course-empty-title">Không tìm thấy khóa học</h3>
      <p className="course-empty-desc">
        {hasFilters
          ? "Không có khóa học nào phù hợp với bộ lọc hiện tại. Thử thay đổi danh mục hoặc từ khóa tìm kiếm."
          : "Hiện tại chưa có khóa học nào. Vui lòng quay lại sau."}
      </p>
    </div>
  );
}

export default CourseEmptyState;
