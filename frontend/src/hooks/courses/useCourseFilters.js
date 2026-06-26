import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { getCategoriesApi } from "../../api/courseAPI";

/**
 * Hook quản lý filters cho trang danh sách khóa học
 * Bao gồm: search params, categories, handlers
 */
export function useCourseFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const categoryFilter = searchParams.get("category") || "";
  const searchQuery = searchParams.get("q") || "";

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const data = await getCategoriesApi();
        setCategories(data?.data || data || []);
      } catch (err) {
        console.error("Lỗi tải danh mục:", err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    loadCategories();
  }, []);

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      const q = e.target.search.value.trim();
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (categoryFilter) params.set("category", categoryFilter);
      params.set("page", "1");
      setSearchParams(params);
    },
    [categoryFilter, setSearchParams]
  );

  const handleCategoryClick = useCallback(
    (catId) => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (catId) params.set("category", catId);
      params.set("page", "1");
      setSearchParams(params);
    },
    [searchQuery, setSearchParams]
  );

  const handlePageChange = useCallback(
    (newPage) => {
      const params = new URLSearchParams(searchParams);
      params.set("page", newPage.toString());
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  return {
    // State
    categories,
    categoriesLoading,
    // Filter values
    page,
    categoryFilter,
    searchQuery,
    // Handlers
    handleSearch,
    handleCategoryClick,
    handlePageChange,
  };
}
