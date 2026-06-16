import { useState, useEffect, useCallback } from "react";
import { checkEnrolled } from "../../services/enrollmentService";

/**
 * Hook quản lý trạng thái học tập của user đối với khóa học
 * Bao gồm: kiểm tra đã đăng ký chưa, tiến độ học tập
 *
 * Backend CheckEnrolledAPIView trả về:
 *   { is_enrolled: bool, enrollment: object|null }
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
      // Backend trả về { is_enrolled, enrollment }
      // API wrapper trả về res.data nên data = { is_enrolled, enrollment }
      const isEnrolledFlag = data?.is_enrolled === true;
      const enrollmentData = data?.enrollment || null;

      // Chỉ coi là enrolled nếu enrollment có status ACTIVE hoặc COMPLETED
      const validStatuses = ["ACTIVE", "COMPLETED"];
      const hasValidStatus =
        enrollmentData &&
        validStatuses.includes(enrollmentData.status);

      if (isEnrolledFlag && enrollmentData && hasValidStatus) {
        setEnrollment(enrollmentData);
        setIsEnrolled(true);
        setProgressPercent(Math.round(enrollmentData.progress_percent || 0));
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
