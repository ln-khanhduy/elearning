import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../hooks/notification/useNotifications";
import NotificationItem from "../../components/notification/NotificationItem";

function NotificationsPage() {
  const navigate = useNavigate();
  const {
    notifications,
    pagination,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    handleMarkRead,
    handleMarkAllRead,
  } = useNotifications();

  useEffect(() => {
    fetchNotifications(1);
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const handlePageChange = (page) => {
    fetchNotifications(page);
  };

  return (
    <div className="container-center py-4">
      <div className="notif-page">
        <div className="notif-page-header">
          <h3>Thông báo</h3>
          {pagination && pagination.total > 0 && (
            <button className="notif-page-mark-all-btn" onClick={handleMarkAllRead}>
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {loading ? (
          <div className="notif-page-loading">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notif-page-empty">
            <i className="bi bi-bell-slash"></i>
            <p>Không có thông báo nào.</p>
            <button className="notif-page-back-home" onClick={() => navigate("/home")}>
              Quay lại trang chủ
            </button>
          </div>
        ) : (
          <>
            <div className="notif-page-list">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={handleMarkRead}
                />
              ))}
            </div>

            {pagination && pagination.total_pages > 1 && (
              <div className="notif-page-pagination">
                {pagination.has_previous && (
                  <button
                    className="notif-page-btn"
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    <i className="bi bi-chevron-left"></i> Trước
                  </button>
                )}
                <span className="notif-page-info">
                  Trang {pagination.page} / {pagination.total_pages}
                </span>
                {pagination.has_next && (
                  <button
                    className="notif-page-btn"
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Sau <i className="bi bi-chevron-right"></i>
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;