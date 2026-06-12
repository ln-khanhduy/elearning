import {
  getReviewsApi,
  getCourseReviewsApi,
  getReviewDetailApi,
  createReviewApi,
  updateReviewStatusApi,
} from "../api/reviewAPI";

export const getReviews = async () => {
  return await getReviewsApi();
};

export const getCourseReviews = async (courseId) => {
  return await getCourseReviewsApi(courseId);
};

export const getReviewDetail = async (reviewId) => {
  return await getReviewDetailApi(reviewId);
};

export const createReview = async (data) => {
  return await createReviewApi(data);
};

export const updateReviewStatus = async (reviewId, status) => {
  return await updateReviewStatusApi(reviewId, status);
};
