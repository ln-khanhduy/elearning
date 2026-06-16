export function getCourseAction({
  isEnrolled,
  progressPercent = 0,
  completedLessonsCount = 0,
  totalLessonsCount = 0,
  price,
} = {}) {
  if (!isEnrolled) {
    if (price && Number(price) > 0) {
      return {
        label: "Thanh toán để học",
        icon: "bi bi-credit-card",
        variant: "primary",
        action: "enroll",
      };
    }
    return {
      label: "Đăng ký học",
      icon: "bi bi-cart-plus",
      variant: "primary",
      action: "enroll",
    };
  }

  if (progressPercent === 0 && completedLessonsCount === 0) {
    return {
      label: "Bắt đầu học",
      icon: "bi bi-play-circle",
      variant: "primary",
      action: "start",
    };
  }

  if (progressPercent >= 100) {
    return {
      label: "Đã hoàn thành",
      icon: "bi bi-check-circle",
      variant: "success",
      action: "completed",
    };
  }

  return {
    label: "Học tiếp",
    icon: "bi bi-play-circle",
    variant: "primary",
    action: "continue",
  };
}
