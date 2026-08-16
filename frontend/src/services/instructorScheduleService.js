import { getMySchedulesApi, getMyAttendanceApi, checkInDutyApi, checkOutDutyApi } from "../api/dutiesAPI";

const toList = (d) => (Array.isArray(d) ? d : d?.data ?? d?.results ?? []);

export async function loadMySchedules() {
  return toList(await getMySchedulesApi());
}

export async function loadMyAttendance() {
  return toList(await getMyAttendanceApi());
}

export const getActiveAttendanceLog = (attendance) => attendance.find((l) => !l.logout_at) || null;

export async function startDuty(scheduleId) {
  await checkInDutyApi(scheduleId);
}

export async function endDuty(scheduleId) {
  const res = await checkOutDutyApi(scheduleId);
  return res?.data ?? res ?? {};
}
