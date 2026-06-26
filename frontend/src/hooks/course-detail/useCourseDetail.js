import { useState, useEffect, useCallback } from "react";
import { getCourseDetailApi, getCurriculumApi } from "../../api/courseAPI";
import { getCourseReviewsApi } from "../../api/reviewAPI";

/**
 * Hook quản lý dữ liệu chi tiết khóa học
 * Bao gồm: thông tin khóa học, curriculum (chương/bài), reviews
 */
export function useCourseDetail(courseId) {
  const [course, setCourse] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCourseDetail = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      setError(null);

      const [courseData, curriculumData, reviewsData] = await Promise.all([
        getCourseDetailApi(courseId),
        getCurriculumApi(courseId).catch(() => []),
        getCourseReviewsApi(courseId).catch(() => []),
      ]);

      // Xử lý response linh hoạt (có thể wrap trong { success, data } hoặc trả thẳng)
      const courseResult = courseData?.data || courseData;
      const curriculumResult = curriculumData?.data || curriculumData || [];
      const reviewsResult = reviewsData?.data || reviewsData || [];

      setCourse(courseResult);

      // Curriculum API trả về { success, data: { chapters: [...] } }
      // Nếu là object có chapters field, lấy chapters; nếu là array thì dùng trực tiếp
      if (Array.isArray(curriculumResult)) {
        setCurriculum(curriculumResult);
      } else if (curriculumResult?.chapters && Array.isArray(curriculumResult.chapters)) {
        setCurriculum(curriculumResult.chapters);
      } else {
        setCurriculum([]);
      }
      setReviews(Array.isArray(reviewsResult) ? reviewsResult : []);
    } catch (err) {
      console.error("Lỗi tải chi tiết khóa học:", err);
      setError(err.message || "Không thể tải thông tin khóa học.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourseDetail();
  }, [loadCourseDetail]);

  return {
    course,
    curriculum,
    reviews,
    loading,
    error,
    refetch: loadCourseDetail,
  };
}
