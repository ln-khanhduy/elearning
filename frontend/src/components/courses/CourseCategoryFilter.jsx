/**
 * Sidebar filter danh mục khóa học - dạng checkbox grid
 * Hiển thị 2 checkbox mỗi hàng, không icon
 */

import { useState, useEffect } from "react";

function CourseCategoryFilter({
  categories,
  activeCategory,
  onCategoryClick,
  loading,
}) {
  const [selectedCategory, setSelectedCategory] = useState(activeCategory || "");

  useEffect(() => {
    setSelectedCategory(activeCategory || "");
  }, [activeCategory]);

  const handleChange = (catId) => {
    const newValue = selectedCategory === String(catId) ? "" : String(catId);
    setSelectedCategory(newValue);
    onCategoryClick(newValue);
  };

  return (
    <aside className="course-category-filter">
      <div className="course-category-header">
        <i className="bi bi-funnel"></i>
        <h3>Danh mục</h3>
      </div>
      <div className="course-category-grid">
        <label className={`cat-checkbox ${!selectedCategory ? "active" : ""}`}>
          <input
            type="checkbox"
            checked={!selectedCategory}
            onChange={() => {
              setSelectedCategory("");
              onCategoryClick("");
            }}
          />
          <span>Tất cả</span>
        </label>
        {loading ? (
          <div className="course-category-skeleton">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-line" />
            ))}
          </div>
        ) : (
          categories.map((cat) => (
            <label key={cat.id} className={`cat-checkbox ${selectedCategory === String(cat.id) ? "active" : ""}`}>
              <input
                type="checkbox"
                checked={selectedCategory === String(cat.id)}
                onChange={() => handleChange(cat.id)}
              />
              <span>{cat.name}</span>
            </label>
          ))
        )}
      </div>
    </aside>
  );
}

export default CourseCategoryFilter;