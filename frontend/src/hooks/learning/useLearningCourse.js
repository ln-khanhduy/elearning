import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getLearningCurriculumApi, markLessonCompleteApi, submitQuizApi, completeCourseApi } from "../../api/learningAPI";

/**
 * Hook quản lý dữ liệu learning page.
 * - Lấy curriculum (chapters, lessons, quizzes)
 * - Quản lý bài học hiện tại
 * - Đánh dấu hoàn thành
 * - Nộp quiz
 * - Hỗ trợ lessonId từ URL để deep-link đến bài học cụ thể
 */
export function useLearningCourse(courseId, lessonId) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [progress, setProgress] = useState(null);
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [certificate, setCertificate] = useState(null);

  const fetchCurriculum = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getLearningCurriculumApi(courseId);
      if (res?.success && res?.data) {
        // Chuẩn hóa: đảm bảo mọi lesson có đủ 3 field completed
        const normalizeLesson = (lesson) => ({
          ...lesson,
          completed:
            lesson.completed === true ||
            lesson.is_completed === true ||
            lesson.isCompleted === true,
          is_completed:
            lesson.completed === true ||
            lesson.is_completed === true ||
            lesson.isCompleted === true,
          isCompleted:
            lesson.completed === true ||
            lesson.is_completed === true ||
            lesson.isCompleted === true,
        });

        const normalizedData = {
          ...res.data,
          chapters: (res.data.chapters || []).map((ch) => ({
            ...ch,
            lessons: (ch.lessons || []).map(normalizeLesson),
          })),
        };

        setData(normalizedData);
        setProgress(res.data.progress);
        setCourseCompleted(res.data.course_completed === true);
        setCertificate(res.data.certificate || null);

        // Kiểm tra xem user có enrolled không (dựa vào enrollment_id)
        const isEnrolled = res.data.enrollment_id != null;

        // Lấy tất cả bài học
        const allLessons = [];
        for (const ch of normalizedData.chapters || []) {
          for (const l of ch.lessons || []) {
            allLessons.push(l);
          }
        }

        // Ưu tiên lessonId từ URL (deep-link)
        if (lessonId) {
          const targetLesson = allLessons.find((l) => Number(l.id) === Number(lessonId));
          if (targetLesson) {
            setCurrentLessonId(targetLesson.id);
            return;
          }
        }

        // Tự động chọn bài học đầu tiên chưa hoàn thành
        const firstIncomplete = allLessons.find((l) => {
          const completed = l.is_completed === true || l.completed === true || l.isCompleted === true;
          return !completed;
        });
        if (firstIncomplete) {
          setCurrentLessonId(firstIncomplete.id);
        } else if (allLessons.length > 0) {
          setCurrentLessonId(allLessons[0].id);
        }
      } else {
        setError("Không thể tải nội dung khóa học.");
      }
    } catch (err) {
      setError(err.message || "Không thể tải nội dung khóa học.");
    } finally {
      setLoading(false);
    }
  }, [courseId, lessonId]);

  useEffect(() => {
    fetchCurriculum();
  }, [fetchCurriculum]);

  // ===== DERIVED VALUES từ data state =====

  /** Lấy tất cả bài học dạng flat */
  const allLessons = useMemo(() => {
    if (!data?.chapters) return [];
    const all = [];
    for (const ch of data.chapters) {
      for (const l of ch.lessons || []) {
        all.push(l);
      }
    }
    return all;
  }, [data]);

  /** Bài học hiện tại */
  const currentLesson = useMemo(() => {
    if (!currentLessonId) return null;
    return allLessons.find((l) => Number(l.id) === Number(currentLessonId)) || null;
  }, [currentLessonId, allLessons]);

  /** Chapter chứa bài học hiện tại */
  const currentChapter = useMemo(() => {
    if (!currentLessonId || !data?.chapters) return null;
    for (const ch of data.chapters) {
      for (const l of ch.lessons || []) {
        if (Number(l.id) === Number(currentLessonId)) return ch;
      }
    }
    return null;
  }, [currentLessonId, data]);

  /** Bài trước */
  const prevLesson = useMemo(() => {
    const idx = allLessons.findIndex((l) => Number(l.id) === Number(currentLessonId));
    if (idx > 0) return allLessons[idx - 1];
    return null;
  }, [currentLessonId, allLessons]);

  /** Bài tiếp theo */
  const nextLesson = useMemo(() => {
    const idx = allLessons.findIndex((l) => Number(l.id) === Number(currentLessonId));
    if (idx >= 0 && idx < allLessons.length - 1) return allLessons[idx + 1];
    return null;
  }, [currentLessonId, allLessons]);

  // ===== ACTIONS =====

  /** Đánh dấu hoàn thành bài học */
  const handleMarkComplete = useCallback(async () => {
    if (!currentLessonId || !courseId) {
      return false;
    }
    try {
      const res = await markLessonCompleteApi(courseId, currentLessonId);

      if (res?.success) {
        // Cập nhật trạng thái completed trong data — dùng functional updater
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            chapters: prev.chapters.map((ch) => ({
              ...ch,
              lessons: ch.lessons.map((l) =>
                Number(l.id) === Number(currentLessonId)
                  ? { ...l, is_completed: true, completed: true, isCompleted: true }
                  : l
              ),
            })),
          };
        });
        
        // Cập nhật progress từ API response
        if (res?.data) {
          setProgress({
            completed_lessons_count: res.data.completed_lessons_count ?? 0,
            total_lessons_count: res.data.total_lessons_count ?? 0,
            progress_percent: res.data.progress_percent ?? 0,
            last_completed_lesson_id: res.data.lesson_id ?? null,
          });
        }
        
        return true;
      }
      return false;
    } catch (err) {
      throw err;
    }
  }, [currentLessonId, courseId]);

  /** Nộp bài quiz */
  const handleSubmitQuiz = useCallback(
    async (quizId, answers) => {
      if (!courseId) return null;
      try {
        const res = await submitQuizApi(courseId, quizId, answers);
        if (res?.success && res?.data) {
          return res.data;
        }
        return null;
      } catch (err) {
        throw err;
      }
    },
    [courseId]
  );

  /** Hoàn thành khóa học và cấp chứng chỉ */
  const handleCompleteCourse = useCallback(async () => {
    if (!courseId) return null;
    try {
      const res = await completeCourseApi(courseId);
      if (res?.success && res?.data) {
        setCourseCompleted(true);
        setCertificate(res.data.certificate || null);
        // Refetch curriculum để cập nhật UI (sidebar, progress, certificate)
        fetchCurriculum();
        return res.data;
      }
      return null;
    } catch (err) {
      throw err;
    }
  }, [courseId, fetchCurriculum]);

  /** Chuyển đến bài học và cập nhật URL */
  const goToLesson = useCallback((lessonId) => {
    setCurrentLessonId(lessonId);
    navigate(`/courses/${courseId}/learn/${lessonId}`, { replace: true });
  }, [courseId, navigate]);

  /** Chuyển đến bài trước */
  const goToPrev = useCallback(() => {
    if (prevLesson) {
      setCurrentLessonId(prevLesson.id);
      navigate(`/courses/${courseId}/learn/${prevLesson.id}`, { replace: true });
    }
  }, [prevLesson, courseId, navigate]);

  /** Chuyển đến bài tiếp theo */
  const goToNext = useCallback(() => {
    if (nextLesson) {
      setCurrentLessonId(nextLesson.id);
      navigate(`/courses/${courseId}/learn/${nextLesson.id}`, { replace: true });
    }
  }, [nextLesson, courseId, navigate]);

  return {
    data,
    loading,
    error,
    refetch: fetchCurriculum,
    currentLessonId,
    currentLesson,
    currentChapter,
    prevLesson,
    nextLesson,
    progress,
    courseCompleted,
    certificate,
    goToLesson,
    goToPrev,
    goToNext,
    handleMarkComplete,
    handleSubmitQuiz,
    handleCompleteCourse,
  };
}
