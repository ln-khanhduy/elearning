import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { getUnreadCountApi, markAllNotificationsReadApi, getNotificationsApi } from "../../api/notificationAPI";
import { useNotificationSocket } from "../../hooks/notification/useNotificationSocket";

function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useUser();

  const handleNewNotification = useCallback((notification, count) => {
    setUnreadCount(count);
    setRecent((prev) => [notification, ...prev].slice(0, 5));
  }, []);

  const handleUnreadCount = useCallback((count) => {
    setUnreadCount(count);
  }, []);

  useNotificationSocket({
    onNotification: handleNewNotification,
    onUnreadCount: handleUnreadCount,
  });

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [unreadRes, listRes] = await Promise.all([
        getUnreadCountApi(),
        getNotificationsApi(1, 5),
      ]);
      setUnreadCount(unreadRes?.data?.count ?? 0);
      const items = listRes?.data?.items ?? [];
      setRecent(items);
    } catch {}
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsReadApi();
      setUnreadCount(0);
      setRecent((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate("/notifications");
  };

  const TypeIcon = ({ type }) => {
    const icons = {
      SYSTEM: "bi-gear",
      PAYMENT: "bi-credit-card",
      COURSE: "bi-book",
      SUPPORT: "bi-headset",
      ACCOUNT: "bi-person",
    };
    return <i className={`bi ${icons[type] || "bi-bell"}`}></i>;
  };

  return (
    <div className="notif-bell" ref={dropdownRef}>
      <button className="notif-bell-btn" onClick={() => setOpen(!open)} aria-label="Thông báo">
        <i className="bi bi-bell"></i>
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span className="notif-dropdown-title">Thông báo</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all-btn" onClick={handleMarkAllRead}>
                Đánh dấu đã đọc
              </button>
            )}
          </div>
          <div className="notif-dropdown-body">
            {recent.length === 0 ? (
              <div className="notif-dropdown-empty">Không có thông báo</div>
            ) : (
              recent.map((n) => (
                <div
                  key={n.id}
                  className={`notif-dropdown-item ${!n.is_read ? "notif-dropdown-item--unread" : ""}`}
                  onClick={() => {
                    setOpen(false);
                    if (n.link) navigate(n.link);
                  }}
                >
                  <div className="notif-dropdown-item-icon">
                    <TypeIcon type={n.notification_type} />
                  </div>
                  <div className="notif-dropdown-item-body">
                    <div className="notif-dropdown-item-title">{n.title}</div>
                    <div className="notif-dropdown-item-text">{n.body}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="notif-dropdown-footer">
            <button className="notif-view-all-btn" onClick={handleViewAll}>
              Xem tất cả thông báo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;