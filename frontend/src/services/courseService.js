import {getCoursesApi,getCourseDetailApi,createCourseApi,updateCourseApi,deleteCourseApi,submitCourseReviewApi,getPendingCoursesApi,
  approveCourseApi,rejectCourseApi,publishCourseApi,hideCourseApi,unhideCourseApi,getCurriculumApi,getCategoriesApi,
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

// ==================== CATEGORIES ====================

export const getCategories = async () => {
  return await getCategoriesApi();
};
