import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import DutyTimerBubble from "./DutyTimerBubble";
import { useDuty } from "../../context/useDuty";
import { useUser } from "../../context/UserContext";
import { loadMySchedules, loadMyAttendance, endDuty } from "../../services/instructorScheduleService";

/**
 * Bong bóng đếm giờ trực toàn cục — xuất hiện ở MỌI trang khi có ca đang trực,
 * giống FloatingChatWidget. Bấm để mở rộng thì có nút Kết thúc ca (check-out).
 */
export default function FloatingDutyWidget() {
  const { activeLog, activeSchedule, setActiveDuty, clearActiveDuty } = useDuty();
  const { isAuthenticated } = useUser();
  const [mini, setMini] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (!activeSchedule || checkingOut) return;
    setCheckingOut(true);
    try {
      await endDuty(activeSchedule.id);
      clearActiveDuty();
      toast.success("Đã kết thúc ca trực.");
    } catch (e) {
      toast.error(e.message || "Lỗi check-out.");
    } finally {
      setCheckingOut(false);
    }
  };

  // Tự tải ca đang trực khi mở bất kỳ trang nào (đã đăng nhập)
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const [sch, att] = await Promise.all([loadMySchedules(), loadMyAttendance()]);
        if (cancelled) return;
        const log = att.find((l) => !l.logout_at);
        const sched = log ? sch.find((s) => String(s.id) === String(log.schedule_id)) : null;
        if (log && sched) setActiveDuty(log, sched);
        else clearActiveDuty();
      } catch {
        // chưa đăng nhập hoặc lỗi mạng — bỏ qua
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, setActiveDuty, clearActiveDuty]);

  // Tự động check-out khi bộ đếm đủ duration (120p/2h).
  // Bộ đếm bắt đầu = max(giờ bắt đầu ca, thời điểm check-in).
  useEffect(() => {
    if (!activeLog || !activeSchedule) return;
    const loginMs = new Date(activeLog.login_at).getTime();

    // Giờ bắt đầu ca từ schedule.date + start_time (đảm bảo cùng ngày với ca)
    let schedStartMs = loginMs;
    if (activeSchedule.date && activeSchedule.start_time) {
      const [h, m] = String(activeSchedule.start_time).slice(0, 5).split(":").map((x) => Number(x) || 0);
      const base = new Date(`${activeSchedule.date}T00:00:00`);
      if (!Number.isNaN(base.getTime())) {
        schedStartMs = base.getTime() + h * 3600000 + m * 60000;
      }
    }

    const counterStartMs = Math.max(schedStartMs, loginMs);
    const dueMs = counterStartMs + Number(activeSchedule.duration_minutes) * 60000;
    const now = Date.now();
    if (dueMs <= now) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleCheckout();
      return;
    }
    const timer = setTimeout(() => {
      handleCheckout();
    }, dueMs - now);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLog?.id, activeSchedule?.id]);

  if (!activeLog || !activeSchedule) return null;

  return (
    <DutyTimerBubble
      schedule={activeSchedule}
      loginAt={activeLog.login_at}
      mini={mini}
      onToggleMini={() => setMini((v) => !v)}
      onCheckout={handleCheckout}
      disabled={checkingOut}
      compact={false}
    />
  );
}