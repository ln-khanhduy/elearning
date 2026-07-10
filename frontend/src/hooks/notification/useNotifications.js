import { useState, useCallback } from "react";
import {
  getNotificationsApi,
  getUnreadCountApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  deleteAllNotificationsApi,
} from "../../api/notificationAPI";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async (page = 1) => {
    try {
      setLoading(true);
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
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadCountApi();
      const data = res?.data ?? res;
      setUnreadCount(data?.count ?? 0);
    } catch {}
  }, []);

  const handleMarkRead = useCallback(async (notificationId) => {
    try {
      await markNotificationReadApi(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllNotificationsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  }, []);

  const handleDeleteAll = useCallback(async () => {
    try {
      await deleteAllNotificationsApi();
      setNotifications([]);
      setPagination(null);
      setUnreadCount(0);
    } catch {}
  }, []);

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