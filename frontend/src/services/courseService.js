import {
  getCoursesApi,
  getCourseDetailApi,
  createCourseApi,
  createFullCourseApi,
  updateCourseApi,
  deleteCourseApi,
  submitCourseReviewApi,
  getPendingCoursesApi,
  approveCourseApi,
  rejectCourseApi,
  publishCourseApi,
  hideCourseApi,
  unhideCourseApi,
  getSectionsApi,
  createSectionApi,
  updateSectionApi,
  deleteSectionApi,
  reorderSectionsApi,
  getLessonsApi,
  getLessonDetailApi,
  createLessonApi,
  updateLessonApi,
  deleteLessonApi,
  reorderLessonsApi,
  getCategoriesApi,
  getTagsApi,
} from "../api/courseAPI";

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

export const createFullCourse = async (data) => {
  return await createFullCourseApi(data);
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

// ==================== SECTIONS ====================

export const getSections = async (courseId) => {
  return await getSectionsApi(courseId);
};

export const createSection = async (courseId, data) => {
  return await createSectionApi(courseId, data);
};

export const updateSection = async (sectionId, data) => {
  return await updateSectionApi(sectionId, data);
};

export const deleteSection = async (sectionId) => {
  return await deleteSectionApi(sectionId);
};

export const reorderSections = async (courseId, sections) => {
  return await reorderSectionsApi(courseId, sections);
};

// ==================== LESSONS ====================

export const getLessons = async (sectionId) => {
  return await getLessonsApi(sectionId);
};

export const getLessonDetail = async (lessonId) => {
  return await getLessonDetailApi(lessonId);
};

export const createLesson = async (sectionId, data) => {
  return await createLessonApi(sectionId, data);
};

export const updateLesson = async (lessonId, data) => {
  return await updateLessonApi(lessonId, data);
};

export const deleteLesson = async (lessonId) => {
  return await deleteLessonApi(lessonId);
};

export const reorderLessons = async (sectionId, lessons) => {
  return await reorderLessonsApi(sectionId, lessons);
};

// ==================== CATEGORIES & TAGS ====================

export const getCategories = async () => {
  return await getCategoriesApi();
};

export const getTags = async () => {
  return await getTagsApi();
};
