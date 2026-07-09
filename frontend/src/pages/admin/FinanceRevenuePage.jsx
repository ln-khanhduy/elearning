import React from "react";
import { useFinanceData } from "../../hooks/finance/useFinanceData";
import KpiCard from "../../components/common/KpiCard";
import BarChart from "../../components/finance/BarChart";
import PieChart from "../../components/finance/PieChart";
import TopCourses from "../../components/finance/TopCourses";
import { formatPrice } from "../../utils/formatPrice";
import "../../style/finance/finance-revenue.css";

const currentYear = new Date().getFullYear();
const years = [];
for (let y = currentYear; y >= currentYear - 5; y--) years.push(String(y));

function FinanceRevenuePage() {
  const {
    transactions, loading, totals,
    groupData, statusData, topCourses: topCoursesData,
    filterMode, setFilterMode,
    selectedDay, setSelectedDay,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    dateFrom, setDateFrom, dateTo, setDateTo,
    STATUS_LABELS, PAGE_SIZE,
  } = useFinanceData();

  const filterLabels = { day: "ngày", month: "tháng", year: "năm", range: "khoảng thời gian" };
  const filterLabel = filterLabels[filterMode] || "";

  return (
    <div className="container-center py-4">
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <h3 className="mb-3" style={{ fontSize: 22, fontWeight: 600, color: "var(--course-text, #1a1a2e)" }}>Doanh thu</h3>

        {/* Filter bar */}
        <div className="finance-filter-bar">
          <div className="finance-mode-group">
            {["day", "month", "year", "range"].map((mode) => (
              <button key={mode}
                className={`finance-mode-btn ${filterMode === mode ? "finance-mode-btn--active" : ""}`}
                onClick={() => setFilterMode(mode)}
              >
                {mode === "range" ? "Khoảng thời gian" : `Theo ${mode === "day" ? "ngày" : mode === "month" ? "tháng" : "năm"}`}
              </button>
            ))}
          </div>

          <div>
            {filterMode === "day" && (
              <input type="date" className="finance-filter-input"
                value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} />
            )}
            {filterMode === "month" && (
              <input type="month" className="finance-filter-input"
                value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
            )}
            {filterMode === "year" && (
              <select className="finance-filter-input"
                value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
            {filterMode === "range" && (
              <div className="d-flex gap-2 align-items-center">
                <input type="date" className="finance-filter-input"
                  value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="Từ ngày" />
                <span style={{ color: "var(--muted, #6c757d)" }}>→</span>
                <input type="date" className="finance-filter-input"
                  value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="Đến ngày" />
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-bar-chart" style={{ fontSize: 48 }}></i>
            <p className="mt-2">Chưa có dữ liệu giao dịch trong {filterLabel} này.</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="row g-3 mb-4">
              <div className="col-6 col-md-4">
                <KpiCard label="Tổng tiền" value={totals.gross} color="var(--course-text, #1a1a2e)" formatPrice={formatPrice} />
              </div>
              <div className="col-6 col-md-4">
                <KpiCard label="Tiền chi trả giảng viên" value={totals.instructor_share} color="var(--success, #16a34a)" formatPrice={formatPrice} />
              </div>
              <div className="col-6 col-md-4">
                <KpiCard label="Tổng tiền thuế" value={totals.tax_amount} color="#f59e0b" formatPrice={formatPrice} />
              </div>
              <div className="col-6 col-md-4">
                <KpiCard label="Hệ thống thực nhận" value={totals.platform_fee + totals.tax_amount} color="var(--primary, #0f3d75)" formatPrice={formatPrice} />
              </div>
              <div className="col-6 col-md-4">
                <KpiCard label="Tổng số giao dịch" value={totals.count} color="var(--course-text, #1a1a2e)" />
              </div>
            </div>

            {/* Bar Chart */}
            <div className="finance-chart-box mb-4">
              <h6 className="finance-chart-title">Doanh thu theo {filterLabel}</h6>
              <BarChart data={groupData} labelKey="label" valueKey="gross" />
            </div>

            {/* Pie Chart + Top Courses */}
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="finance-chart-box">
                  <h6 className="finance-chart-title">Cơ cấu doanh thu theo trạng thái</h6>
                  <PieChart data={statusData} labelKey="label" valueKey="value" colorKey="color" />
                </div>
              </div>
              <div className="col-md-6">
                <div className="finance-chart-box">
                  <h6 className="finance-chart-title">Top 5 khóa học có doanh thu cao nhất</h6>
                  <TopCourses courses={topCoursesData} valueKey="gross" formatPrice={formatPrice} />
                </div>
              </div>
            </div>

            {/* Transaction Table */}
            <h5 className="mb-3" style={{ fontWeight: 600, fontSize: 15, color: "var(--course-text, #1a1a2e)" }}>
              Danh sách giao dịch ({transactions.length})
            </h5>
            <div className="finance-table-wrap">
              <table className="finance-table table mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Khóa học</th>
                    <th>Học viên</th>
                    <th className="text-end">Tổng tiền</th>
                    <th className="text-end">Phí nền tảng</th>
                    <th className="text-end">Chi trả GV</th>
                    <th>Trạng thái</th>
                    <th>Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, PAGE_SIZE).map((t) => (
                    <tr key={t.id}>
                      <td>{t.course_title}</td>
                      <td>{t.student_name}</td>
                      <td className="text-end">{formatPrice(t.gross_amount)}</td>
                      <td className="text-end">{formatPrice(t.platform_fee_amount)}</td>
                      <td className="text-end">{formatPrice(t.instructor_share_amount)}</td>
                      <td>
                        <span className="finance-status-badge" style={{
                          background: (STATUS_LABELS[t.status] || {}).color || "#6b7280",
                        }}>
                          {(STATUS_LABELS[t.status] || {}).label || t.status}
                        </span>
                      </td>
                      <td>{t.created_at ? new Date(t.created_at).toLocaleDateString("vi-VN") : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default FinanceRevenuePage;