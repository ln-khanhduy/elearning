import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useUser } from "../../../context/UserContext";
import { useCourseDetail } from "../../../hooks/courseDetail/useCourseDetail";
import { useCourseProgress } from "../../../hooks/courseDetail/useCourseProgress";
import { useReviews } from "../../../hooks/courseDetail/useReviews";
import CourseHero from "../../../components/courseDetail/CourseHero";
import CourseProgressCard from "../../../components/courseDetail/CourseProgressCard";
import CourseContentList from "../../../components/courseDetail/CourseContentList";
import CourseTabs, { TabPanel } from "../../../components/courseDetail/CourseTabs";
import ReviewStats from "../../../components/courseDetail/ReviewStats";
import ReviewForm from "../../../components/courseDetail/ReviewForm";
import ReviewItem from "../../../components/courseDetail/ReviewItem";
import "../../../style/courseDetail/course-theme.css";
import "../../../style/courseDetail/course-detail-page.css";


/**
 * CourseDetailPage - Trang chi tiết khóa học
 * Container/page chính, đóng vai trò orchestrate các component con
 */
function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useUser();

  const {
    course,
    curriculum,
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

  // Reviews
  const {
    reviews,
    stats,
    userReview,
    fetchReviews,
    fetchStats,
    handleCreateReview,
    handleCreateReply,
    handleUpdateReview,
    handleDeleteReview,
  } = useReviews(courseId);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Fetch reviews/stats on mount
  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [fetchReviews, fetchStats]);

  const completedCount = getCompletedLessonsCount(curriculum);
  const totalLessons = getTotalLessonsCount(curriculum);

  const handleEnroll = useCallback(async () => {
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để đăng ký khóa học.");
      navigate("/login", { state: { from: `/courses/${courseId}` } });
      return;
    }

    if (!course) return;

    // Khóa học có phí -> chuyển đến trang thanh toán (đã chọn gói)
    if (selectedPlan) {
      navigate(`/courses/${courseId}/checkout?plan_id=${selectedPlan.id}`);
      return;
    }

    // Chưa chọn gói -> nhắc chọn
    toast.info("Vui lòng chọn gói truy cập trước.");
  }, [isAuthenticated, navigate, courseId, course, selectedPlan]);


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

              <TabPanel label="Đánh giá" badge={stats?.total_count || reviews.length}>
                <div className="reviews-section">
                  <h3>Đánh giá khóa học</h3>

                  {/* Thống kê đánh giá */}
                  <ReviewStats stats={stats} />

                  {/* Nút viết đánh giá (chỉ hiện nếu chưa review và đã login) */}
                  {isAuthenticated && !userReview && !showReviewForm && (
                    <div className="review-form-trigger text-center mb-3">
                      <button className="btn btn-primary" onClick={() => setShowReviewForm(true)}>
                        <i className="bi bi-star me-1"></i> Viết đánh giá
                      </button>
                    </div>
                  )}

                  {isAuthenticated && !userReview && showReviewForm && (
                    <ReviewForm
                      onSubmit={async (rating, content) => {
                        const success = await handleCreateReview(rating, content);
                        if (success) setShowReviewForm(false);
                      }}
                      onCancel={() => setShowReviewForm(false)}
                      mode="create"
                    />
                  )}

                  {isAuthenticated && userReview && (
                    <div className="review-user-review-notice">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      Bạn đã đánh giá khóa học này.
                    </div>
                  )}

                  {/* Danh sách đánh giá */}
                  {reviews.length > 0 ? (
                    <div className="reviews-list">
                      {reviews.map((review) => (
                        <ReviewItem
                          key={review.id}
                          review={review}
                          userId={user?.id}
                          onUpdate={handleUpdateReview}
                          onDelete={handleDeleteReview}
                          onReply={handleCreateReply}
                        />
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
            </CourseTabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="course-detail-right">
            <div className="course-detail-sticky">
              <CourseProgressCard
                courseId={courseId}
                isEnrolled={isEnrolled}
                progressPercent={progressPercent}
                completedCount={completedCount}
                totalLessons={totalLessons}
                plans={course.access_plans || []}
                selectedPlan={selectedPlan}
                onSelectPlan={setSelectedPlan}
                price={course.min_price}
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
