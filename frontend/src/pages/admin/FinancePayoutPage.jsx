import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { getPayoutsApi, batchPayoutApi } from "../../api/payoutAPI";
import { formatPrice } from "../../utils/formatPrice";
import "../../style/finance/finance-payout.css";

function FinancePayoutPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [instructorFilter, setInstructorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getPayoutsApi();
      setTransactions(result?.data || []);
    } catch (err) {
      toast.error(err.message || "Không thể tải danh sách.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const now = new Date();

  const getDaysRemaining = (holdTime) => {
    if (!holdTime) return null;
    const diff = new Date(holdTime) - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const isReady = (t) => {
    const days = getDaysRemaining(t.hold_time);
    return days !== null && days <= 0;
  };

  // Lọc dữ liệu
  const filtered = transactions.filter((t) => {
    if (instructorFilter && t.instructor_name !== instructorFilter) return false;
    if (statusFilter === "ready" && !isReady(t)) return false;
    if (statusFilter === "waiting" && isReady(t)) return false;
    return true;
  });

  // Danh sách instructor unique
  const instructors = [...new Set(transactions.map((t) => t.instructor_name).filter(Boolean))];

  // Thống kê
  const stats = {
    total: transactions.length,
    ready: transactions.filter((t) => isReady(t)).length,
    waiting: transactions.filter((t) => !isReady(t)).length,
    totalAmount: transactions.reduce((s, t) => s + Number(t.instructor_share_amount || 0), 0),
    readyAmount: transactions.filter((t) => isReady(t)).reduce((s, t) => s + Number(t.instructor_share_amount || 0), 0),
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const readyIds = filtered.filter((t) => isReady(t) && !selectedIds.includes(t.id)).map((t) => t.id);
    if (readyIds.length > 0) {
      setSelectedIds((prev) => [...prev, ...readyIds]);
    } else {
      setSelectedIds([]);
    }
  };

  const selectedAmount = transactions
    .filter((t) => selectedIds.includes(t.id))
    .reduce((s, t) => s + Number(t.instructor_share_amount || 0), 0);

  const handlePayout = async () => {
    if (selectedIds.length === 0) {
      toast.warning("Vui lòng chọn giao dịch cần thanh toán.");
      return;
    }
    if (!window.confirm(`Xác nhận thanh toán ${selectedIds.length} giao dịch, tổng ${formatPrice(selectedAmount)}?\n\nSau khi thanh toán, các giao dịch này sẽ không xuất hiện trong danh sách nữa.`)) return;

    setProcessing(true);
    try {
      const result = await batchPayoutApi(selectedIds);
      toast.success(result?.message || "Thanh toán thành công!");
      setSelectedIds([]);
      loadData();
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container-center py-4">
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h3 className="mb-3" style={{ fontSize: 22, fontWeight: 600, color: "var(--course-text, #1a1a2e)" }}>
          Thanh toán giảng viên
        </h3>

        {/* Summary Cards */}
        <div className="payout-summary-row">
          <div className="payout-summary-card">
            <div className="payout-summary-label">Tổng giao dịch chờ</div>
            <div className="payout-summary-value">{stats.total}</div>
          </div>
          <div className="payout-summary-card">
            <div className="payout-summary-label">Sẵn sàng thanh toán</div>
            <div className="payout-summary-value" style={{ color: "var(--success, #16a34a)" }}>{stats.ready}</div>
          </div>
          <div className="payout-summary-card">
            <div className="payout-summary-label">Chưa đến hạn</div>
            <div className="payout-summary-value" style={{ color: "#f59e0b" }}>{stats.waiting}</div>
          </div>
          <div className="payout-summary-card">
            <div className="payout-summary-label">Tổng tiền sẵn sàng</div>
            <div className="payout-summary-value" style={{ color: "var(--success, #16a34a)" }}>{formatPrice(stats.readyAmount)}</div>
          </div>
        </div>

        {/* Filter */}
        <div className="payout-filter-bar">
          <select className="payout-filter-select" value={instructorFilter} onChange={(e) => { setInstructorFilter(e.target.value); setSelectedIds([]); }}>
            <option value="">Tất cả giảng viên</option>
            {instructors.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <select className="payout-filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setSelectedIds([]); }}>
            <option value="all">Tất cả trạng thái</option>
            <option value="ready">Sẵn sàng</option>
            <option value="waiting">Chờ</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-cash" style={{ fontSize: 48 }}></i>
            <p className="mt-2 mb-1">Không có giao dịch nào đủ điều kiện thanh toán.</p>
            <small>Các giao dịch cần: trạng thái HOLD, đã qua 7 ngày giữ, có giảng viên phụ trách.</small>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="payout-table-wrap">
              <table className="payout-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input type="checkbox" checked={filtered.filter((t) => isReady(t)).every((t) => selectedIds.includes(t.id))}
                        onChange={toggleSelectAll} />
                    </th>
                    <th>Giảng viên</th>
                    <th>Khóa học</th>
                    <th>Học viên</th>
                    <th className="text-end">Số tiền</th>
                    <th>Ngày HOLD</th>
                    <th>Hết hạn giữ</th>
                    <th>Còn lại</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => {
                    const holdDate = t.hold_time ? new Date(t.hold_time) : null;
                    const daysRemaining = getDaysRemaining(t.hold_time);
                    const ready = isReady(t);
                    const holdCreated = t.created_at ? new Date(t.created_at) : null;
                    return (
                      <tr key={t.id}>
                        <td>
                          <input type="checkbox" checked={selectedIds.includes(t.id)}
                            onChange={() => toggleSelect(t.id)} disabled={!ready} />
                        </td>
                        <td><strong>{t.instructor_name || "—"}</strong></td>
                        <td>{t.course_title}</td>
                        <td>{t.student_name}</td>
                        <td className="text-end" style={{ fontWeight: 600 }}>{formatPrice(t.instructor_share_amount)}</td>
                        <td>{holdCreated ? holdCreated.toLocaleDateString("vi-VN") : "—"}</td>
                        <td>{holdDate ? holdDate.toLocaleDateString("vi-VN") : "—"}</td>
                        <td>
                          {daysRemaining !== null && (
                            daysRemaining <= 0 ? (
                              <span className="payout-badge payout-badge--ready">Đã hết hạn</span>
                            ) : (
                              <span style={{ color: "#92400e", fontSize: "var(--font-size-xs, 12px)" }}>
                                Còn {daysRemaining} ngày
                              </span>
                            )
                          )}
                        </td>
                        <td>
                          {ready ? (
                            <span className="payout-badge payout-badge--ready">Sẵn sàng</span>
                          ) : (
                            <span className="payout-badge payout-badge--waiting">Chờ</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom bar */}
            <div className="payout-bottom-bar">
              <div>
                {selectedIds.length > 0 ? (
                  <span style={{ fontWeight: 500 }}>
                    Đã chọn <strong>{selectedIds.length}</strong> giao dịch, tổng <strong style={{ color: "var(--success, #16a34a)" }}>{formatPrice(selectedAmount)}</strong>
                  </span>
                ) : (
                  <span className="text-muted">Chọn giao dịch cần thanh toán</span>
                )}
              </div>
              <button className="payout-btn" onClick={handlePayout}
                disabled={processing || selectedIds.length === 0}>
                {processing ? (
                  <><span className="spinner-border spinner-border-sm me-1"></span> Đang xử lý...</>
                ) : (
                  <><i className="bi bi-cash-stack me-1"></i> Thanh toán ({selectedIds.length})</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default FinancePayoutPage;