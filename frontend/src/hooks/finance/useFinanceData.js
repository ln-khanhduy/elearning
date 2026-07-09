import { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { getAdminTransactionsApi } from "../../api/paymentAPI";

const STATUS_LABELS = {
  PENDING: { label: "Chờ thanh toán", color: "#f59e0b" },
  HOLD: { label: "Đang giữ", color: "#3b82f6" },
  PAID: { label: "Đã thanh toán", color: "#16a34a" },
  FAILED: { label: "Thất bại", color: "#dc2626" },
  REFUND_REQUESTED: { label: "Yêu cầu hoàn tiền", color: "#f59e0b" },
  REFUND_REJECTED: { label: "Từ chối hoàn tiền", color: "#dc2626" },
  REFUND_APPROVED: { label: "Đã duyệt hoàn tiền", color: "#3b82f6" },
  REFUNDED: { label: "Đã hoàn tiền", color: "#6b7280" },
};

const PAGE_SIZE = 30;

/**
 * Hook quản lý dữ liệu doanh thu cho admin.
 * Hỗ trợ 4 chế độ lọc: day, month, year, range.
 */
export function useFinanceData() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chế độ lọc: "day" | "month" | "year" | "range"
  const [filterMode, setFilterMode] = useState("month");

  // Filter values
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Mặc định: tháng hiện tại
  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    setSelectedYear(String(y));
    setSelectedMonth(`${y}-${m}`);
    setSelectedDay(`${y}-${m}-${d}`);
  }, []);

  const buildDateParams = useCallback(() => {
    if (filterMode === "day" && selectedDay) {
      return { date_from: selectedDay, date_to: selectedDay };
    }
    if (filterMode === "month" && selectedMonth) {
      const [y, m] = selectedMonth.split("-");
      const lastDay = new Date(Number(y), Number(m), 0).getDate();
      return { date_from: `${selectedMonth}-01`, date_to: `${selectedMonth}-${String(lastDay).padStart(2, "0")}` };
    }
    if (filterMode === "year" && selectedYear) {
      return { date_from: `${selectedYear}-01-01`, date_to: `${selectedYear}-12-31` };
    }
    if (filterMode === "range" && dateFrom && dateTo) {
      return { date_from: dateFrom, date_to: dateTo };
    }
    return {};
  }, [filterMode, selectedDay, selectedMonth, selectedYear, dateFrom, dateTo]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = buildDateParams();
      const result = await getAdminTransactionsApi(params);
      setTransactions(result?.data || []);
    } catch (err) {
      toast.error(err.message || "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [buildDateParams]);

  useEffect(() => { loadData(); }, [loadData]);

  const tx = transactions;

  // Tổng quan
  const totals = { gross: 0, net: 0, platform_fee: 0, instructor_share: 0, tax_amount: 0, count: tx.length };
  tx.forEach((t) => {
    totals.gross += Number(t.gross_amount || 0);
    totals.net += Number(t.net_amount || 0);
    totals.platform_fee += Number(t.platform_fee_amount || 0);
    totals.instructor_share += Number(t.instructor_share_amount || 0);
    totals.tax_amount += Number(t.tax_amount || 0);
  });

  // Nhóm theo thời gian (ngày/tháng/năm tùy filterMode)
  const groupMap = {};
  tx.forEach((t) => {
    if (!t.created_at) return;
    let key;
    if (filterMode === "year") key = t.created_at.substring(0, 4);
    else if (filterMode === "month") key = t.created_at.substring(0, 7);
    else key = t.created_at.substring(0, 10);
    if (!groupMap[key]) groupMap[key] = { gross: 0, net: 0, count: 0 };
    groupMap[key].gross += Number(t.gross_amount || 0);
    groupMap[key].net += Number(t.net_amount || 0);
    groupMap[key].count++;
  });
  const groupKeys = Object.keys(groupMap).sort();
  const groupData = groupKeys.map((k) => ({
    label: filterMode === "year" ? k : filterMode === "month" ? k.substring(5) : k.substring(8),
    gross: groupMap[k].gross,
    net: groupMap[k].net,
    count: groupMap[k].count,
  }));
  const maxGroupGross = groupData.length > 0 ? Math.max(...groupData.map((d) => d.gross), 1) : 1;

  // Nhóm theo trạng thái
  const statusMap = {};
  tx.forEach((t) => {
    statusMap[t.status] = (statusMap[t.status] || 0) + Number(t.gross_amount || 0);
  });
  const statusData = Object.entries(statusMap).filter(([, v]) => v > 0).map(([status, amount]) => ({
    label: (STATUS_LABELS[status] || {}).label || status,
    value: amount,
    color: (STATUS_LABELS[status] || {}).color || "#6b7280",
  }));

  // Top khóa học
  const courseMap = {};
  tx.forEach((t) => {
    const key = t.course_title || "Không xác định";
    if (!courseMap[key]) courseMap[key] = { gross: 0, count: 0 };
    courseMap[key].gross += Number(t.gross_amount || 0);
    courseMap[key].count++;
  });
  const topCourses = Object.entries(courseMap)
    .sort((a, b) => b[1].gross - a[1].gross)
    .slice(0, 5);
  const maxCourseGross = topCourses.length > 0 ? topCourses[0][1].gross : 1;

  return {
    transactions, loading, totals,
    groupData, maxGroupGross, statusData, topCourses, maxCourseGross,
    filterMode, setFilterMode,
    selectedDay, setSelectedDay,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    dateFrom, setDateFrom, dateTo, setDateTo,
    STATUS_LABELS, PAGE_SIZE,
  };
}

export default useFinanceData;