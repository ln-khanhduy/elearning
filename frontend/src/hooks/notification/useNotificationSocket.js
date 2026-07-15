import { useEffect, useRef, useCallback } from "react";
import { getAccessToken } from "../../utils/authToken";

const WS_BASE_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000";

let requestIdCounter = 0;
function nextRequestId() {
  requestIdCounter += 1;
  return `req_${requestIdCounter}`;
}

/**
 * Hook để kết nối WebSocket nhận thông báo realtime 100% qua WebSocket.
 * Hỗ trợ gửi request và nhận response qua WebSocket (request/response pattern).
 *
 * Các request gửi khi WebSocket chưa mở sẽ được queue lại và tự động gửi khi kết nối thành công.
 */
export function useNotificationSocket({ onNotification, onUnreadCount }) {
  const wsRef = useRef(null);
  const mountedRef = useRef(true);
  const pendingRequestsRef = useRef({});
  const requestQueueRef = useRef([]);

  // Actually send a message over the wire (called when WS is OPEN)
  const doSend = useCallback((message, requestId) => {
    return new Promise((resolve, reject) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"));
        return;
      }

      message.request_id = requestId;

      pendingRequestsRef.current[requestId] = { resolve, reject };

      // Timeout after 15s
      const timeout = setTimeout(() => {
        delete pendingRequestsRef.current[requestId];
        reject(new Error("Request timed out"));
      }, 15000);

      // Store timeout with the pending request
      pendingRequestsRef.current[requestId].timeout = timeout;

      ws.send(JSON.stringify(message));
    });
  }, []);

  // Send a request via WebSocket — queues if not yet open
  const sendRequest = useCallback((message) => {
    return new Promise((resolve, reject) => {
      const requestId = nextRequestId();
      const ws = wsRef.current;

      if (ws && ws.readyState === WebSocket.OPEN) {
        // Connection is open — send immediately
        doSend(message, requestId).then(resolve).catch(reject);
      } else if (ws && ws.readyState === WebSocket.CONNECTING) {
        // Still connecting — queue for later
        requestQueueRef.current.push({ message, requestId, resolve, reject });
      } else {
        // Not connected at all
        reject(new Error("WebSocket not connected"));
      }
    });
  }, [doSend]);

  const flushQueue = useCallback(() => {
    const queue = requestQueueRef.current;
    requestQueueRef.current = [];
    queue.forEach(({ message, requestId, resolve, reject }) => {
      doSend(message, requestId).then(resolve).catch(reject);
    });
  }, [doSend]);

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
      // Send any queued requests
      flushQueue();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Check if this is a response to a pending request
        const requestId = data.request_id;
        if (requestId && pendingRequestsRef.current[requestId]) {
          const pending = pendingRequestsRef.current[requestId];
          clearTimeout(pending.timeout);
          delete pendingRequestsRef.current[requestId];
          pending.resolve(data);
          return;
        }

        // Handle server-initiated events
        if (data.type === "new_notification" && onNotification) {
          onNotification(data.notification, data.unread_count);
        } else if (data.type === "unread_count" && onUnreadCount) {
          onUnreadCount(data.count);
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      // Reject all pending requests
      Object.keys(pendingRequestsRef.current).forEach((id) => {
        const pending = pendingRequestsRef.current[id];
        clearTimeout(pending.timeout);
        pending.reject(new Error("WebSocket disconnected"));
      });
      pendingRequestsRef.current = {};
    };

    ws.onerror = () => {
      // ws.onclose will fire after this, so cleanup happens there
    };
  }, [onNotification, onUnreadCount, flushQueue]);

  const disconnect = useCallback(() => {
    // Reject all pending requests
    Object.keys(pendingRequestsRef.current).forEach((id) => {
      const pending = pendingRequestsRef.current[id];
      clearTimeout(pending.timeout);
      pending.reject(new Error("WebSocket disconnected"));
    });
    pendingRequestsRef.current = {};
    requestQueueRef.current = [];
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

  return { sendRequest, disconnect, reconnect: connect };
}