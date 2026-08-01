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

// Lấy curriculum cho trang học tập (yêu cầu đã đăng ký khóa học)
export const getLearningCurriculumApi = async (courseId) => {
  return request(() => apiClient.get(`/api/learning/courses/${courseId}/curriculum/`));
};

// Đánh dấu hoàn thành một bài học
export const markLessonCompleteApi = async (courseId, lessonId) => {
  return request(() =>
    apiClient.post(`/api/learning/courses/${courseId}/lessons/complete/`, { lesson_id: lessonId })
  );
};

// Nộp bài quiz và nhận kết quả chấm điểm
export const submitQuizApi = async (courseId, quizId, answers) => {
  return request(() =>
    apiClient.post(`/api/learning/courses/${courseId}/quizzes/submit/`, {
      quiz_id: quizId,
      answers,
    })
  );
};

// Hoàn thành khóa học và cấp chứng chỉ
export const completeCourseApi = async (courseId) => {
  return request(() => apiClient.post(`/api/learning/courses/${courseId}/complete/`));
};