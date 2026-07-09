import React from "react";
import { useNavigate } from "react-router-dom";

const TYPE_LABELS = {
  SYSTEM: "Hệ thống",
  PAYMENT: "Thanh toán",
  COURSE: "Khóa học",
  SUPPORT: "Hỗ trợ",
  ACCOUNT: "Tài khoản",
};

function NotificationItem({ notification, onMarkRead }) {
  const navigate = useNavigate();
  const isUnread = !notification.is_read;

  const handleClick = () => {
    if (isUnread && onMarkRead) {
      onMarkRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const formatDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div
      className={`notif-item ${isUnread ? "notif-item--unread" : ""}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <div className="notif-item-left">
        {isUnread && <span className="notif-dot"></span>}
      </div>
      <div className="notif-item-body">
        <div className="notif-item-title">{notification.title}</div>
        <div className="notif-item-text">{notification.body}</div>
        <div className="notif-item-meta">
          <span className="notif-item-type">{TYPE_LABELS[notification.notification_type] || notification.notification_type}</span>
          <span className="notif-item-time">{formatDate(notification.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

export default NotificationItem;