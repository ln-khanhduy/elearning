import { useState, useEffect, useMemo } from "react";
import { getMyAttendanceApi, getMyPaymentsApi, getMyPaymentColumnsApi } from "../../api/dutiesAPI";

const ATT_STATUS = {
  OK: "Bình thường",
  LATE: "Đăng nhập trễ",
  EARLY_LEAVE: "Đăng xuất sớm",
  LATE_EARLY: "Đăng nhập trễ & đăng xuất sớm",
  NOT_IN_SCHEDULE: "Ngoài lịch trực",
};

const PAY_STATUS = {
  DRAFT: "Chưa chi trả",
  APPROVED: "Đã duyệt",
  PAID: "Đã chi trả",
  CANCELLED: "Đã hủy",
};

const PAY_STATUS_CLS = {
  DRAFT: "bg-secondary",
  APPROVED: "bg-primary",
  PAID: "bg-success",
  CANCELLED: "bg-danger",
};

// ==================== HELPERS ====================
const pad = (n) => String(n).padStart(2, "0");
const toDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toMonthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const parseKey = (k) => {
  const [y, m, d] = String(k).split("-").map(Number);
  return new Date(y, m - 1, d);
};
const startOfWeek = (d) => {
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  x.setHours(0, 0, 0, 0);
  return x;
};
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const fmtDay = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;

