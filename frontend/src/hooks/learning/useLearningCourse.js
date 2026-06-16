import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getLearningCurriculumApi, markLessonCompleteApi, submitQuizApi } from "../../api/learningAPI";

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

  const fetchCurriculum = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getLearningCurriculumApi(courseId);
      if (res?.success && res?.data) {
        setData(res.data);
        setProgress(res.data.progress);

        // Lấy tất cả bài học
        const allLessons = [];
        for (const ch of res.data.chapters || []) {
          for (const l of ch.lessons || []) {
            allLessons.push(l);
          }
        }

        // Ưu tiên lessonId từ URL (deep-link)
        if (lessonId) {
          const targetLesson = allLessons.find((l) => l.id === Number(lessonId));
          if (targetLesson) {
            setCurrentLessonId(targetLesson.id);
            return;
          }
          // Nếu lessonId không hợp lệ, fallback xuống logic mặc định
        }

        // Tự động chọn bài học đầu tiên chưa hoàn thành
        const firstIncomplete = allLessons.find((l) => !l.completed);
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

  /** Lấy thông tin bài học hiện tại */
  const currentLesson = useCallback(() => {
    if (!data?.chapters) return null;
    for (const ch of data.chapters) {
      for (const l of ch.lessons || []) {
        if (l.id === currentLessonId) return l;
      }
    }
    return null;
  }, [data, currentLessonId]);

  /** Lấy chapter chứa bài học hiện tại */
  const currentChapter = useCallback(() => {
    if (!data?.chapters) return null;
    for (const ch of data.chapters) {
      for (const l of ch.lessons || []) {
        if (l.id === currentLessonId) return ch;
      }
    }
    return null;
  }, [data, currentLessonId]);

  /** Lấy bài học trước đó */
  const prevLesson = useCallback(() => {
    if (!data?.chapters) return null;
    const allLessons = [];
    for (const ch of data.chapters) {
      for (const l of ch.lessons || []) {
        allLessons.push(l);
      }
    }
    const idx = allLessons.findIndex((l) => l.id === currentLessonId);
    if (idx > 0) return allLessons[idx - 1];
    return null;
  }, [data, currentLessonId]);

  /** Lấy bài học tiếp theo */
  const nextLesson = useCallback(() => {
    if (!data?.chapters) return null;
    const allLessons = [];
    for (const ch of data.chapters) {
      for (const l of ch.lessons || []) {
        allLessons.push(l);
      }
    }
    const idx = allLessons.findIndex((l) => l.id === currentLessonId);
    if (idx >= 0 && idx < allLessons.length - 1) return allLessons[idx + 1];
    return null;
  }, [data, currentLessonId]);

  /** Đánh dấu hoàn thành bài học */
  const handleMarkComplete = useCallback(async () => {
    if (!currentLessonId || !courseId) return;
    try {
      const res = await markLessonCompleteApi(courseId, currentLessonId);
      if (res?.success) {
        // Cập nhật trạng thái completed trong data
        setData((prev) => {
          if (!prev) return prev;
          const newChapters = prev.chapters.map((ch) => ({
            ...ch,
            lessons: ch.lessons.map((l) =>
              l.id === currentLessonId ? { ...l, completed: true } : l
            ),
          }));
          return { ...prev, chapters: newChapters };
        });
        // Cập nhật progress
        if (res?.data) {
          setProgress(res.data);
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

  /** Chuyển đến bài học và cập nhật URL */
  const goToLesson = useCallback((lessonId) => {
    setCurrentLessonId(lessonId);
    navigate(`/courses/${courseId}/learn/${lessonId}`, { replace: true });
  }, [courseId, navigate]);

  /** Chuyển đến bài trước */
  const goToPrev = useCallback(() => {
    const prev = prevLesson();
    if (prev) {
      setCurrentLessonId(prev.id);
      navigate(`/courses/${courseId}/learn/${prev.id}`, { replace: true });
    }
  }, [prevLesson, courseId, navigate]);

  /** Chuyển đến bài tiếp theo */
  const goToNext = useCallback(() => {
    const next = nextLesson();
    if (next) {
      setCurrentLessonId(next.id);
      navigate(`/courses/${courseId}/learn/${next.id}`, { replace: true });
    }
  }, [nextLesson, courseId, navigate]);


  return {
    data,
    loading,
    error,
    refetch: fetchCurriculum,
    currentLessonId,
    currentLesson: currentLesson(),
    currentChapter: currentChapter(),
    prevLesson: prevLesson(),
    nextLesson: nextLesson(),
    progress,
    goToLesson,
    goToPrev,
    goToNext,
    handleMarkComplete,
    handleSubmitQuiz,
  };
}
