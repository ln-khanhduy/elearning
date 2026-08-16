import { useEffect, useRef, useCallback } from "react";
import { getAccessToken } from "../../utils/authToken";

/**
 * Suy WS base URL từ window.location (cùng origin với frontend).
 * - Dev: frontend (5173) -> Vite proxy /ws -> backend (8000).
 * - Prod: wss://cùng-domain -> hoạt động ngay không cần env.
 * Nếu có VITE_WS_URL thì ưu tiên dùng giá trị đó (tùy chọn).
 */
function getWsBaseUrl() {
  const envUrl = import.meta.env.VITE_WS_URL;
  if (envUrl) return envUrl.replace(/\/+$/, "");
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}`;
}

/**
 * Hook WebSocket chat theo khóa.
 * - URL: /ws/chat/?token=...&course_id=...
 * - Nhận tin nhắn mới qua `onNewMessage`.
 */
export function useChatSocket({ courseId, onNewMessage, onPresence }) {
  const wsRef = useRef(null);
  const courseIdRef = useRef(courseId);
  const handleMessageRef = useRef(onNewMessage);
  const onPresenceRef = useRef(onPresence);

  // Cập nhật ref trong effect không cập nhật ref trong render
  useEffect(() => {
    courseIdRef.current = courseId;
  }, [courseId]);

  useEffect(() => {
    handleMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    onPresenceRef.current = onPresence;
  }, [onPresence]);

  const connect = useCallback(() => {
    const token = getAccessToken();
    const cid = courseIdRef.current;
    if (!token || !cid) return;

    // Đóng kết nối cũ
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const url = `${getWsBaseUrl()}/ws/chat/?token=${encodeURIComponent(token)}&course_id=${encodeURIComponent(cid)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_message" && handleMessageRef.current) {
          handleMessageRef.current(data.message);
        }
        if (data.type === "user_presence" && onPresenceRef.current) {
          const { user_id: uid, online } = data;
          onPresenceRef.current(uid, online);
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    ws.onerror = () => {
      // WS error - onclose se cleanup
    };
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((content) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("WebSocket chưa kết nối."));
    }
    ws.send(JSON.stringify({ type: "send_message", content }));
    return Promise.resolve();
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect, courseId]);

  return { sendMessage, disconnect, reconnect: connect };
}