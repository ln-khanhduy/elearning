/**
 * Sidebar filter danh mục khóa học
 * Hiển thị danh sách categories để lọc
 */
function CourseCategoryFilter({
  categories,
  activeCategory,
  onCategoryClick,
  loading,
}) {
  return (
    <aside className="course-category-filter">
      <div className="course-category-header">
        <i className="bi bi-funnel"></i>
        <h3>Danh mục</h3>
      </div>
      <ul className="course-category-list">
        <li>
          <button
            className={`course-category-item ${
              !activeCategory ? "active" : ""
            }`}
            onClick={() => onCategoryClick("")}
          >
            <i className="bi bi-grid-3x3-gap"></i>
            <span>Tất cả khóa học</span>
          </button>
        </li>
        {loading ? (
          <li className="course-category-skeleton">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton-line" />
            ))}
          </li>
        ) : (
          categories.map((cat) => (
            <li key={cat.id}>
              <button
                className={`course-category-item ${
                  activeCategory === String(cat.id) ? "active" : ""
                }`}
                onClick={() => onCategoryClick(cat.id)}
              >
                <i className="bi bi-bookmark"></i>
                <span>{cat.name}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}

export default CourseCategoryFilter;
