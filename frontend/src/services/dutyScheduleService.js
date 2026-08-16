import { toast } from "react-toastify";
import {
  getDutySchedulesApi,
  getInstructorMissingHoursApi,
  createDutyScheduleApi,
  updateDutyScheduleApi,
  cancelDutyScheduleApi,
} from "../api/dutiesAPI";
import { getManagedInstructorsApi } from "../api/instructorManagerAPI";
import { getSystemConfigsApi } from "../api/systemAPI";
import { toDateKey, addDays, timeToMinutes, validateShiftTime, computeEndTime, DEFAULT_MAX_DUTY_MINUTES } from "../utils/dutySchedule";

// ==================== TẢI DỮ LIỆU ====================

const toList = (data) => {
  if (Array.isArray(data)) return data;
  const d = data?.data ?? data ?? {};
  return Array.isArray(d) ? d : d?.results ?? [];
};

export async function loadInstructors() {
  return toList(await getManagedInstructorsApi({ page_size: 100 }));
}

export async function loadSchedules({ instructorId, weekStart }) {
  return toList(
    await getDutySchedulesApi({
      instructor_id: instructorId,
      date_from: toDateKey(weekStart),
      date_to: toDateKey(addDays(weekStart, 6)),
    })
  );
}

export async function loadMissingHours(instructorId) {
  return toList(
    await getInstructorMissingHoursApi(instructorId, new Date().toISOString().slice(0, 7))
  );
}

// Lấy cấu hình ca trực từ DB (settings super-admin)
export async function loadDutyConfig() {
  try {
    const res = await getSystemConfigsApi();
    const data = Array.isArray(res) ? {} : res?.data ?? res ?? {};
    const maxDuration = Number(data?.duty_min_duration_minutes?.value) || DEFAULT_MAX_DUTY_MINUTES;
    const graceMinutes = Number(data?.duty_grace_minutes?.value) || 15;
    const maxSmallShiftsPerBigShift = Number(data?.duty_max_small_shifts_per_big_shift?.value) || 2;
    const maxHoursPerDay = Number(data?.duty_max_hours_per_day?.value) || 8;
    return { maxDuration, graceMinutes, maxSmallShiftsPerBigShift, maxHoursPerDay };
  } catch {
    return { maxDuration: DEFAULT_MAX_DUTY_MINUTES, graceMinutes: 15, maxSmallShiftsPerBigShift: 2, maxHoursPerDay: 8 };
  }
}

// ==================== CRUD CA TRỰC ====================

export async function saveSchedule({
  type, instructorId, form, modal,
  maxDuration = DEFAULT_MAX_DUTY_MINUTES,
  maxHoursPerDay = 8,
  existingSchedules = [],
}) {
  const isMakeup = Boolean(modal.makeupForId && modal.missingMinutes);

  // Validate trước khi gọi API
  const endForValidate = isMakeup
    ? computeEndTime(form.start_time, modal.missingMinutes)
    : form.end_time;
  const err = validateShiftTime(modal.shift, form.start_time, endForValidate, maxDuration);
  if (err) throw new Error(err);

  // Validate tổng thời lượng trong ngày <= maxHoursPerDay
  const newDuration = timeToMinutes(!isMakeup ? form.end_time : endForValidate) - timeToMinutes(form.start_time);
  const sameDay = existingSchedules.filter((s) => String(s.date) === String(modal.dateKey));
  const totalMinutes = sameDay.reduce((sum, s) => sum + (Number(s.duration_minutes) || 0), 0) + newDuration;
  if (totalMinutes > maxHoursPerDay * 60) {
    throw new Error(`Tổng thời lượng trực trong ngày tối đa ${maxHoursPerDay} giờ (hiện tại ${Math.floor(totalMinutes / 60)}h${totalMinutes % 60}p).`);
  }

  if (type === "create") {
    await createDutyScheduleApi({
      instructor_id: instructorId,
      date: form.date || modal.dateKey,
      shift: modal.shift,
      start_time: form.start_time,
      end_time: form.end_time,
      makeup_for_id: modal.makeupForId || undefined,
    });
    return modal.makeupForId ? "Đã tạo ca bù." : "Đã thêm ca trực.";
  }

  await updateDutyScheduleApi(modal.schedule.id, {
    start_time: form.start_time,
    end_time: form.end_time,
  });
  return "Đã cập nhật ca trực.";
}

export async function deleteSchedule(scheduleId) {
  await cancelDutyScheduleApi(scheduleId);
}

// ==================== HELPERS ====================

export const getMissingMinutes = (log) => Number(log?.missing_minutes) || 0;

export const makeupEndTime = (missingMinutes, shiftStart = "07:00") =>
  computeEndTime(shiftStart, missingMinutes);

export const notifyError = (e) => toast.error(e.message || "Có lỗi xảy ra.");