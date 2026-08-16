import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { useDuty } from "../../context/useDuty";
import {
  SHIFTS, STATUS, WEEKDAYS, startOfWeek, addDays, toDateKey, fmtDay, fmtFull, fmtTime, computeEndTime,
} from "../../utils/dutySchedule";
import {
  loadMySchedules, loadMyAttendance, getActiveAttendanceLog, startDuty, endDuty,
} from "../../services/instructorScheduleService";
import "../../style/admin/duty-schedules.css";

function InstructorMySchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selected, setSelected] = useState(null); // ca được bấm để check-in/out
  const [busy, setBusy] = useState(false);
  const { setActiveDuty, clearActiveDuty } = useDuty();

  const weekDays = useMemo(() => [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(weekStart, i)), [weekStart]);
  const weekRange = `${fmtFull(weekStart)} – ${fmtFull(addDays(weekStart, 6))}`;

  // Ca đang trực = log chấm công có logout_at null
  const activeLog = getActiveAttendanceLog(attendance);
  const activeSched = activeLog ? schedules.find((s) => String(s.id) === String(activeLog.schedule_id)) : null;

  const load = useCallback(async () => {
    try {
      const [sch, att] = await Promise.all([loadMySchedules(), loadMyAttendance()]);
      setSchedules(sch);
      setAttendance(att);
      // Đồng bộ ca đang trực vào context global (bubble hiển thị ở mọi trang)
      const log = getActiveAttendanceLog(att);
      const sched = log ? sch.find((s) => String(s.id) === String(log.schedule_id)) : null;
      if (log && sched) setActiveDuty(log, sched);
      else clearActiveDuty();
    } catch {
      setSchedules([]);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  }, [setActiveDuty, clearActiveDuty]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const getCellSchedules = (dateKey, shift) => schedules.filter((s) => String(s.date) === dateKey && s.shift === shift);
  const isToday = (d) => toDateKey(d) === toDateKey(new Date());
  const isActive = (sched) => String(activeLog?.schedule_id) === String(sched.id);

  const handleCheckIn = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await startDuty(selected.id);
      toast.success("Đã bắt đầu ca trực — bong bóng đếm giờ đã xuất hiện.");
      setSelected(null);
      load();
    } catch (e) {
      toast.error(e.message || "Lỗi check-in.");
    } finally {
      setBusy(false);
    }
  };

  const handleCheckOut = async () => {
    const sched = selected || activeSched;
    if (!sched) return;
    setBusy(true);
    try {
      await endDuty(sched.id);
      clearActiveDuty();
      // Nếu trực thiếu giờ, backend đã gửi notification realtime (không cần toastify)
      toast.success("Đã kết thúc ca trực.");
      setSelected(null);
      load();
    } catch (e) {
      toast.error(e.message || "Lỗi check-out.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="duty-admin-page">
      <h4 className="mb-3"><i className="bi bi-calendar-week me-2"></i>Lịch trực của tôi</h4>

      {/* Toolbar: điều hướng tuần */}
      <div className="duty-toolbar">
        <div className="duty-week-nav">
          <button type="button" className="duty-nav-btn" onClick={() => setWeekStart((w) => addDays(w, -7))}><i className="bi bi-chevron-left"></i> Tuần trước</button>
          <span className="duty-week-range"><i className="bi bi-calendar-range me-1"></i>{weekRange}</span>
          <button type="button" className="duty-nav-btn" onClick={() => setWeekStart((w) => addDays(w, 7))}>Tuần sau <i className="bi bi-chevron-right"></i></button>
          <button type="button" className="duty-today-btn" onClick={() => setWeekStart(startOfWeek(new Date()))}><i className="bi bi-dot me-1"></i>Tuần này</button>
        </div>
      </div>

      {loading ? (
        <div className="duty-empty-hint"><div className="spinner-border text-primary" role="status"></div></div>
      ) : (
        <div className="duty-calendar">
          <div className="duty-grid-header">
            <div className="duty-corner">Ca / Ngày</div>
            {weekDays.map((d, i) => (
              <div key={i} className={`duty-day-head ${isToday(d) ? "today" : ""}`}>
                <div className="duty-day-name">{WEEKDAYS[i]}</div>
                <div className="duty-day-date">{fmtDay(d)}</div>
              </div>
            ))}
          </div>

          {SHIFTS.map((sh) => (
            <div key={sh.value} className="duty-grid-row">
              <div className="duty-shift-label"><i className={`bi ${sh.icon}`}></i><span>{sh.label}</span></div>
              {weekDays.map((d) => {
                const dateKey = toDateKey(d);
                const cellScheds = getCellSchedules(dateKey, sh.value);
                return (
                  <div key={dateKey} className={`duty-cell-wrap ${isToday(d) ? "today" : ""}`}>
                    <div className="duty-cell">
                      {cellScheds.map((sched) => (
                        <div
                          key={sched.id}
                          className={`duty-mini-card ${STATUS[sched.status]?.cls || "scheduled"} ${isActive(sched) ? "active" : ""}`}
                          onClick={() => setSelected(sched)}
                          title={`${fmtTime(sched.start_time)} – ${computeEndTime(sched.start_time, sched.duration_minutes)} • Bấm để ${isActive(sched) ? "kết thúc ca" : "check-in"}`}
                        >
                          <span className="duty-cell-time">
                            {fmtTime(sched.start_time)} – {computeEndTime(sched.start_time, sched.duration_minutes)}
                            {isActive(sched) && <i className="bi bi-stopwatch ms-1"></i>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Modal check-in / check-out khi bấm ca */}
      {selected && (
        <div className="duty-modal-overlay" onClick={() => setSelected(null)}>
          <div className="duty-modal" onClick={(e) => e.stopPropagation()}>
            <h5 className="duty-modal-title"><i className="bi bi-calendar-event me-2"></i>{isActive(selected) ? "Kết thúc ca trực" : "Bắt đầu ca trực"}</h5>
            <div className="duty-modal-info">
              <div className="duty-info-row"><span className="duty-info-label">Ca:</span><span className="duty-info-value">{SHIFTS.find((x) => x.value === selected.shift)?.label || selected.shift}</span></div>
              <div className="duty-info-row"><span className="duty-info-label">Thời gian:</span><span className="duty-info-value">{selected.date} · {fmtTime(selected.start_time)} – {computeEndTime(selected.start_time, selected.duration_minutes)}</span></div>
              <div className="duty-info-row"><span className="duty-info-label">Thời lượng:</span><span className="duty-info-value">{selected.duration_minutes} phút</span></div>
            </div>
            <div className="duty-modal-actions">
              <button type="button" className="duty-btn duty-btn-secondary" onClick={() => setSelected(null)} disabled={busy}>Hủy</button>
              {isActive(selected) ? (
                <button type="button" className="duty-btn duty-btn-danger" onClick={handleCheckOut} disabled={busy}>
                  <i className="bi bi-box-arrow-right me-1"></i>{busy ? "Đang xử lý..." : "Kết thúc ca"}
                </button>
              ) : (
                <button type="button" className="duty-btn duty-btn-primary" onClick={handleCheckIn} disabled={busy || !!activeLog}>
                  <i className="bi bi-box-arrow-in-right me-1"></i>{busy ? "Đang xử lý..." : "Check-in"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InstructorMySchedulesPage;