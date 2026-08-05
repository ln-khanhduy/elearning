import { useState, useEffect, useCallback } from "react";
import { checkEnrolledApi } from "../../api/enrollmentAPI";

/**
 * Hook quản lý trạng thái học tập của user đối với khóa học
 * Bao gồm: kiểm tra đã đăng ký chưa, tiến độ học tập
 *
 * Backend CheckEnrolledAPIView trả về:
 *   { is_enrolled: bool, is_owner: bool, can_access: bool, enrollment: object|null }
 */
export function useCourseProgress(courseId) {
  const [enrollment, setEnrollment] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [canAccess, setCanAccess] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [loading, setLoading] = useState(false);

  const checkEnrollment = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const res = await checkEnrolledApi(courseId);
      // Backend trả về { success: true, data: { is_enrolled, is_owner, can_access, enrollment } }
      // hoặc trực tiếp { is_enrolled, is_owner, can_access, enrollment } nếu đã unwrap
      const responseData = res?.data ?? res;
      const isEnrolledFlag = responseData?.is_enrolled === true;
      const isOwnerFlag = responseData?.is_owner === true;
      const canAccessFlag = responseData?.can_access === true;
      const enrollmentData = responseData?.enrollment || null;

      // Chỉ coi là enrolled nếu enrollment có status ACTIVE hoặc COMPLETED
      const validStatuses = ["ACTIVE", "COMPLETED"];
      const hasValidStatus =
        enrollmentData &&
        validStatuses.includes(enrollmentData.status);

      if (canAccessFlag && enrollmentData && hasValidStatus) {
        setEnrollment(enrollmentData);
        setIsEnrolled(true);
        setIsOwner(isOwnerFlag);
        setCanAccess(true);
        setProgressPercent(Math.round(enrollmentData.progress_percent || 0));
      } else if (isOwnerFlag) {
        // Instructor owner: được quyền truy cập như learner đã enroll
        setEnrollment(enrollmentData || null);
        setIsEnrolled(true);  // Coi như đã enroll để UI hiển thị đúng
        setIsOwner(true);
        setCanAccess(true);
        setProgressPercent(0);
      } else {
        setEnrollment(null);
        setIsEnrolled(false);
        setIsOwner(false);
        setCanAccess(false);
        setProgressPercent(0);
      }

    } catch {
      // User chưa đăng nhập hoặc chưa đăng ký -> không enrolled
      setEnrollment(null);
      setIsEnrolled(false);
      setIsOwner(false);
      setCanAccess(false);
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
    isOwner,
    canAccess,
    progressPercent,
    loading: loading,
    refetch: checkEnrollment,
    getCompletedLessonsCount,
    getTotalLessonsCount,
  };
}
