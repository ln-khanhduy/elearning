import { useState, useEffect, useCallback } from "react";
import { checkEnrolled } from "../../services/enrollmentService";

/**
 * Hook quản lý trạng thái học tập của user đối với khóa học
 * Bao gồm: kiểm tra đã đăng ký chưa, tiến độ học tập
 */
export function useCourseProgress(courseId) {
  const [enrollment, setEnrollment] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [loading, setLoading] = useState(false);

  const checkEnrollment = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const data = await checkEnrolled(courseId);
      const result = data?.data || data;

      if (result) {
        setEnrollment(result);
        setIsEnrolled(true);
        setProgressPercent(Math.round(result.progress_percent || 0));
      } else {
        setEnrollment(null);
        setIsEnrolled(false);
        setProgressPercent(0);
      }
    } catch {
      // User chưa đăng nhập hoặc chưa đăng ký -> không enrolled
      setEnrollment(null);
      setIsEnrolled(false);
      setProgressPercent(0);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    checkEnrollment();
  }, [checkEnrollment]);

  /**
   * Tính số bài đã hoàn thành dựa vào curriculum và enrollment data
   */
  const getCompletedLessonsCount = useCallback(
    (curriculum) => {
      if (!enrollment?.completed_lessons) return 0;
      const completedIds = new Set(enrollment.completed_lessons);
      let count = 0;
      curriculum.forEach((chapter) => {
        (chapter.lessons || []).forEach((lesson) => {
          if (completedIds.has(lesson.id)) count++;
        });
      });
      return count;
    },
    [enrollment]
  );

  /**
   * Tính tổng số bài học
   */
  const getTotalLessonsCount = useCallback((curriculum) => {
    let count = 0;
    curriculum.forEach((chapter) => {
      count += (chapter.lessons || []).length;
    });
    return count;
  }, []);

  return {
    enrollment,
    isEnrolled,
    progressPercent,
    loading: loading,
    refetch: checkEnrollment,
    getCompletedLessonsCount,
    getTotalLessonsCount,
  };
}
