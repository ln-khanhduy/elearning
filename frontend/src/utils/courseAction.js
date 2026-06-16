/**
 * Helper xác định trạng thái CTA (Call To Action) cho CourseDetailPage.
 * Tương tự Coursera/Udemy: dựa vào enrollment và progress để hiển thị nút phù hợp.
 *
 * @param {Object} options
 * @param {boolean} options.isEnrolled - User đã đăng ký khóa học chưa
 * @param {number} options.progressPercent - % hoàn thành (0-100)
 * @param {number} options.completedLessonsCount - Số bài đã hoàn thành
 * @param {number} options.totalLessonsCount - Tổng số bài học
 * @param {number|null} options.price - Giá khóa học (null nếu chưa có)
 * @returns {{ label: string, icon: string, variant: string, action: string }}
 *
 * action: dùng để xác định hành vi khi click nút
 *   - "enroll" -> Đăng ký khóa học
 *   - "start" -> Bắt đầu học (mở lesson đầu tiên)
 *   - "continue" -> Học tiếp (mở lesson tiếp theo)
 *   - "completed" -> Đã hoàn thành (không click được)
 */
export function getCourseAction({
  isEnrolled,
  progressPercent = 0,
  completedLessonsCount = 0,
  totalLessonsCount = 0,
  price,
} = {}) {
  // Chưa đăng ký
  if (!isEnrolled) {
    return {
      label: "Đăng ký học",
      icon: "bi bi-cart-plus",
      variant: "primary",
      action: "enroll",
    };
  }

  // Đã đăng ký nhưng chưa học bài nào
  if (progressPercent === 0 && completedLessonsCount === 0) {
    return {
      label: "Bắt đầu học",
      icon: "bi bi-play-circle",
      variant: "primary",
      action: "start",
    };
  }

  // Đã hoàn thành 100%
  if (progressPercent >= 100) {
    return {
      label: "Đã hoàn thành",
      icon: "bi bi-check-circle",
      variant: "success",
      action: "completed",
    };
  }

  // Đang học (0 < progress < 100)
  return {
    label: "Học tiếp",
    icon: "bi bi-play-circle",
    variant: "primary",
    action: "continue",
  };
}
