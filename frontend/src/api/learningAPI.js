import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// ==================== LEARNING ====================
// BE: /api/learning/

/**
 * Lấy curriculum cho learning page (yêu cầu đã enroll).
 * GET /api/learning/courses/{courseId}/curriculum/
 */
export const getLearningCurriculumApi = async (courseId) => {
  return request(() => apiClient.get(`/api/learning/courses/${courseId}/curriculum/`));
};

/**
 * Đánh dấu hoàn thành bài học.
 * POST /api/learning/courses/{courseId}/lessons/complete/
 * Body: { lesson_id: number }
 */
export const markLessonCompleteApi = async (courseId, lessonId) => {
  return request(() =>
    apiClient.post(`/api/learning/courses/${courseId}/lessons/complete/`, { lesson_id: lessonId })
  );
};

/**
 * Nộp bài quiz.
 * POST /api/learning/courses/{courseId}/quizzes/submit/
 * Body: { quiz_id: number, answers: [{ question_id, selected_option_id }] }
 */
export const submitQuizApi = async (courseId, quizId, answers) => {
  return request(() =>
    apiClient.post(`/api/learning/courses/${courseId}/quizzes/submit/`, {
      quiz_id: quizId,
      answers,
    })
  );
};
