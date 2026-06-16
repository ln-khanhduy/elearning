import { useState, useEffect, useCallback } from "react";
import { getCourses } from "../../services/courseService";

/**
 * Hook quản lý danh sách khóa học public
 * Xử lý: loading, error, pagination, search, category filter
 */
export function usePublicCourses({ page, categoryFilter, searchQuery }) {
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { status: "PUBLISHED", page, page_size: 12 };
      if (categoryFilter) params.category = categoryFilter;
      if (searchQuery) params.q = searchQuery;

      const data = await getCourses(params);
      const result = data?.data || data;
      const rawItems = result?.items || [];

      // Chuẩn hóa dữ liệu: map category object -> category_name flat
      const normalized = rawItems.map((item) => ({
        ...item,
        category_name: item.category?.name || item.category_name || null,
        instructor_avatar: item.instructor_avatar || null,
      }));

      setCourses(normalized);
      setTotal(result?.total || 0);
      setTotalPages(result?.total_pages || 0);
    } catch (err) {
      console.error("Lỗi tải khóa học:", err);
      setError(err.message || "Không thể tải danh sách khóa học.");
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter, searchQuery]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  return { courses, total, totalPages, loading, error, refetch: loadCourses };
}
