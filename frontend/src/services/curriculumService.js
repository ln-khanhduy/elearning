import {getChaptersApi,createChapterApi,updateChapterApi,deleteChapterApi,reorderChaptersApi,} from "../api/chapterAPI";
import {getLessonsApi,getLessonDetailApi,createLessonApi,updateLessonApi,deleteLessonApi,reorderLessonsApi,} from "../api/lessonAPI";
import {getQuizzesApi,getQuizDetailApi,createQuizApi,updateQuizApi,deleteQuizApi,} from "../api/quizAPI";
import {getQuestionsApi, createQuestionApi, updateQuestionApi, deleteQuestionApi, importPreviewApi, importExecuteApi, importTemplateApi,} from "../api/questionAPI";

import { getCurriculumApi } from "../api/courseAPI";

// ==================== CURRICULUM (full tree) ====================

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

// ==================== QUESTION IMPORT ====================

export const importPreview = async (quizId, file) => {
  return await importPreviewApi(quizId, file);
};

export const importExecute = async (quizId, rows) => {
  return await importExecuteApi(quizId, rows);
};

export const importTemplate = async (format = "csv") => {
  return await importTemplateApi(format);
};


