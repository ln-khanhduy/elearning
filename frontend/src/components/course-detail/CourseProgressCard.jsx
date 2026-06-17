import React from "react";
import { getCourseAction } from "../../utils/courseAction";
import "../../style/course-detail/course-progress-card.css";

/**
 * Sidebar card hiển thị tiến độ học tập
 * Gồm: thanh progress, % hoàn thành, số bài đã học, nút CTA theo trạng thái
 *
 * Trạng thái CTA (dùng getCourseAction helper):
 * - Chưa enroll → "Đăng ký học"
 * - Đã enroll, progress = 0 → "Bắt đầu học"
 * - Đang học (0 < progress < 100) → "Học tiếp"
 * - Hoàn thành (progress = 100) → "Đã hoàn thành"
 */
function CourseProgressCard({
  isEnrolled,
  progressPercent,
  completedCount,
  totalLessons,
  price,
  originalPrice,
  onEnroll,
  onStartLearning,
  onContinueLearning,
  loading,
}) {
  const formatPrice = (val) => {
    if (!val && val !== 0) return null;
    return Number(val).toLocaleString("vi-VN") + "₫";
  };

  const hasDiscount = originalPrice && Number(originalPrice) > Number(price);

  // Xác định CTA dựa vào trạng thái
  const action = getCourseAction({
    isEnrolled,
    progressPercent: progressPercent || 0,
    completedLessonsCount: completedCount || 0,
    totalLessonsCount: totalLessons || 0,
    price,
  });

  const handleClick = () => {
    if (loading) return;
    if (action.action === "enroll") {
      onEnroll?.();
    } else if (action.action === "start") {
      onStartLearning?.();
    } else if (action.action === "continue") {
      onContinueLearning?.();
    }
  };

  return (
    <div className="course-progress-card">
      {/* Price section - chỉ hiển thị khi chưa enroll */}
      {!isEnrolled && price !== null && price !== undefined && (
        <div className="progress-card-price">
          <span className="price-current">{formatPrice(price)}</span>
          {hasDiscount && (
            <span className="price-original">{formatPrice(originalPrice)}</span>
          )}
        </div>
      )}

      {/* Progress section (only for enrolled users) */}
      {isEnrolled && (
        <div className="progress-card-progress">
          <div className="progress-header">
            <i className="bi bi-graph-up-arrow"></i>
            <span>Tiến độ học tập</span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.min(progressPercent || 0, 100)}%` }}
            ></div>
          </div>
          <div className="progress-stats">
            <span className="progress-percent">{progressPercent || 0}%</span>
            <span className="progress-lessons">
              {completedCount}/{totalLessons} bài học
            </span>
          </div>
        </div>
      )}

      {/* CTA Button - dựa vào action từ getCourseAction */}
      <button
        className={`progress-card-btn btn-${action.variant}`}
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? (
          <span className="spinner-border spinner-border-sm" role="status"></span>
        ) : (
          <>
            <i className={action.icon}></i> {action.label}
          </>
        )}
      </button>

      {/* Course info summary */}
      <div className="progress-card-info">
        <div className="info-item">
          <i className="bi bi-infinity"></i>
          <span>Truy cập trọn đời</span>
        </div>
        <div className="info-item">
          <i className="bi bi-phone"></i>
          <span>Học mọi lúc, mọi nơi</span>
        </div>
        <div className="info-item">
          <i className="bi bi-award"></i>
          <span>Chứng chỉ hoàn thành</span>
        </div>
      </div>
    </div>
  );
}

export default CourseProgressCard;
