import { useEffect, useRef, useCallback, useState } from "react";
import { getAccessToken } from "../../utils/authToken";
import { getUnreadCountApi } from "../../api/notificationAPI";

const WS_BASE_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000";

/**
 * Hook để kết nối WebSocket nhận thông báo realtime.
 * Tự động fallback sang polling nếu WebSocket không hoạt động (Render free).
 */
export function useNotificationSocket({ onNotification, onUnreadCount }) {
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const [usePolling, setUsePolling] = useState(false);
  const pollTimerRef = useRef(null);

  // Polling fallback: gọi API mỗi 30s
  const startPolling = useCallback(() => {
    if (pollTimerRef.current) return;
    const poll = async () => {
      if (!mountedRef.current) return;
      try {
        const res = await getUnreadCountApi();
        if (res?.data?.count !== undefined && onUnreadCount) {
          onUnreadCount(res.data.count);
        }
      } catch {
        // ignore
      }
      if (mountedRef.current) {
        pollTimerRef.current = setTimeout(poll, 30000);
      }
    };
    poll();
  }, [onUnreadCount]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    const token = getAccessToken();
    if (!token) return;

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Routing đã có ws/ prefix → không thêm /ws nữa
    const url = `${WS_BASE_URL.replace(/\/+$/, '')}/ws/notifications/?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setUsePolling(false);
      stopPolling();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_notification" && onNotification) {
          onNotification(data.notification, data.unread_count);
        } else if (data.type === "unread_count" && onUnreadCount) {
          onUnreadCount(data.count);
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = (event) => {
      wsRef.current = null;
      // Fallback sang polling nếu WebSocket không khả dụng (Render free)
      if (!usePolling) {
        setUsePolling(true);
        startPolling();
      }
    };

    ws.onerror = () => {
      // Fallback sang polling
      if (!usePolling) {
        setUsePolling(true);
        startPolling();
      }
    };
  }, [onNotification, onUnreadCount, startPolling, stopPolling, usePolling]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    stopPolling();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [stopPolling]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [connect, disconnect]);
}
