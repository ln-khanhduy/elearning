// ==================== CẤU HÌNH CA TRỰC ====================

export const SHIFTS = [
  { value: "SANG", label: "Ca sáng", icon: "bi-sunrise", start: "07:00", end: "11:30" },
  { value: "CHIEU", label: "Ca chiều", icon: "bi-sun", start: "13:00", end: "17:30" },
  { value: "TOI", label: "Ca tối", icon: "bi-moon-stars", start: "19:00", end: "23:30" },
];

export const DEFAULT_MAX_DUTY_MINUTES = 120;

export const STATUS = {
  SCHEDULED: { label: "Đã sắp lịch", cls: "scheduled" },
  DONE: { label: "Hoàn thành", cls: "done" },
};

export const WEEKDAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

// ==================== DATE HELPERS ====================

const pad = (n) => String(n).padStart(2, "0");

export const toDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const startOfWeek = (d) => {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday=0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const fmtDay = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
export const fmtFull = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

export const fmtTime = (t) => {
  if (!t) return "--:--";
  return String(t).slice(0, 5);
};

export function parseFromKey(key) {
  const [y, m, d] = String(key).split("-").map(Number);
  return new Date(y, m - 1, d);
}

// ==================== TIME HELPERS ====================

export const computeEndTime = (startStr, durMin) => {
  if (!startStr) return "--:--";
  const [h, m] = String(startStr).slice(0, 5).split(":").map((x) => Number(x) || 0);
  const total = h * 60 + m + (Number(durMin) || 0);
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
};

export const timeToMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = String(t).slice(0, 5).split(":").map((x) => Number(x) || 0);
  return h * 60 + m;
};

// ==================== VALIDATE ====================

// Kiểm tra ca trực hợp lệ: nằm trong khung giờ ca + tối đa maxDuration phút
export const validateShiftTime = (shift, start, end, maxDuration = DEFAULT_MAX_DUTY_MINUTES) => {
  const sh = SHIFTS.find((x) => x.value === shift);
  if (!sh) return "Ca không hợp lệ.";
  if (!start || !end) return "Vui lòng nhập giờ bắt đầu và giờ kết thúc.";

  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  const shiftStartMin = timeToMinutes(sh.start);
  const shiftEndMin = timeToMinutes(sh.end);

  if (startMin < shiftStartMin)
    return `Giờ bắt đầu phải từ ${sh.start} trở đi trong ca ${sh.label}.`;
  if (endMin > shiftEndMin)
    return `Giờ kết thúc phải trước hoặc bằng ${sh.end} trong ca ${sh.label}.`;
  if (startMin >= endMin) return "Giờ kết thúc phải sau giờ bắt đầu.";
  if (endMin - startMin > maxDuration)
    return `Mỗi ca trực tối đa ${maxDuration / 60} tiếng (${maxDuration} phút).`;
  return "";
};
