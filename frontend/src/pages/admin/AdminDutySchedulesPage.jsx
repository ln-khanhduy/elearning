import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
  SHIFTS, STATUS, WEEKDAYS, DEFAULT_MAX_DUTY_MINUTES, startOfWeek, addDays, toDateKey,
  fmtDay, fmtFull, fmtTime, computeEndTime, parseFromKey,
} from "../../utils/dutySchedule";
import {
  loadInstructors, loadSchedules, loadMissingHours, loadDutyConfig, saveSchedule,
  deleteSchedule, getMissingMinutes, makeupEndTime, notifyError,
} from "../../services/dutyScheduleService";
import "../../style/admin/duty-schedules.css";

function AdminDutySchedulesPage() {
  const [instructors, setInstructors] = useState([]);
  const [instructorsLoading, setInstructorsLoading] = useState(true);
  const [instructorId, setInstructorId] = useState("");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ date: "", start_time: "", end_time: "" });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [missingHours, setMissingHours] = useState([]);
  const [missingLoading, setMissingLoading] = useState(false);
  const [maxDuration, setMaxDuration] = useState(DEFAULT_MAX_DUTY_MINUTES);
  const [graceMinutes, setGraceMinutes] = useState(15);
  const [maxSmallShifts, setMaxSmallShifts] = useState(2);
  const [maxHoursPerDay, setMaxHoursPerDay] = useState(8);

  // Load cấu hình ca trực từ DB (settings super-admin)
  useEffect(() => {
    loadDutyConfig().then((cfg) => {
      setMaxDuration(cfg.maxDuration);
      setGraceMinutes(cfg.graceMinutes);
      setMaxSmallShifts(cfg.maxSmallShiftsPerBigShift);
      setMaxHoursPerDay(cfg.maxHoursPerDay);
    });
  }, []);

  const weekDays = useMemo(() => [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(weekStart, i)), [weekStart]);
  const weekRange = `${fmtFull(weekStart)} – ${fmtFull(addDays(weekStart, 6))}`;
  const currentShift = modal ? SHIFTS.find((x) => x.value === modal.shift) : null;

  // Load danh sách giảng viên
  useEffect(() => {
    loadInstructors()
      .then(setInstructors)
      .catch(() => toast.error("Không thể tải danh sách giảng viên."))
      .finally(() => setInstructorsLoading(false));
  }, []);

  // Load lịch trực theo giảng viên + tuần
  const fetchSchedules = useCallback(async () => {
    if (!instructorId) {
      setSchedules([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await loadSchedules({ instructorId, weekStart });
      setSchedules(data);
    } catch {
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [instructorId, weekStart]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSchedules();
  }, [fetchSchedules]);

  // Load danh sách ca thiếu giờ chưa bù của giảng viên đang chọn
  const fetchMissingHours = useCallback(async () => {
    if (!instructorId) {
      setMissingHours([]);
      return;
    }
    setMissingLoading(true);
    try {
      const data = await loadMissingHours(instructorId);
      setMissingHours(data);
    } catch {
      setMissingHours([]);
    } finally {
      setMissingLoading(false);
    }
  }, [instructorId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMissingHours();
  }, [fetchMissingHours]);

  const getCellSchedules = (dateKey, shift) => schedules.filter((s) => String(s.date) === dateKey && s.shift === shift);

  const openCreate = (dateKey, shift) => {
    const sh = SHIFTS.find((x) => x.value === shift);
    setModal({ type: "create", dateKey, shift });
    setForm({ date: dateKey, start_time: sh?.start || "07:00", end_time: sh ? computeEndTime(sh.start, maxDuration) : "09:00" });
  };

  // Tạo ca bù cho ca thiếu giờ: thời lượng = đúng số phút thiếu của ca gốc
  const openMakeup = (log) => {
    const sh = SHIFTS[0];
    const missingMinutes = getMissingMinutes(log);
    const todayKey = toDateKey(new Date());
    setModal({ type: "create", dateKey: todayKey, shift: sh.value, makeupForId: log.schedule_id, missingMinutes });
    setForm({ date: todayKey, start_time: sh?.start || "07:00", end_time: makeupEndTime(missingMinutes, sh?.start) });
    toast.info(`Ca bù sẽ có thời lượng ${missingMinutes} phút. Vui lòng chọn ngày làm ca bù.`);
  };

  const openEdit = (schedule) => {
    setModal({ type: "edit", dateKey: String(schedule.date), shift: schedule.shift, schedule });
    setForm({ date: String(schedule.date), start_time: fmtTime(schedule.start_time), end_time: computeEndTime(schedule.start_time, schedule.duration_minutes) });
  };

  const handleSave = async () => {
    if (!modal || !instructorId) return;
    if (!form.date) {
      toast.error("Vui lòng chọn ngày.");
      return;
    }
    // Ngày thực tế lấy từ form (người dùng có thể chọn ngày khi tạo ca bù)
    const dateKey = form.date;
    // Khi sửa: loại bỏ chính ca đang sửa khỏi danh sách tính tổng giờ trong ngày
    const existing = modal.type === "edit"
      ? schedules.filter((s) => String(s.date) === String(dateKey) && s.id !== modal.schedule.id)
      : schedules.filter((s) => String(s.date) === String(dateKey));
    setSaving(true);
    try {
      toast.success(await saveSchedule({ type: modal.type, instructorId, form, modal: { ...modal, dateKey }, maxDuration, maxHoursPerDay, existingSchedules: existing }));
      setModal(null);
      refreshAll();
    } catch (e) { notifyError(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!modal?.schedule) return;
    setSaving(true);
    try {
      await deleteSchedule(modal.schedule.id);
      toast.success("Đã xóa ca trực.");
      setConfirmDelete(false);
      setModal(null);
      refreshAll();
    } catch (e) {
      notifyError(e);
    } finally {
      setSaving(false);
    }
  };

  const refreshAll = () => { fetchSchedules(); fetchMissingHours(); };

  const isToday = (d) => toDateKey(d) === toDateKey(new Date());

  return (
    <div className="duty-admin-page">
      <h4 className="mb-3"><i className="bi bi-calendar-week me-2"></i>Lịch trực giảng viên</h4>

      <div className="duty-toolbar">
        <div className="duty-instructor-select">
          <label className="duty-label">Giảng viên</label>
          <select className="form-select" value={instructorId} onChange={(e) => setInstructorId(e.target.value)} disabled={instructorsLoading}>
            <option value="">{instructorsLoading ? "Đang tải giảng viên..." : "Chọn giảng viên..."}</option>
            {instructors.map((i) => <option key={i.id} value={i.id}>{i.full_name || i.username || i.email}</option>)}
          </select>
        </div>
        <div className="duty-week-nav">
          <button type="button" className="duty-nav-btn" onClick={() => setWeekStart((w) => addDays(w, -7))}><i className="bi bi-chevron-left"></i> Tuần trước</button>
          <span className="duty-week-range"><i className="bi bi-calendar-range me-1"></i>{weekRange}</span>
          <button type="button" className="duty-nav-btn" onClick={() => setWeekStart((w) => addDays(w, 7))}>Tuần sau <i className="bi bi-chevron-right"></i></button>
          <button type="button" className="duty-today-btn" onClick={() => setWeekStart(startOfWeek(new Date()))}><i className="bi bi-dot me-1"></i>Tuần này</button>
        </div>
      </div>

      {!instructorId && (
        <div className="duty-empty-hint"><i className="bi bi-person-plus"></i><span>Vui lòng chọn giảng viên để xem lịch trực.</span></div>
      )}

      {instructorId && (
        <div className="duty-calendar">
          <div className="duty-missing-panel mb-3">
            <div className="duty-missing-header"><i className="bi bi-exclamation-triangle me-1"></i>Ca thiếu giờ cần bù (tháng hiện tại)</div>
            {missingLoading ? (
              <div className="text-muted small p-2">Đang tải...</div>
            ) : missingHours.length === 0 ? (
              <div className="text-muted small p-2">Không có ca thiếu giờ ({">="} {graceMinutes} phút) chưa được bù.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-bordered align-middle mb-0">
                  <thead className="table-light">
                    <tr><th>Ngày</th><th>Đăng nhập</th><th>Đăng xuất</th><th>Trực (phút)</th><th>Thiếu (phút)</th><th>Thao tác</th></tr>
                  </thead>
                  <tbody>
                    {missingHours.map((log) => (
                      <tr key={log.id}>
                        <td>{log.login_at ? new Date(log.login_at).toLocaleDateString("vi-VN") : "—"}</td>
                        <td>{log.login_at ? new Date(log.login_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                        <td>{log.logout_at ? new Date(log.logout_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                        <td>{log.counted_minutes}</td>
                        <td className="text-danger fw-bold">{log.missing_minutes}</td>
                        <td><button className="btn btn-sm btn-outline-primary" onClick={() => openMakeup(log)}><i className="bi bi-plus-circle me-1"></i>Tạo ca bù ({log.missing_minutes} phút)</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
                const canAdd = cellScheds.length < maxSmallShifts;
                return (
                  <div key={dateKey} className={`duty-cell-wrap ${isToday(d) ? "today" : ""}`}>
                    {loading ? (
                      <div className="duty-cell duty-cell-loading"><div className="spinner-border spinner-border-sm" role="status"></div></div>
                    ) : (
                      <div className="duty-cell">
                        {cellScheds.map((sched) => (
                          <div
                            key={sched.id}
                            className={`duty-mini-card ${STATUS[sched.status]?.cls || "scheduled"}`}
                            onClick={() => openEdit(sched)}
                            title={`${sched.instructor_name}: ${fmtTime(sched.start_time)} – ${computeEndTime(sched.start_time, sched.duration_minutes)}`}
                          >
                            <span className="duty-cell-time">{fmtTime(sched.start_time)} – {computeEndTime(sched.start_time, sched.duration_minutes)}</span>
                          </div>
                        ))}
                        {canAdd && <div className="duty-cell-empty" onClick={() => openCreate(dateKey, sh.value)} title={cellScheds.length === 0 ? "Thêm ca trực" : `Thêm ca nhỏ thứ ${maxSmallShifts}`}><i className="bi bi-plus-lg"></i></div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="duty-modal-overlay" onClick={() => setModal(null)}>
          <div className="duty-modal" onClick={(e) => e.stopPropagation()}>
            <h5 className="duty-modal-title"><i className={`bi ${currentShift?.icon || "bi-calendar"} me-2`}></i>{modal.type === "create" ? "Thêm ca trực" : "Cập nhật ca trực"}</h5>
            <div className="duty-modal-info">
              <div className="duty-info-row"><span className="duty-info-label">Giảng viên:</span><span className="duty-info-value">{instructors.find((i) => String(i.id) === String(instructorId))?.full_name || instructors.find((i) => String(i.id) === String(instructorId))?.email || "—"}</span></div>
              <div className="duty-info-row"><span className="duty-info-label">Ngày:</span><span className="duty-info-value">{form.date ? fmtFull(parseFromKey(form.date)) : "Chưa chọn"}</span></div>
              <div className="duty-info-row"><span className="duty-info-label">Ca:</span><span className="duty-info-value">{currentShift?.label || modal.shift}</span></div>
              {modal.type === "edit" && <div className="duty-info-row"><span className="duty-info-label">Trạng thái:</span><span className="duty-info-value">{STATUS[modal.schedule.status]?.label || modal.schedule.status}</span></div>}
            </div>

            <div className="duty-modal-form">
              <div className="duty-form-hint">
                <i className="bi bi-info-circle me-1"></i>
                Khung giờ: {currentShift?.start} – {currentShift?.end} • Tối đa {maxDuration / 60} tiếng/ca
                {modal.makeupForId && modal.missingMinutes ? ` • Ca bù: ${modal.missingMinutes} phút` : ""}
              </div>
              <div className="duty-form-group">
                <label className="duty-form-label">{modal.type === "create" ? "Ngày làm ca" : "Ngày (không thể thay đổi)"}</label>
                <input type="date" className="form-control" value={form.date} disabled={modal.type === "edit"} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="duty-form-group">
                <label className="duty-form-label">Giờ bắt đầu</label>
                <input type="time" className="form-control" value={form.start_time} min={currentShift?.start} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div className="duty-form-group">
                <label className="duty-form-label">Giờ kết thúc</label>
                <input type="time" className="form-control" value={form.end_time} max={currentShift?.end} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>

            <div className="duty-modal-actions">
              {modal.type === "edit" && <button type="button" className="duty-btn duty-btn-danger" onClick={() => setConfirmDelete(true)} disabled={saving}><i className="bi bi-trash"></i> Xóa</button>}
              <button type="button" className="duty-btn duty-btn-secondary" onClick={() => setModal(null)} disabled={saving}>Hủy</button>
              <button type="button" className="duty-btn duty-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm"></span> Đang lưu...</> : <><i className="bi bi-check-lg"></i> Lưu</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa ca trực */}
      <ConfirmModal
        show={confirmDelete}
        title="Xóa ca trực"
        message="Bạn có chắc chắn muốn xóa ca trực này?"
        variant="danger"
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

export default AdminDutySchedulesPage;