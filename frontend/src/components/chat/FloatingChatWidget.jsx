import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { useUser } from "../../context/UserContext";
import { useChatSocket } from "../../hooks/chat/useChatSocket";
import { useVoiceRecorder } from "../../hooks/chat/useVoiceRecorder";
import {
  getChatRoomsApi,
  getChatMessagesApi,
  sendChatMessageApi,
  reportChatMessageApi,
} from "../../api/chatAPI";
import "../../style/chat/floating-chat-widget.css";

/**
 * FloatingChatWidget - hình tròn góc dưới bên phải (xuất hiện khi đã đăng nhập).
 * - Tab chat theo khóa: học viên = khóa còn hạn; giảng viên = khóa được phân công.
 * - Khi đăng nhập — hiện button tròn; khi hết hạn khóa — tab đó biến mất.
 */
function FloatingChatWidget() {
  const { user, isAuthenticated } = useUser();
  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [onlineUsers, setOnlineUsers] = useState({});
  const scrollRef = useRef(null);

  // ===== Load danh sách phòng chat =====
  const loadRooms = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await getChatRoomsApi();
      const data = res?.data ?? res ?? [];
      setRooms(Array.isArray(data) ? data : []);
    } catch {
      setRooms([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && user && !open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadRooms();
    }
  }, [isAuthenticated, user, open, loadRooms]);

  // ===== Load tin nhắn khi chọn phòng =====
  const loadMessages = useCallback(async (roomId) => {
    setLoading(true);
    setError("");
    try {
      const res = await getChatMessagesApi(roomId, 1, 100);
      const data = res?.data ?? res ?? {};
      setMessages(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setError(e.message || "Không thể tải tin nhắn.");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectRoom = useCallback(
    (room) => {
      setActiveRoom(room);
      setMessages([]);
      loadMessages(room.id);
    },
    [loadMessages]
  );

  // ===== WebSocket realtime cho phòng đang mở =====
  const handleNewMessage = useCallback((msg) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  }, []);

  const handlePresence = useCallback((uid, online) => {
    setOnlineUsers((prev) => ({ ...prev, [uid]: online }));
  }, []);

  const { sendMessage: wsSend } = useChatSocket({
    courseId: activeRoom?.course_id,
    onNewMessage: handleNewMessage,
    onPresence: handlePresence,
  });

  // ===== Voice message  =====
  const { isRecording, recordingTime, uploading, toggleRecording } = useVoiceRecorder({
    roomId: activeRoom?.id,
    onVoiceSent: handleNewMessage,
    onError: (msg) => toast.error(msg),
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ===== Gửi tin nhắn =====
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !activeRoom) return;
    setSending(true);
    setError("");
    try {
      // Gửi qua WebSocket (lưu DB trước — backend tự broadcast)
      await wsSend(text);
      setInput("");
    } catch {
      // Fallback REST nếu WS chưa kết nối
      try {
        const res = await sendChatMessageApi(activeRoom.id, text);
        const msg = res?.data ?? res;
        if (msg) setMessages((prev) => [...prev, msg]);
        setInput("");
      } catch (err) {
        setError(err.message || "Không thể gửi tin nhắn.");
      }
    } finally {
      setSending(false);
    }
  }, [input, activeRoom, wsSend]);

  // ===== Báo cáo vi phạm =====
  const handleReport = useCallback(
    async (msg) => {
      const reason = window.prompt("Lý do báo cáo tin nhắn này:");
      if (!reason) return;
      try {
        await reportChatMessageApi(msg.id, reason);
        window.alert("Đã gửi báo cáo vi phạm.");
      } catch (e) {
        window.alert(e.message || "Không thể báo cáo.");
      }
    },
    []
  );

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next) loadRooms();
      return next;
    });
  }, [loadRooms]);

  if (!isAuthenticated) return null;

  return (
    <div className="fcw-container">
      {/* Button tròn góc dưới phải */}
      <button
        className="fcw-fab"
        onClick={handleToggle}
        aria-label="Chat hỗ trợ"
      >
        <i className={`bi ${open ? "bi-x-lg" : "bi-chat-dots-fill"}`}></i>
      </button>

      {/* Panel chat */}
      {open && (
        <div className="fcw-panel">
          <div className="fcw-header">
            <span>Chat</span>
          </div>

          <div className="fcw-body">
            {!activeRoom && (
              rooms.length === 0 ? (
                <div className="fcw-empty">Chưa có khóa học để chat. Hãy mua khóa để tham gia.</div>
              ) : (
                <div className="fcw-rooms">
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      className="fcw-room"
                      onClick={() => handleSelectRoom(room)}
                    >
                      <i className="bi bi-book me-1"></i>
                      {room.course_title}
                    </button>
                  ))}
                </div>
              )
            )}

            {activeRoom && (
              <div className="fcw-chat-area">
                <div className="fcw-chat-title">
                  <button
                    className="fcw-back-btn"
                    onClick={() => setActiveRoom(null)}
                    title="Thoát phòng chat"
                  >
                    <i className="bi bi-arrow-left"></i>
                  </button>
                  <i className="bi bi-chat-dots me-1"></i>
                  <span className="fcw-chat-title-text">{activeRoom.course_title}</span>
                </div>
                {error && <div className="fcw-error">{error}</div>}
                <div className="fcw-messages" ref={scrollRef}>
                  {loading ? (
                    <div className="fcw-loading">Đang tải tin nhắn...</div>
                  ) : messages.length === 0 ? (
                    <div className="fcw-empty">Chưa có tin nhắn.</div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`fcw-msg ${isMine ? "mine" : ""}`}>
                          <div className="fcw-msg-top">
                            <strong>
                              {msg.sender_name}
                              {onlineUsers[msg.sender_id] && (
                                <span className="fcw-online-dot" title="Online"></span>
                              )}
                            </strong>
                            {!isMine && (
                              <button
                                className="fcw-report-btn"
                                title="Báo cáo vi phạm"
                                onClick={() => handleReport(msg)}
                              >
                                <i className="bi bi-flag"></i>
                              </button>
                            )}
                          </div>
                          <div className="fcw-msg-content">
                            {msg.message_type === "VOICE" ? (
                              <audio controls src={msg.audio_url} className="fcw-audio" />
                            ) : (
                              msg.content
                            )}
                          </div>
                          <div className="fcw-msg-time">
                            {msg.sent_at ? new Date(msg.sent_at).toLocaleTimeString("vi-VN") : ""}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="fcw-input-row">
                  <input
                    type="text"
                    className="fcw-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder={
                      isRecording
                        ? `Đang ghi âm... ${recordingTime}s / 300s`
                        : uploading
                        ? "Đang tải voice lên..."
                        : "Nhập tin nhắn... (tối đa 1000 ký tự)"
                    }
                    maxLength={1000}
                    disabled={sending || isRecording || uploading}
                  />
                  <button
                    className="fcw-mic-btn"
                    onClick={toggleRecording}
                    disabled={sending || uploading}
                    title={isRecording ? "Dừng ghi âm" : "Ghi âm giọng nói"}
                  >
                    <i className={`bi ${isRecording ? "bi-stop-fill fcw-mic-recording" : "bi-mic-fill"}`}></i>
                  </button>
                  <button
                    className="fcw-send-btn"
                    onClick={handleSend}
                    disabled={sending || !input.trim() || isRecording || uploading}
                  >
                    <i className="bi bi-send"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FloatingChatWidget;