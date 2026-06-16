/**
 * Thanh tìm kiếm khóa học
 * Form với input và button tìm kiếm
 */
function CourseSearchBar({ defaultValue, onSearch }) {
  return (
    <form className="course-search-bar" onSubmit={onSearch}>
      <div className="course-search-input-wrapper">
        <i className="bi bi-search course-search-icon"></i>
        <input
          type="text"
          name="search"
          defaultValue={defaultValue}
          placeholder="Tìm kiếm khóa học..."
          className="course-search-input"
        />
      </div>
      <button type="submit" className="course-search-btn">
        Tìm kiếm
      </button>
    </form>
  );
}

export default CourseSearchBar;
