import { useState, useEffect, useCallback } from "react";
import { getCourses, getCategories } from "../../services/courseService";

/**
 * Hook quản lý dữ liệu HomePage.
 * Gọi API courses và categories, xử lý loading/error state.
 * Không hard-code dữ liệu.
 */
function useHomePage() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesData, categoriesData] = await Promise.all([
        getCourses({ status: "PUBLISHED", page_size: 12 }),
        getCategories(),
      ]);
      // API trả về { success, data: { items, total, ... } }
      const courseList =
        coursesData?.data?.items || coursesData?.items || coursesData || [];
      const categoryList =
        categoriesData?.data || categoriesData || [];
      setCourses(Array.isArray(courseList) ? courseList : []);
      setCategories(Array.isArray(categoryList) ? categoryList : []);
    } catch (err) {
      console.error("HomePage load error:", err);
      setError(err.message || "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    courses,
    categories,
    loading,
    error,
    retry: loadData,
  };
}

export default useHomePage;
