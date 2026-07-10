import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useNotifications } from "../../hooks/notification/useNotifications";
import NotificationItem from "../../components/notification/NotificationItem";
import ConfirmModal from "../../components/common/ConfirmModal";

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
    handleDeleteAll,
  } = useNotifications();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchNotifications(1);
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const handlePageChange = (page) => {
    fetchNotifications(page);
  };

  const handleDeleteAllClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAll = () => {
    handleDeleteAll();
    setShowDeleteConfirm(false);
    toast.success("Đã xóa tất cả thông báo.");
  };

  return (
    <div className="container-center py-4">
      <div className="notif-page">
        <div className="notif-page-header">
          <h3>Thông báo</h3>
          <div className="notif-page-actions">
            {pagination && pagination.total > 0 && (
              <>
                <button className="notif-page-mark-all-btn" onClick={handleMarkAllRead}>
                  Đánh dấu đã đọc
                </button>
                <button className="notif-page-delete-all-btn" onClick={handleDeleteAllClick}>
                  <i className="bi bi-trash"></i> Xóa tất cả
                </button>
              </>
            )}
          </div>
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

      <ConfirmModal
        show={showDeleteConfirm}
        title="Xóa tất cả thông báo"
        message="Bạn có chắc chắn muốn xóa tất cả thông báo? Hành động này không thể hoàn tác."
        confirmLabel="Xóa tất cả"
        cancelLabel="Hủy"
        variant="danger"
        onConfirm={confirmDeleteAll}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

export default NotificationsPage;
