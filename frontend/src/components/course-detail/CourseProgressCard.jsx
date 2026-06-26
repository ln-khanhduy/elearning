import React from "react";
import { getCourseAction } from "../../services/courseActionService";
import { formatPrice } from "../../utils/formatPrice";
import "../../style/course-detail/course-progress-card.css";

/**
 * CourseProgressCard - Sidebar hiển thị tiến độ học tập tại trang chi tiết khóa học
 * Gồm: giá khóa học, thanh progress, nút CTA theo trạng thái, thông tin khóa học
 *
 * Trạng thái CTA (dùng getCourseAction):
 * - Chưa enroll → "Đăng ký học"
 * - Đã enroll, progress = 0 → "Bắt đầu học"
 * - Đang học (0 < progress < 100) → "Học tiếp"
 * - Hoàn thành (progress = 100) → "Đã hoàn thành"
 */
function CourseProgressCard({
  isEnrolled, progressPercent, completedCount, totalLessons=0, price, originalPrice,
  onEnroll, onStartLearning, onContinueLearning, loading,
}) {
  // Xác định hành động dựa vào trạng thái enrollment và progress
  const action = getCourseAction({
    isEnrolled, progressPercent: progressPercent || 0,
    completedLessonsCount: completedCount || 0, totalLessonsCount: totalLessons || 0, price,
  });

  // Xử lý click nút : gọi callback tương ứng
  const handleClick = () => {
    if (loading) return;
    if (action.action === "enroll") onEnroll?.();
    else if (action.action === "start") onStartLearning?.();
    else if (action.action === "continue") onContinueLearning?.();
  };

  return (
    <div className="course-progress-card">
      {/* Giá khóa học - chỉ hiển thị khi chưa enroll */}
      {!isEnrolled && price !== null && price !== undefined && (
        <div className="progress-card-price">
          <span className="price-current">{formatPrice(price)}</span>
          {originalPrice && Number(originalPrice) > Number(price) && (
            <span className="price-original">{formatPrice(originalPrice)}</span>
          )}
        </div>
      )}

      {/* Thanh tiến độ - chỉ hiển thị khi đã enroll */}
      {isEnrolled && (
        <div className="progress-card-progress">
          <div className="progress-header">
            <i className="bi bi-graph-up-arrow"></i>
            <span>Tiến độ học tập</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${Math.min(progressPercent || 0, 100)}%` }}></div>
          </div>
          <div className="progress-stats">
            <span className="progress-percent">{progressPercent || 0}%</span>
            <span className="progress-lessons">{completedCount}/{totalLessons} bài học</span>
          </div>
        </div>
      )}

      {/* Nút CTA - dựa vào action từ getCourseAction */}
      <button className={`progress-card-btn btn-${action.variant}`} onClick={handleClick} disabled={loading}>
        {loading ? (
          <span className="spinner-border spinner-border-sm" role="status"></span>
        ) : (
          <><i className={action.icon}></i> {action.label}</>
        )}
      </button>

      {/* Thông tin khóa học */}
      <div className="progress-card-info">
        <div className="info-item"><i className="bi bi-infinity"></i><span>Truy cập trọn đời</span></div>
        <div className="info-item"><i className="bi bi-phone"></i><span>Học mọi lúc, mọi nơi</span></div>
        <div className="info-item"><i className="bi bi-award"></i><span>Chứng chỉ hoàn thành</span></div>
      </div>
    </div>
  );
}

export default CourseProgressCard;
