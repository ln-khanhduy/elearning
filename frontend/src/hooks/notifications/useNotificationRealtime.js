import { useEffect, useRef, useCallback } from "react";
import { useUser } from "../../context/UserContext";

const WS_BASE = import.meta.env.VITE_WS_URL || "ws://localhost:8000";

export function useNotificationRealtime(onNotificationReceived) {
  const { user, isAuthenticated } = useUser();
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (!isAuthenticated || !user?.id) return;

    const wsUrl = `${WS_BASE}/ws/notifications/?user_id=${user.id}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("[WS] Connected to notifications");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "notification" && onNotificationReceived) {
            onNotificationReceived(data.payload);
          }
        } catch (err) {
          console.error("[WS] Error parsing message:", err);
        }
      };

      ws.onclose = (e) => {
        console.log("[WS] Disconnected:", e.code);
        // Reconnect after 5s
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };

      ws.onerror = (err) => {
        console.error("[WS] Error:", err);
        ws.close();
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("[WS] Connection failed:", err);
      // Retry
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 10000);
    }
  }, [isAuthenticated, user?.id, onNotificationReceived]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return {
    disconnect: () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    },
    reconnect: connect,
  };
}