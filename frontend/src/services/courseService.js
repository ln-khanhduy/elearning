import {
  getCoursesApi,
  getCourseDetailApi,
  createCourseApi,
  updateCourseApi,
  deleteCourseApi,
  submitCourseReviewApi,
  getPendingCoursesApi,
  approveCourseApi,
  rejectCourseApi,
  publishCourseApi,
  hideCourseApi,
  unhideCourseApi,
  getCurriculumApi,
  getCategoriesApi,
  getTagsApi,
} from "../api/courseAPI";

import {
  getChaptersApi,
  createChapterApi,
  updateChapterApi,
  deleteChapterApi,
  reorderChaptersApi,
} from "../api/chapterAPI";

import {
  getLessonsApi,
  getLessonDetailApi,
  createLessonApi,
  updateLessonApi,
  deleteLessonApi,
  reorderLessonsApi,
} from "../api/lessonAPI";

import {
  getQuizzesApi,
  getQuizDetailApi,
  createQuizApi,
  updateQuizApi,
  deleteQuizApi,
} from "../api/quizAPI";

import {
  getQuestionsApi,
  createQuestionApi,
  updateQuestionApi,
  deleteQuestionApi,
} from "../api/questionAPI";

// ==================== COURSES ====================

export const getCourses = async (params = {}) => {
  return await getCoursesApi(params);
};

export const getCourseDetail = async (courseId) => {
  return await getCourseDetailApi(courseId);
};

export const createCourse = async (data) => {
  return await createCourseApi(data);
};

export const updateCourse = async (courseId, data) => {
  return await updateCourseApi(courseId, data);
};

export const deleteCourse = async (courseId) => {
  return await deleteCourseApi(courseId);
};

export const submitForReview = async (courseId) => {
  return await submitCourseReviewApi(courseId);
};

export const getPendingCourses = async () => {
  return await getPendingCoursesApi();
};

export const approveCourse = async (courseId) => {
  return await approveCourseApi(courseId);
};

export const rejectCourse = async (courseId, note) => {
  return await rejectCourseApi(courseId, note);
};

export const publishCourse = async (courseId) => {
  return await publishCourseApi(courseId);
};

export const hideCourse = async (courseId) => {
  return await hideCourseApi(courseId);
};

export const unhideCourse = async (courseId) => {
  return await unhideCourseApi(courseId);
};

// ==================== CURRICULUM ====================

export const getCurriculum = async (courseId) => {
  return await getCurriculumApi(courseId);
};

// ==================== CHAPTERS ====================

export const getChapters = async (courseId) => {
  return await getChaptersApi(courseId);
};

export const createChapter = async (courseId, data) => {
  return await createChapterApi(courseId, data);
};

export const updateChapter = async (chapterId, data) => {
  return await updateChapterApi(chapterId, data);
};

export const deleteChapter = async (chapterId) => {
  return await deleteChapterApi(chapterId);
};

export const reorderChapters = async (courseId, chapters) => {
  return await reorderChaptersApi(courseId, chapters);
};

// ==================== LESSONS ====================

export const getLessons = async (chapterId) => {
  return await getLessonsApi(chapterId);
};

export const getLessonDetail = async (lessonId) => {
  return await getLessonDetailApi(lessonId);
};

export const createLesson = async (chapterId, data) => {
  return await createLessonApi(chapterId, data);
};

export const updateLesson = async (lessonId, data) => {
  return await updateLessonApi(lessonId, data);
};

export const deleteLesson = async (lessonId) => {
  return await deleteLessonApi(lessonId);
};

export const reorderLessons = async (chapterId, lessons) => {
  return await reorderLessonsApi(chapterId, lessons);
};

// ==================== QUIZZES ====================

export const getQuizzes = async (lessonId) => {
  return await getQuizzesApi(lessonId);
};

export const getQuizDetail = async (quizId) => {
  return await getQuizDetailApi(quizId);
};

export const createQuiz = async (lessonId, data) => {
  return await createQuizApi(lessonId, data);
};

export const updateQuiz = async (quizId, data) => {
  return await updateQuizApi(quizId, data);
};

export const deleteQuiz = async (quizId) => {
  return await deleteQuizApi(quizId);
};

// ==================== QUESTIONS ====================

export const getQuestions = async (quizId) => {
  return await getQuestionsApi(quizId);
};

export const createQuestion = async (quizId, data) => {
  return await createQuestionApi(quizId, data);
};

export const updateQuestion = async (questionId, data) => {
  return await updateQuestionApi(questionId, data);
};

export const deleteQuestion = async (questionId) => {
  return await deleteQuestionApi(questionId);
};

// ==================== CATEGORIES & TAGS ====================

export const getCategories = async () => {
  return await getCategoriesApi();
};

export const getTags = async () => {
  return await getTagsApi();
};
