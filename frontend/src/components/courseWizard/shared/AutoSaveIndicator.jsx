import { memo } from "react";

function AutoSaveIndicator({ saving, lastSavedAt }) {
  if (saving) {
    return (
      <span className="cw-save-indicator">
        <span className="spinner-border" role="status"></span>
        Đang lưu...
      </span>
    );
  }

  if (lastSavedAt) {
    const diff = Date.now() - lastSavedAt;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    let timeAgo;
    if (minutes > 0) {
      timeAgo = `${minutes} phút trước`;
    } else if (seconds > 30) {
      timeAgo = `${seconds} giây trước`;
    } else {
      timeAgo = "Vừa xong";
    }
    return (
      <span className="cw-save-indicator">
        <i className="bi bi-check-circle-fill text-success"></i>
        Đã lưu {timeAgo}
      </span>
    );
  }

  return null;
}

export default memo(AutoSaveIndicator);
