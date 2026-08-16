import { useState } from "react";
import { DutyContext } from "./useDuty";

/**
 * Provider toàn cục cho ca trực đang chạy (check-in).
 * - activeLog: log chấm công hiện tại (login_at, schedule_id)
 * - activeSchedule: ca trực đang trực
 * - setActiveDuty / clearActiveDuty: cập nhật từ bất kỳ trang nào
 */
export function DutyProvider({ children }) {
  const [activeLog, setActiveLog] = useState(null);
  const [activeSchedule, setActiveSchedule] = useState(null);

  const setActiveDuty = (log, schedule) => {
    setActiveLog(log);
    setActiveSchedule(schedule);
  };

  const clearActiveDuty = () => {
    setActiveLog(null);
    setActiveSchedule(null);
  };

  return (
    <DutyContext.Provider value={{ activeLog, activeSchedule, setActiveDuty, clearActiveDuty }}>
      {children}
    </DutyContext.Provider>
  );
}