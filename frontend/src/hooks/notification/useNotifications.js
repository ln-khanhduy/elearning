import { useState, useCallback } from "react";
import {
  getNotificationsApi,
  getUnreadCountApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  deleteAllNotificationsApi,
} from "../../api/notificationAPI";

/**
 * Hook quản lý danh sách thông báo.
 * Hỗ trợ cả REST API (mặc định) và WebSocket (nếu truyền sendRequest).
 */
export function useNotifications(sendRequest) {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async (page = 1) => {
    try {
      setLoading(true);

      if (sendRequest) {
        // Use WebSocket
        const data = await sendRequest({
          type: "list_notifications",
          page,
          page_size: 20,
        });

        if (data) {
          setNotifications(data.items || []);
          setPagination({
            total: data.total,
            page: data.page,
            page_size: data.page_size,
            total_pages: data.total_pages,
            has_next: data.has_next,
            has_previous: data.has_previous,
          });
        }
      } else {
        // Fallback to REST API
        const res = await getNotificationsApi(page);
        const data = res?.data ?? res;

        if (data) {
          setNotifications(data.items || []);
          setPagination({
            total: data.total,
            page: data.page,
            page_size: data.page_size,
            total_pages: data.total_pages,
            has_next: data.has_next,
            has_previous: data.has_previous,
          });
        }
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [sendRequest]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      if (sendRequest) {
        // Use WebSocket
        const data = await sendRequest({ type: "get_unread_count" });
        setUnreadCount(data?.count ?? 0);
      } else {
        // Fallback to REST API
        const res = await getUnreadCountApi();
        const data = res?.data ?? res;
        setUnreadCount(data?.count ?? 0);
      }
    } catch {}
  }, [sendRequest]);

  const handleMarkRead = useCallback(async (notificationId) => {
    try {
      if (sendRequest) {
        // Use WebSocket
        await sendRequest({
          type: "mark_read",
          notification_id: notificationId,
        });
      } else {
        // Fallback to REST API
        await markNotificationReadApi(notificationId);
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  }, [sendRequest]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      if (sendRequest) {
        // Use WebSocket
        await sendRequest({ type: "mark_all_read" });
      } else {
        // Fallback to REST API
        await markAllNotificationsReadApi();
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  }, [sendRequest]);

  const handleDeleteAll = useCallback(async () => {
    try {
      if (sendRequest) {
        // Use WebSocket
        await sendRequest({ type: "delete_all" });
      } else {
        // Fallback to REST API
        await deleteAllNotificationsApi();
      }

      setNotifications([]);
      setPagination(null);
      setUnreadCount(0);
    } catch {}
  }, [sendRequest]);

  return {
    notifications,
    pagination,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    handleMarkRead,
    handleMarkAllRead,
    handleDeleteAll,
  };
}

export default useNotifications;