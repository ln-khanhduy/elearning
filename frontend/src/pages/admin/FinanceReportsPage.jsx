import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { getAdminTransactionsApi } from "../../api/paymentAPI";
import "../../style/payment/payment.css";

function FinanceReportsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const result = await getAdminTransactionsApi(params);
      setTransactions(result?.data || []);
    } catch (err) {
      toast.error(err.message || "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { loadData(); }, [loadData]);

  // Monthly breakdown
  const monthlyData = {};
  transactions.forEach((t) => {
    if (!t.created_at) return;
    const month = t.created_at.substring(0, 7);
    if (!monthlyData[month]) monthlyData[month] = { gross: 0, net: 0, platform_fee: 0, instructor_share: 0, count: 0 };
    monthlyData[month].gross += Number(t.gross_amount || 0);
    monthlyData[month].net += Number(t.net_amount || 0);
    monthlyData[month].platform_fee += Number(t.platform_fee_amount || 0);
    monthlyData[month].instructor_share += Number(t.instructor_share_amount || 0);
    monthlyData[month].count++;
  });

  const formatPrice = (v) => Number(v || 0).toLocaleString("vi-VN") + " đ";
  const months = Object.keys(monthlyData).sort().reverse();

  return (
    <div className="container-center py-4">
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h3 className="mb-4" style={{ fontSize: 22, fontWeight: 600 }}>Báo cáo tài chính</h3>

        <div className="d-flex gap-3 mb-4 align-items-end">
          <div>
            <label className="form-label small mb-1">Từ ngày</label>
            <input type="date" className="form-control form-control-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="form-label small mb-1">Đến ngày</label>
            <input type="date" className="form-control form-control-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>Xóa lọc</button>
        </div>

        {loading ? (
          <div className="text-center py-4"><div className="spinner-border text-primary" role="status"></div></div>
        ) : months.length === 0 ? (
          <div className="text-center py-5 text-muted"><i className="bi bi-bar-chart" style={{ fontSize: 48 }}></i><p className="mt-2">Chưa có dữ liệu giao dịch.</p></div>
        ) : (
          <>
            <div className="mb-3" style={{ background: "var(--card, #fff)", borderRadius: "var(--card-radius)", border: "1px solid #e9ecef", overflow: "hidden" }}>
              <table className="table mb-0" style={{ fontSize: "var(--font-size-small, 13px)" }}>
                <thead className="table-light">
                  <tr>
                    <th>Tháng</th>
                    <th className="text-end">Số giao dịch</th>
                    <th className="text-end">Tổng doanh thu</th>
                    <th className="text-end">Doanh thu thuần</th>
                    <th className="text-end">Phí nền tảng</th>
                    <th className="text-end">Chi trả GV</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((m) => {
                    const d = monthlyData[m];
                    return (
                      <tr key={m}>
                        <td><strong>{m}</strong></td>
                        <td className="text-end">{d.count}</td>
                        <td className="text-end">{formatPrice(d.gross)}</td>
                        <td className="text-end">{formatPrice(d.net)}</td>
                        <td className="text-end" style={{ color: "var(--danger)" }}>{formatPrice(d.platform_fee)}</td>
                        <td className="text-end" style={{ color: "var(--success)" }}>{formatPrice(d.instructor_share)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ background: "var(--card, #fff)", borderRadius: "var(--card-radius)", border: "1px solid #e9ecef" }}>
              <div className="p-3" style={{ borderBottom: "1px solid #e9ecef" }}>
                <strong>Tổng quan toàn bộ</strong>
              </div>
              <div className="p-3">
                <div className="row g-3">
                  <div className="col-6 col-md-3">
                    <div className="small text-muted">Tổng doanh thu</div>
                    <strong style={{ fontSize: 18 }}>{formatPrice(Object.values(monthlyData).reduce((s, d) => s + d.gross, 0))}</strong>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="small text-muted">Doanh thu thuần</div>
                    <strong style={{ fontSize: 18 }}>{formatPrice(Object.values(monthlyData).reduce((s, d) => s + d.net, 0))}</strong>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="small text-muted">Phí nền tảng</div>
                    <strong style={{ fontSize: 18, color: "var(--danger)" }}>{formatPrice(Object.values(monthlyData).reduce((s, d) => s + d.platform_fee, 0))}</strong>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="small text-muted">Chi trả giảng viên</div>
                    <strong style={{ fontSize: 18, color: "var(--success)" }}>{formatPrice(Object.values(monthlyData).reduce((s, d) => s + d.instructor_share, 0))}</strong>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default FinanceReportsPage;