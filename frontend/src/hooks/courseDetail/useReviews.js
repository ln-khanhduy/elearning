import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import {
  getCourseReviewsApi,
  getCourseReviewStatsApi,
  createReviewApi,
  updateReviewApi,
  deleteReviewApi,
} from "../../api/reviewAPI";
import { useUser } from "../../context/UserContext";

/**
 * Hook quản lý đánh giá khóa học.
 * Hỗ trợ: lấy danh sách, thống kê, tạo, sửa, xóa review.
 */
export function useReviews(courseId) {
  const { user, isAuthenticated } = useUser();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const res = await getCourseReviewsApi(courseId);
      const data = res?.data ?? res ?? [];
      setReviews(Array.isArray(data) ? data : []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const fetchStats = useCallback(async () => {
    if (!courseId) return;
    try {
      const res = await getCourseReviewStatsApi(courseId);
      const data = res?.data ?? res;
      if (data) setStats(data);
    } catch {}
  }, [courseId]);

  // Tạo review mới
  const handleCreateReview = useCallback(
    async (rating, content) => {
      if (!isAuthenticated) {
        toast.info("Vui lòng đăng nhập để đánh giá.");
        return false;
      }
      try {
        const res = await createReviewApi({
          course_id: Number(courseId),
          rating,
          content,
        });
        const newReview = res?.data ?? res;
        if (newReview && newReview.id) {
          setReviews((prev) => [newReview, ...prev]);
          toast.success("Đánh giá thành công!");
          fetchStats();
          return true;
        }
      } catch (err) {
        toast.error(err.message || "Không thể tạo đánh giá.");
      }
      return false;
    },
    [courseId, isAuthenticated, fetchStats]
  );

  // Tạo reply
  const handleCreateReply = useCallback(
    async (parentId, content) => {
      if (!isAuthenticated) {
        toast.info("Vui lòng đăng nhập để trả lời.");
        return false;
      }
      try {
        const res = await createReviewApi({
          course_id: Number(courseId),
          parent: parentId,
          content,
        });
        const newReply = res?.data ?? res;
        if (newReply && newReply.id) {
          setReviews((prev) =>
            prev.map((r) =>
              r.id === parentId
                ? {
                    ...r,
                    replies: [...(r.replies || []), newReply],
                  }
                : r
            )
          );
          toast.success("Đã trả lời!");
          return true;
        }
      } catch (err) {
        toast.error(err.message || "Không thể trả lời.");
      }
      return false;
    },
    [courseId, isAuthenticated]
  );

  // Sửa review
  const handleUpdateReview = useCallback(
    async (reviewId, rating, content) => {
      try {
        const res = await updateReviewApi(reviewId, { rating, content });
        const updated = res?.data ?? res;
        if (updated && updated.id) {
          setReviews((prev) =>
            prev.map((r) => (r.id === reviewId ? { ...r, ...updated } : r))
          );
          toast.success("Đã cập nhật đánh giá.");
          return true;
        }
      } catch (err) {
        toast.error(err.message || "Không thể cập nhật.");
      }
      return false;
    },
    []
  );

  // Xóa review
  const handleDeleteReview = useCallback(async (reviewId) => {
    try {
      await deleteReviewApi(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      toast.success("Đã xóa đánh giá.");
      fetchStats();
      return true;
    } catch (err) {
      toast.error(err.message || "Không thể xóa.");
      return false;
    }
  }, [fetchStats]);

  // Kiểm tra user đã review chưa
  const userReview = Array.isArray(reviews)
    ? reviews.find((r) => r.user === user?.id && !r.parent)
    : null;

  return {
    reviews,
    stats,
    loading,
    userReview,
    fetchReviews,
    fetchStats,
    handleCreateReview,
    handleCreateReply,
    handleUpdateReview,
    handleDeleteReview,
  };
}

export default useReviews;