function InstructorMyCompensationPage() {
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc
  const [salaryYear, setSalaryYear] = useState(String(new Date().getFullYear()));
  const [attMode, setAttMode] = useState("month"); // "month" | "week"
  const [attMonth, setAttMonth] = useState(toMonthKey(new Date()));
  const [attWeekKey, setAttWeekKey] = useState(toDateKey(startOfWeek(new Date())));

  useEffect(() => {
    Promise.all([
      getMyAttendanceApi().catch(() => ({ data: [] })),
      getMyPaymentsApi().catch(() => ({ data: [] })),
      getMyPaymentColumnsApi().catch(() => ({ data: [] })),
    ])
      .then(([attRes, payRes, colRes]) => {
        const a = attRes?.data ?? attRes ?? [];
        const p = payRes?.data ?? payRes ?? [];
        const c = colRes?.data ?? colRes ?? [];
        setAttendance(Array.isArray(a) ? a : []);
        setPayments(Array.isArray(p) ? p : []);
        setColumns(Array.isArray(c) ? c : []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Danh sách năm lương
  const salaryYears = useMemo(() => {
    const set = new Set(payments.map((p) => String(p.month).slice(0, 4)).filter(Boolean));
    set.add(String(new Date().getFullYear()));
    return [...set].sort().reverse();
  }, [payments]);

  const filteredPayments = useMemo(
    () => payments.filter((p) => String(p.month).startsWith(salaryYear)),
    [payments, salaryYear]
  );

  const filteredAttendance = useMemo(() => {
    if (attMode === "month") {
      return attendance.filter((a) => {
        const d = a.login_at ? new Date(a.login_at) : null;
        return d && toMonthKey(d) === attMonth;
      });
    }
    const start = parseKey(attWeekKey);
    const end = addDays(start, 7);
    return attendance.filter((a) => {
      const d = a.login_at ? new Date(a.login_at) : null;
      return d && d >= start && d < end;
    });
  }, [attendance, attMode, attMonth, attWeekKey]);

  const fmt = (v) => (v ? new Date(v).toLocaleString("vi-VN") : "—");
  const fmtMoney = (v) => (Number(v) || 0).toLocaleString("vi-VN") + "đ";

  const weekLabel = (k) => {
    const start = parseKey(k);
    return `Tuần ${fmtDay(start)} - ${fmtDay(addDays(start, 6))}`;
  };

  if (loading) {
    return (
      <div className="comp-page">
        <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
      </div>
    );
  }

  return (
    <div className="comp-page">
      <h4 className="mb-3"><i className="bi bi-cash-stack me-2"></i>Chấm công & Lương của tôi</h4>

      {/* ===== Lương theo tháng ===== */}
      <div className="comp-card">
        <div className="comp-card-head">
          <div className="comp-card-title">
            <i className="bi bi-wallet2"></i>
            <span>Lương theo tháng</span>
            <span className="badge">{filteredPayments.length} tháng</span>
          </div>
          <div className="comp-filters">
            <i className="bi bi-funnel"></i>
            <select className="comp-filter-select" value={salaryYear} onChange={(e) => setSalaryYear(e.target.value)}>
              {salaryYears.map((y) => <option key={y} value={y}>Năm {y}</option>)}
            </select>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="comp-empty">Không có bảng lương trong năm {salaryYear}.</div>
        ) : (
          <div className="comp-table-scroll">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Lương tháng</th><th>Ngày kết toán</th><th>Giờ làm</th><th>Giờ thêm</th><th>Thành tiền</th>
                  {columns.map((c) => <th key={c.id} className={c.column_type === "BONUS" ? "text-success" : "text-danger"}>{c.name}</th>)}
                  <th>Thực nhận</th><th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => (
                  <tr key={p.id}>
                    <td className="fw-semibold">{p.month}</td>
                    <td>{p.settlement_date ? new Date(p.settlement_date).toLocaleDateString("vi-VN") : "—"}</td>
                    <td>{p.regular_hours}</td>
                    <td>{p.overtime_hours}</td>
                    <td className="comp-money">{fmtMoney(p.salary_amount)}</td>
                    {columns.map((c) => {
                      const v = (p.column_values || []).find((cv) => String(cv.column_id) === String(c.id));
                      const amount = v ? Number(v.amount) : 0;
                      return (
                        <td key={c.id} className={c.column_type === "BONUS" ? "text-success fw-semibold" : "text-danger fw-semibold"}>
                          {amount === 0
                            ? fmtMoney(0)
                            : c.column_type === "BONUS"
                              ? `+${fmtMoney(amount)}`
                              : `-${fmtMoney(amount)}`}
                        </td>
                      );
                    })}
                    <td className="comp-money fw-bold text-success">{fmtMoney(p.net_amount)}</td>
                    <td><span className={`badge ${PAY_STATUS_CLS[p.status] || "bg-secondary"}`}>{PAY_STATUS[p.status] || p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== Chấm công ===== */}
      <div className="comp-card">
        <div className="comp-card-head">
          <div className="comp-card-title">
            <i className="bi bi-stopwatch"></i>
            <span>Chấm công</span>
            <span className="badge">{filteredAttendance.length} ca</span>
          </div>
          <div className="comp-filters">
            <div className="comp-seg">
              <button type="button" className={attMode === "week" ? "active" : ""} onClick={() => setAttMode("week")}>Theo tuần</button>
              <button type="button" className={attMode === "month" ? "active" : ""} onClick={() => setAttMode("month")}>Theo tháng</button>
            </div>
            {attMode === "month" ? (
              <input
                type="month"
                className="comp-filter-select"
                value={attMonth}
                onChange={(e) => setAttMonth(e.target.value)}
              />
            ) : (
              <div className="comp-week-nav">
                <button type="button" onClick={() => setAttWeekKey((k) => toDateKey(addDays(parseKey(k), -7)))}><i className="bi bi-chevron-left"></i></button>
                <span>{weekLabel(attWeekKey)}</span>
                <button type="button" onClick={() => setAttWeekKey((k) => toDateKey(addDays(parseKey(k), 7)))}><i className="bi bi-chevron-right"></i></button>
              </div>
            )}
          </div>
        </div>

        {filteredAttendance.length === 0 ? (
          <div className="comp-empty">Không có bản chấm công trong khoảng thời gian này.</div>
        ) : (
          <div className="comp-table-scroll">
            <table className="table table-sm align-middle">
              <thead>
                <tr><th>Đăng nhập</th><th>Đăng xuất</th><th>Thời gian dạy</th><th>Phút tính công</th><th>Thiếu (cần bù)</th><th>Trạng thái</th></tr>
              </thead>
              <tbody>
                {filteredAttendance.map((a) => (
                  <tr key={a.id}>
                    <td>{fmt(a.login_at)}</td>
                    <td>{fmt(a.logout_at)}</td>
                    <td className="fw-semibold">{a.actual_minutes} phút</td>
                    <td>{a.counted_minutes} phút</td>
                    <td className="text-danger fw-semibold">{a.missing_minutes > 0 ? `${a.missing_minutes} phút` : "0"}</td>
                    <td>{ATT_STATUS[a.status] || a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default InstructorMyCompensationPage;