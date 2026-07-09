import { useEffect, useRef, useCallback } from "react";
import { getAccessToken } from "../../utils/authToken";

const WS_BASE_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000";

/**
 * Hook để kết nối WebSocket nhận thông báo realtime.
 * Tự động kết nối/ngắt kết nối dựa vào access token.
 */
export function useNotificationSocket({ onNotification, onUnreadCount }) {
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    const token = getAccessToken();
    if (!token) return;

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const url = `${WS_BASE_URL}/ws/notifications/?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      // console.log("[WS] Connected to notifications");
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
      // Reconnect after 5 seconds if not intentional close and component still mounted
      if (!event.wasClean && mountedRef.current) {
        reconnectTimerRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, 5000);
      }
    };

    ws.onerror = () => {
      // Will trigger onclose, no need to handle separately
    };
  }, [onNotification, onUnreadCount]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [connect, disconnect]);
}