import React, { useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useUser } from "../../../context/UserContext";
import { useCourseDetail } from "../../../hooks/course-detail/useCourseDetail";
import { useCourseProgress } from "../../../hooks/course-detail/useCourseProgress";
import { enrollFreeCourseApi } from "../../../api/paymentAPI";
import CourseHero from "../../../components/course-detail/CourseHero";
import CourseProgressCard from "../../../components/course-detail/CourseProgressCard";
import CourseContentList from "../../../components/course-detail/CourseContentList";
import InstructorCard from "../../../components/course-detail/InstructorCard";
import CourseTabs, { TabPanel } from "../../../components/course-detail/CourseTabs";
import "../../../style/course-detail/course-theme.css";
import "../../../style/course-detail/course-detail-page.css";


/**
 * CourseDetailPage - Trang chi tiết khóa học
 * Container/page chính, đóng vai trò orchestrate các component con
 */
function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useUser();

  const {
    course,
    curriculum,
    reviews,
    loading,
    error,
    refetch: refetchCourse,
  } = useCourseDetail(courseId);

  const {
    isEnrolled,
    progressPercent,
    enrollment,
    loading: progressLoading,
    getCompletedLessonsCount,
    getTotalLessonsCount,
  } = useCourseProgress(courseId);

  const completedCount = getCompletedLessonsCount(curriculum);
  const totalLessons = getTotalLessonsCount(curriculum);

  const handleEnroll = useCallback(async () => {
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để đăng ký khóa học.");
      navigate("/login", { state: { from: `/courses/${courseId}` } });
      return;
    }

    if (!course) return;

    // Khóa học miễn phí -> gọi API enroll-free
    if (!course.price || Number(course.price) <= 0) {
      try {
        const result = await enrollFreeCourseApi(courseId);
        toast.success(result?.message || "Đăng ký khóa học thành công!");
        const redirectUrl = result?.data?.redirect_url;
        if (redirectUrl) {
          navigate(redirectUrl, { replace: true });
        } else {
          navigate(`/courses/${courseId}/learn`, { replace: true });
        }
      } catch (err) {
        toast.error(err.message || "Đăng ký thất bại. Vui lòng thử lại.");
      }
      return;
    }

    // Khóa học có phí -> chuyển đến trang thanh toán
    navigate(`/courses/${courseId}/checkout`);
  }, [isAuthenticated, navigate, courseId, course]);


  const handleStartLearning = useCallback(() => {
    if (!isEnrolled) return;
    navigate(`/courses/${courseId}/learn`);
  }, [isEnrolled, navigate, courseId]);

  const handleContinueLearning = useCallback(() => {
    if (!isEnrolled) return;
    // Nếu có last_completed_lesson, navigate đến lesson đó
    const lastLessonId = enrollment?.last_completed_lesson?.id;
    if (lastLessonId) {
      navigate(`/courses/${courseId}/learn/${lastLessonId}`);
    } else {
      navigate(`/courses/${courseId}/learn`);
    }
  }, [isEnrolled, navigate, courseId, enrollment]);

  /** Xử lý click vào FREE lesson - cho phép xem trước miễn phí */
  const handleFreeLessonClick = useCallback((lesson) => {
    if (lesson && lesson.id) {
      navigate(`/courses/${courseId}/learn/${lesson.id}`);
    }
  }, [navigate, courseId]);


  // Loading state
  if (loading) {
    return (
      <div className="course-detail-wrapper">
        <div className="course-detail-loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p>Đang tải thông tin khóa học...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="course-detail-wrapper">
        <div className="course-detail-error">
          <i className="bi bi-exclamation-triangle"></i>
          <h3>Không thể tải khóa học</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={refetchCourse}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Not found
  if (!course) {
    return (
      <div className="course-detail-wrapper">
        <div className="course-detail-error">
          <i className="bi bi-search"></i>
          <h3>Không tìm thấy khóa học</h3>
          <p>Khóa học không tồn tại hoặc đã bị xóa.</p>
          <button className="btn btn-primary" onClick={() => navigate("/courses")}>
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="course-detail-wrapper">
      {/* Hero Section */}
      <CourseHero course={course} />

      {/* Main Content */}
      <div className="course-detail-main">
        <div className="course-detail-container">
          {/* Left Column */}
          <div className="course-detail-left">
            {/* Tabs: Overview, Content, Reviews, Instructor */}
            <CourseTabs>
              <TabPanel label="Tổng quan" badge={null}>
                <div className="overview-section">
                  <h3>Giới thiệu khóa học</h3>
                  <p className="overview-description">
                    {course.description || "Chưa có mô tả chi tiết cho khóa học này."}
                  </p>

                  {course.objectives && course.objectives.length > 0 && (
                    <div className="overview-objectives">
                      <h4>Bạn sẽ học được</h4>
                      <ul className="objectives-list">
                        {course.objectives.map((obj, i) => (
                          <li key={i}>
                            <i className="bi bi-check-lg"></i>
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {course.requirements && course.requirements.length > 0 && (
                    <div className="overview-requirements">
                      <h4>Yêu cầu</h4>
                      <ul className="requirements-list">
                        {course.requirements.map((req, i) => (
                          <li key={i}>
                            <i className="bi bi-dot"></i>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </TabPanel>

              <TabPanel label="Nội dung" badge={totalLessons}>
                <CourseContentList
                  curriculum={curriculum}
                  completedLessons={enrollment?.completed_lessons || []}
                  isEnrolled={isEnrolled}
                  onFreeLessonClick={handleFreeLessonClick}
                />
              </TabPanel>

              <TabPanel label="Đánh giá" badge={reviews.length}>
                <div className="reviews-section">
                  <h3>Đánh giá khóa học</h3>
                  {reviews.length > 0 ? (
                    <div className="reviews-list">
                      {reviews.map((review, i) => (
                        <div key={review.id || i} className="review-item">
                          <div className="review-header">
                            <div className="review-avatar">
                              {review.user_avatar ? (
                                <img
                                  src={review.user_avatar}
                                  alt={review.user_name}
                                  className="review-avatar-img"
                                />
                              ) : (
                                <span className="review-avatar-letter">
                                  {(review.user_name || "U")[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="review-user">
                              <strong>{review.user_name || "Học viên"}</strong>
                              <div className="review-stars">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <i
                                    key={s}
                                    className={`bi ${
                                      s <= (review.rating || 0)
                                        ? "bi-star-fill"
                                        : "bi-star"
                                    }`}
                                  ></i>
                                ))}
                              </div>
                            </div>
                            <span className="review-date">
                              {review.created_at
                                ? new Date(review.created_at).toLocaleDateString("vi-VN")
                                : ""}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="review-comment">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="reviews-empty">
                      <i className="bi bi-chat-square-text"></i>
                      <p>Chưa có đánh giá nào cho khóa học này.</p>
                    </div>
                  )}
                </div>
              </TabPanel>

              <TabPanel label="Giảng viên">
                <InstructorCard course={course} />
              </TabPanel>
            </CourseTabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="course-detail-right">
            <div className="course-detail-sticky">
              <CourseProgressCard
                isEnrolled={isEnrolled}
                progressPercent={progressPercent}
                completedCount={completedCount}
                totalLessons={totalLessons}
                price={course.price}
                originalPrice={course.original_price}
                onEnroll={handleEnroll}
                onStartLearning={handleStartLearning}
                onContinueLearning={handleContinueLearning}
                loading={progressLoading}
              />

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseDetailPage;
