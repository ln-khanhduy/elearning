import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { getAdminFinanceReportApi } from "../../../api/paymentAPI";
import { formatPrice } from "../../../utils/formatPrice";
import "../../../style/finance/finance-reports.css";

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

// Mặc định: tháng hiện tại (từ ngày 1 đến hôm nay)
function defaultRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return { dateFrom: `${y}-${m}-01`, dateTo: `${y}-${m}-${d}` };
}

// Trang báo cáo tài chính: tổng hợp KPI, doanh thu theo ngày/tháng, trạng thái, top khóa học và xuất CSV
function FinanceReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const { dateFrom, dateTo } = defaultRange();
  const [from, setFrom] = useState(dateFrom);
  const [to, setTo] = useState(dateTo);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getAdminFinanceReportApi({
        date_from: from || undefined,
        date_to: to || undefined,
      });
      setReport(result?.data || null);
    } catch (err) {
      toast.error(err.message || "Không thể tải báo cáo.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const summary = useMemo(() => report?.summary || {}, [report]);
  const monthly = useMemo(() => report?.monthly || [], [report]);
  const daily = useMemo(() => report?.daily || [], [report]);
  const statusStats = useMemo(() => report?.status_stats || [], [report]);
  const topCourses = useMemo(() => report?.top_courses || [], [report]);

  const maxDailyGross = useMemo(
    () => (daily.length > 0 ? Math.max(...daily.map((d) => Number(d.gross)), 1) : 1),
    [daily]
  );

  const totalMonthly = useMemo(
    () => monthly.reduce((s, m) => s + Number(m.gross || 0), 0),
    [monthly]
  );

  // Xuất CSV báo cáo theo tháng
  const exportCsv = () => {
    const header = ["Tháng", "Số GD", "Tổng doanh thu", "Doanh thu thuần", "Phí nền tảng", "Chi trả GV"];
    const rows = monthly.map((m) => [
      m.month,
      m.count,
      Number(m.gross || 0).toFixed(2),
      Number(m.net || 0).toFixed(2),
      Number(m.platform_fee || 0).toFixed(2),
      Number(m.instructor_paid || 0).toFixed(2),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bao-cao-tai-chinh-${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const monthLabel = (m) => {
    const [y, mm] = m.split("-");
    const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    return `Tháng ${months.indexOf(mm) + 1}/${y}`;
  };

  return (
    <div className="fr-page">
      <div className="fr-header">
        <div>
          <h3 className="fr-title"><i className="bi bi-file-earmark-bar-graph me-2"></i>Báo cáo tài chính</h3>
          <p className="fr-subtitle">Tổng hợp doanh thu, phí nền tảng, chi trả giảng viên theo khoảng thời gian</p>
        </div>
        {!loading && report && (
          <button className="fr-export-btn" onClick={exportCsv} disabled={monthly.length === 0}>
            <i className="bi bi-download me-1"></i> Xuất CSV
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="fr-filter-bar">
        <div className="fr-filter-item">
          <label className="fr-filter-label">Từ ngày</label>
          <input type="date" className="fr-filter-input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="fr-filter-item">
          <label className="fr-filter-label">Đến ngày</label>
          <input type="date" className="fr-filter-input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="fr-filter-btn" onClick={loadData} disabled={loading}>
          {loading ? <><span className="spinner-border spinner-border-sm me-1"></span> Đang tải...</> : <><i className="bi bi-search me-1"></i> Lọc</>}
        </button>
        <button className="fr-filter-btn fr-filter-btn--ghost" onClick={() => { setFrom(dateFrom); setTo(dateTo); }} disabled={loading}>
          <i className="bi bi-arrow-counterclockwise me-1"></i> Mặc định
        </button>
      </div>

      {loading ? (
        <div className="fr-loading">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Đang tải báo cáo...</p>
        </div>
      ) : !report || summary.count === 0 ? (
        <div className="fr-empty">
          <i className="bi bi-bar-chart-line"></i>
          <p className="mt-2 text-muted">Chưa có dữ liệu giao dịch trong khoảng thời gian này.</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="fr-kpi-grid">
            <div className="fr-kpi fr-kpi--primary">
              <div className="fr-kpi-icon"><i className="bi bi-currency-dollar"></i></div>
              <div className="fr-kpi-body">
                <div className="fr-kpi-label">Tổng doanh thu</div>
                <div className="fr-kpi-value">{formatPrice(summary.gross)}</div>
                <div className="fr-kpi-note">{summary.count} giao dịch</div>
              </div>
            </div>
            <div className="fr-kpi fr-kpi--fee">
              <div className="fr-kpi-icon"><i className="bi bi-bank"></i></div>
              <div className="fr-kpi-body">
                <div className="fr-kpi-label">Phí nền tảng</div>
                <div className="fr-kpi-value">{formatPrice(summary.platform_fee)}</div>
                <div className="fr-kpi-note">Hệ thống thực nhận</div>
              </div>
            </div>
            <div className="fr-kpi fr-kpi--instructor">
              <div className="fr-kpi-icon"><i className="bi bi-person-video3"></i></div>
              <div className="fr-kpi-body">
                <div className="fr-kpi-label">Chi trả giảng viên</div>
                <div className="fr-kpi-value">{formatPrice(summary.instructor_paid)}</div>
                <div className="fr-kpi-note">Từ bảng lương đã duyệt/chi trả</div>
              </div>
            </div>
            <div className="fr-kpi fr-kpi--refund">
              <div className="fr-kpi-icon"><i className="bi bi-arrow-counterclockwise"></i></div>
              <div className="fr-kpi-body">
                <div className="fr-kpi-label">Đã hoàn tiền</div>
                <div className="fr-kpi-value">{formatPrice(summary.refunded_amount)}</div>
                <div className="fr-kpi-note">{summary.refunded_count} giao dịch</div>
              </div>
            </div>
          </div>

          {/* Revenue by day (last 14 days) */}
          <div className="fr-card">
            <div className="fr-card-header">
              <h6 className="fr-card-title"><i className="bi bi-graph-up me-1"></i>Doanh thu 14 ngày gần nhất</h6>
              <span className="fr-card-total">Tổng: {formatPrice(daily.reduce((s, d) => s + Number(d.gross || 0), 0))}</span>
            </div>
            <div className="fr-daily-bars">
              {daily.map((d) => {
                const pct = Math.max((Number(d.gross) / maxDailyGross) * 100, d.gross > 0 ? 4 : 2);
                return (
                  <div key={d.date} className="fr-daily-item" title={`${d.date}: ${formatPrice(d.gross)} (${d.count} giao dịch)`}>
                    <div className="fr-daily-bar-track">
                      <div className="fr-daily-bar" style={{ height: `${pct}%` }}></div>
                    </div>
                    <div className="fr-daily-label">{d.date.substring(8, 10)}/{d.date.substring(5, 7)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly + Status + Top courses */}
          <div className="fr-grid-2">
            {/* Monthly table */}
            <div className="fr-card">
              <div className="fr-card-header">
                <h6 className="fr-card-title"><i className="bi bi-calendar3 me-1"></i>Doanh thu theo tháng</h6>
                <span className="fr-card-total">{formatPrice(totalMonthly)}</span>
              </div>
              <div className="fr-table-wrap">
                <table className="fr-table">
                  <thead>
                    <tr>
                      <th>Tháng</th>
                      <th className="text-end">Số GD</th>
                      <th className="text-end">Doanh thu</th>
                      <th className="text-end">Phí nền tảng</th>
                      <th className="text-end">Chi trả GV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.map((m) => (
                      <tr key={m.month}>
                        <td><strong>{monthLabel(m.month)}</strong></td>
                        <td className="text-end">{m.count}</td>
                        <td className="text-end fr-amount">{formatPrice(m.gross)}</td>
                        <td className="text-end fr-amount fr-amount--danger">{formatPrice(m.platform_fee)}</td>
                        <td className="text-end fr-amount fr-amount--success">{formatPrice(m.instructor_paid)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Status breakdown */}
            <div className="fr-card">
              <div className="fr-card-header">
                <h6 className="fr-card-title"><i className="bi bi-pie-chart me-1"></i>Cơ cấu theo trạng thái</h6>
              </div>
              <div className="fr-status-list">
                {statusStats.map((s) => {
                  const meta = STATUS_LABELS[s.status] || { label: s.status, color: "#6b7280" };
                  const pct = summary.gross > 0 ? (Number(s.gross) / Number(summary.gross)) * 100 : 0;
                  return (
                    <div key={s.status} className="fr-status-item">
                      <div className="fr-status-row">
                        <span className="fr-status-dot" style={{ background: meta.color }}></span>
                        <span className="fr-status-label">{meta.label}</span>
                        <span className="fr-status-count">{s.count} GD</span>
                        <span className="fr-status-amount">{formatPrice(s.gross)}</span>
                      </div>
                      <div className="fr-status-track">
                        <div className="fr-status-bar" style={{ width: `${pct}%`, background: meta.color }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top courses */}
          <div className="fr-card">
            <div className="fr-card-header">
              <h6 className="fr-card-title"><i className="bi bi-trophy me-1"></i>Top khóa học có doanh thu cao nhất</h6>
            </div>
            {topCourses.length === 0 ? (
              <div className="fr-card-empty">Không có dữ liệu khóa học.</div>
            ) : (
              <div className="fr-top-courses">
                {topCourses.map((c, idx) => {
                  const maxGross = Math.max(...topCourses.map((x) => Number(x.gross || 0)), 1);
                  const pct = (Number(c.gross) / maxGross) * 100;
                  return (
                    <div key={`${c.course_id}_${idx}`} className="fr-top-item">
                      <span className="fr-top-rank">{idx + 1}</span>
                      <div className="fr-top-info">
                        <div className="fr-top-title">{c.course_title}</div>
                        <div className="fr-top-track">
                          <div className="fr-top-bar" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                      <div className="fr-top-meta">
                        <span>{c.count} GD</span>
                        <strong>{formatPrice(c.gross)}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default FinanceReportsPage;