import {getMyCoursesApi,getEnrollmentDetailApi,checkEnrolledApi,} from "../api/enrollmentAPI";

export const getMyCourses = async () => {
  return await getMyCoursesApi();
};

export const getEnrollmentDetail = async (enrollmentId) => {
  return await getEnrollmentDetailApi(enrollmentId);
};

export const checkEnrolled = async (courseId) => {
  return await checkEnrolledApi(courseId);
};
