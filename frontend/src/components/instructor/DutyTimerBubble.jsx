import { useEffect, useRef, useState } from "react";

/**
 * Bong bóng đếm giờ trực — hiển thị cố định, kéo thả được, hỗ trợ thu nhỏ.
 * Kéo được cả ở nút tròn (mini) lẫn bubble mở rộng.
 * Props:
 *  - schedule: ca đang trực (có start_time, duration_minutes)
 *  - loginAt: thời điểm check-in (ISO string)
 *  - mini: chế độ nút tròn thu gọn
 *  - onToggleMini: bấm để mở rộng / thu nhỏ
 *  - compact: ẩn nút check-out
 *  - onCheckout: callback khi bấm kết thúc ca
 *  - disabled: vô hiệu nút
 */
export default function DutyTimerBubble({ schedule, loginAt, mini, onToggleMini, compact, onCheckout, disabled }) {
  const [pos, setPos] = useState(() => ({ x: window.innerWidth - 190, y: window.innerHeight - 120 }));
  const [elapsed, setElapsed] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const movedRef = useRef(false);

  const startMs = loginAt ? new Date(loginAt).getTime() : now;
  const durationMin = Number(schedule?.duration_minutes) || 0;

  // Đếm thời gian đã trực (mỗi giây)
  useEffect(() => {
    const tick = () => {
      setNow(Date.now());
      setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [startMs]);

  // Kéo thả bong bóng (cả mini lẫn mở rộng); không kéo khi bấm nút
  const onPointerDown = (e) => {
    if (e.target.closest("button")) return;
    movedRef.current = false;
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = { ...pos };
    const w = mini ? 150 : 190;
    const h = mini ? 50 : 130;
    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) movedRef.current = true;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - w, orig.x + dx)),
        y: Math.max(0, Math.min(window.innerHeight - h, orig.y + dy)),
      });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      // Bấm (không kéo) khi đang thu nhỏ → mở rộng
      if (!movedRef.current && mini && onToggleMini) onToggleMini();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const fmt = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // Thời gian kết thúc ca
  const endMs = startMs + durationMin * 60 * 1000;
  const remaining = Math.max(0, Math.floor((endMs - now) / 1000));

  // Chế độ nút tròn thu gọn — kéo thả được
  if (mini) {
    return (
      <div
        className="duty-timer-mini"
        style={{ left: pos.x, top: pos.y, touchAction: "none" }}
        onPointerDown={onPointerDown}
        title={`Đã trực ${fmt(elapsed)}`}
      >
        <i className="bi bi-stopwatch-fill"></i>
        <span>{fmt(elapsed)}</span>
      </div>
    );
  }

  return (
    <div
      className="duty-timer-bubble"
      style={{ left: pos.x, top: pos.y, touchAction: "none" }}
      onPointerDown={onPointerDown}
    >
      <div className="duty-timer-bubble-header">
        <i className="bi bi-stopwatch me-1"></i>
        <span className="duty-timer-shift">{schedule ? `${schedule.shift} · ${schedule.start_time}` : "Ca trực"}</span>
        {onToggleMini && (
          <button type="button" className="duty-timer-minimize" onClick={onToggleMini} title="Thu nhỏ">
            <i className="bi bi-dash-lg"></i>
          </button>
        )}
      </div>
      <div className="duty-timer-elapsed">{fmt(elapsed)}</div>
      <div className="duty-timer-caption">Đã trực · còn {fmt(remaining)}</div>
      {!compact && (
        <button
          type="button"
          className="duty-btn duty-btn-primary duty-timer-checkout"
          onClick={onCheckout}
          disabled={disabled}
        >
          <i className="bi bi-box-arrow-right me-1"></i>Kết thúc ca
        </button>
      )}
    </div>
  );
}