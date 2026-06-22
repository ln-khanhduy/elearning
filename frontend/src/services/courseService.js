import {
  getCoursesApi,
  getCourseDetailApi,
  getAdminCoursesApi,
  getAdminCourseDetailApi,
  createAdminCourseApi,
  updateAdminCourseApi,
  deleteAdminCourseApi,
  publishAdminCourseApi,
  hideAdminCourseApi,
  assignInstructorApi,
  getAssignedInstructorApi,
  getInstructorCoursesApi,
  getInstructorCourseDetailApi,
  getInstructorCourseStudentsApi,
  getInstructorCourseAnalyticsApi,
  getCurriculumApi,
  getCategoriesApi,
} from "../api/courseAPI";

// ==================== PUBLIC COURSES ====================

export const getCourses = async (params = {}) => {
  return await getCoursesApi(params);
};

export const getCourseDetail = async (courseId) => {
  return await getCourseDetailApi(courseId);
};

// ==================== ADMIN COURSES ====================

export const getAdminCourses = async (params = {}) => {
  return await getAdminCoursesApi(params);
};

export const getAdminCourseDetail = async (courseId) => {
  return await getAdminCourseDetailApi(courseId);
};

export const createAdminCourse = async (data) => {
  return await createAdminCourseApi(data);
};

export const updateAdminCourse = async (courseId, data) => {
  return await updateAdminCourseApi(courseId, data);
};

export const deleteAdminCourse = async (courseId) => {
  return await deleteAdminCourseApi(courseId);
};

export const publishAdminCourse = async (courseId) => {
  return await publishAdminCourseApi(courseId);
};

export const hideAdminCourse = async (courseId) => {
  return await hideAdminCourseApi(courseId);
};

export const assignInstructor = async (courseId, instructorId) => {
  return await assignInstructorApi(courseId, instructorId);
};

export const getAssignedInstructor = async (courseId) => {
  return await getAssignedInstructorApi(courseId);
};

// ==================== INSTRUCTOR COURSES ====================

export const getInstructorCourses = async (params = {}) => {
  return await getInstructorCoursesApi(params);
};

export const getInstructorCourseDetail = async (courseId) => {
  return await getInstructorCourseDetailApi(courseId);
};

export const getInstructorCourseStudents = async (courseId) => {
  return await getInstructorCourseStudentsApi(courseId);
};

export const getInstructorCourseAnalytics = async (courseId) => {
  return await getInstructorCourseAnalyticsApi(courseId);
};

// ==================== CURRICULUM ====================

export const getCurriculum = async (courseId) => {
  return await getCurriculumApi(courseId);
};

// ==================== CATEGORIES ====================

export const getCategories = async () => {
  return await getCategoriesApi();
};
