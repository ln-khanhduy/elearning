import { useState, useRef, useCallback, useEffect } from "react";
import {
  getVoiceUploadSignatureApi,
  confirmVoiceMessageApi,
} from "../../api/chatAPI";

const CLOUDINARY_UPLOAD_URL = (cloudName) =>
  `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`;

/**
 * Hook ghi âm voice message.
 * Luồng: MediaRecorder ghi âm -> xin signed upload (Secret ở Backend)
 *         upload trực tiếp lên Cloudinary -> confirm -> tạo ChatMessage VOICE.
 *
 * Lỗi được báo qua `onError(message)` thay vì `window.alert` để giao diện hiển thị toast.
 */
export function useVoiceRecorder({ roomId, onVoiceSent, onError }) {
  const [isRecording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  // Theo dõi thời gian ghi âm thực tế bằng ref — tránh stale closure trong onstop
  const recordingTimeRef = useRef(0);
  // MIME type được dùng lúc bắt đầu — dùng lại trong onstop
  const mimeTypeRef = useRef("audio/webm");

  const MAX_DURATION_SEC = 300; // 5 phút

  const notifyError = useCallback(
    (message) => {
      if (onError) onError(message);
    },
    [onError]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    recordingTimeRef.current = 0;
    setRecordingTime(0);
  }, []);

  const startRecording = useCallback(async () => {
    if (!roomId) return;
    // Chống khởi tạo nhiều recorder cùng lúc
    const existing = mediaRecorderRef.current;
    if (existing && existing.state !== "inactive") {
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      notifyError("Trình duyệt không hỗ trợ ghi âm.");
      return;
    }

    let stream;
    let recorder;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      recorder = new MediaRecorder(stream, { mimeType });
      mimeTypeRef.current = mimeType;
      chunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        resetTimer();
        setRecording(false);

        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
        chunksRef.current = [];
        if (blob.size === 0) return;

        setUploading(true);
        try {
          // 1. Xin signed upload từ Backend (Secret giữ Backend)
          const sigRes = await getVoiceUploadSignatureApi(roomId);
          const sig = sigRes?.data ?? sigRes ?? {};

          // 2. Upload trực tiếp lên Cloudinary
          const form = new FormData();
          form.append("file", blob);
          form.append("cloud_name", sig.cloud_name);
          form.append("api_key", sig.api_key);
          form.append("timestamp", sig.timestamp);
          form.append("signature", sig.signature);
          form.append("folder", sig.folder || "voice");
          form.append("resource_type", sig.resource_type || "raw");

          const uploadRes = await fetch(
            CLOUDINARY_UPLOAD_URL(sig.cloud_name),
            { method: "POST", body: form }
          );
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok || !uploadData.secure_url) {
            throw new Error(uploadData.error?.message || "Upload voice thất bại.");
          }

          // 3. Confirm tạo ChatMessage VOICE (backend kiểm tra quyền)
          const duration = Math.max(1, Math.round(recordingTimeRef.current || 1));
          const confirmData = {
            audio_url: uploadData.secure_url,
            duration,
            audio_format: mimeTypeRef.current.split("/")[1] || "webm",
          };
          const confirmRes = await confirmVoiceMessageApi(roomId, confirmData);
          const msg = confirmRes?.data ?? confirmRes;
          if (msg && onVoiceSent) onVoiceSent(msg);
        } catch (err) {
          notifyError(err.message || "Không thể gửi tin nhắn thoại.");
        } finally {
          setUploading(false);
        }
      };

      recorder.start();
      setRecording(true);
      recordingTimeRef.current = 0;
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime(recordingTimeRef.current);
        if (recordingTimeRef.current >= MAX_DURATION_SEC && recorder.state !== "inactive") {
          recorder.stop();
        }
      }, 1000);
    } catch {
      // Dọn stream nếu khởi tạo recorder lỗi (vd: mic đã được cấp nhưng recorder lỗi)
      if (stream) stream.getTracks().forEach((t) => t.stop());
      notifyError("Không thể truy cập microphone.");
    }
  }, [roomId, onVoiceSent, resetTimer, notifyError]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    recordingTime,
    uploading,
    toggleRecording,
  };
}