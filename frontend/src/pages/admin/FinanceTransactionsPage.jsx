import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  getAdminTransactionsApi,
  markTransactionPaidApi,
} from "../../api/paymentAPI";
import "../../style/payment/payment.css";

const STATUS_LABELS = {
  PENDING: { label: "Chờ thanh toán", className: "pending" },
  HOLD: { label: "Đang giữ", className: "hold" },
  PAID: { label: "Đã thanh toán", className: "paid" },
  FAILED: { label: "Thất bại", className: "failed" },
  REFUND_REQUESTED: { label: "Yêu cầu hoàn tiền", className: "pending" },
  REFUND_REJECTED: { label: "Từ chối hoàn tiền", className: "failed" },
  REFUND_APPROVED: { label: "Đã duyệt hoàn tiền", className: "hold" },
  REFUNDED: { label: "Đã hoàn tiền", className: "refunded" },
};

function FinanceTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    provider: "",
    date_from: "",
    date_to: "",
  });

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.provider) params.provider = filters.provider;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;

      const result = await getAdminTransactionsApi(params);
      setTransactions(result?.data || []);
    } catch (err) {
      toast.error(
        err.message || "Không thể tải danh sách giao dịch. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleMarkPaid = async (transactionId) => {
    try {
      setProcessingId(transactionId);
      await markTransactionPaidApi(transactionId);
      toast.success("Đã đánh dấu thanh toán cho giảng viên thành công.");
      loadTransactions();
    } catch (err) {
      toast.error(
        err.message || "Không thể đánh dấu thanh toán. Vui lòng thử lại."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      provider: "",
      date_from: "",
      date_to: "",
    });
  };

  const formatPrice = (val) => {
    if (!val && val !== 0) return "0₫";
    return Number(val).toLocaleString("vi-VN") + "₫";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canMarkPaid = (transaction) => {
    if (transaction.status !== "HOLD") return false;
    if (!transaction.hold_time) return false;
    const holdTime = new Date(transaction.hold_time);
    const now = new Date();
    return holdTime <= now;
  };

  const getHoldRemainingDays = (transaction) => {
    if (!transaction.hold_time) return null;
    const holdTime = new Date(transaction.hold_time);
    const now = new Date();
    if (holdTime <= now) return null;
    const diffMs = holdTime - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="finance-page">
      <h1>Quản lý giao dịch</h1>
      <p className="page-subtitle">
        Theo dõi và xử lý các giao dịch thanh toán khóa học
      </p>

      {/* Filters */}
      <div className="finance-filters">
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Chờ thanh toán</option>
          <option value="HOLD">Đang giữ</option>
          <option value="PAID">Đã thanh toán</option>
          <option value="FAILED">Thất bại</option>
          <option value="REFUNDED">Đã hoàn tiền</option>
        </select>

        <select
          value={filters.provider}
          onChange={(e) => handleFilterChange("provider", e.target.value)}
        >
          <option value="">Tất cả phương thức</option>
          <option value="STRIPE">Stripe</option>
          <option value="MOMO">MoMo</option>
        </select>

        <input
          type="date"
          value={filters.date_from}
          onChange={(e) => handleFilterChange("date_from", e.target.value)}
          placeholder="Từ ngày"
        />

        <input
          type="date"
          value={filters.date_to}
          onChange={(e) => handleFilterChange("date_to", e.target.value)}
          placeholder="Đến ngày"
        />

        <button className="filter-btn" onClick={loadTransactions}>
          <i className="bi bi-funnel"></i> Lọc
        </button>

        <button className="filter-btn clear" onClick={clearFilters}>
          <i className="bi bi-x-circle"></i> Xóa lọc
        </button>
      </div>

      {/* Transactions Table */}
      <div className="finance-table-wrapper">
        {loading ? (
          <div className="payment-loading">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p>Đang tải danh sách giao dịch...</p>
          </div>
        ) : transactions.length > 0 ? (
          <table className="finance-table">
            <thead>
              <tr>
                <th>Mã GD</th>
                <th>Học viên</th>
                <th>Khóa học</th>
                <th>Giảng viên</th>
                <th>Phương thức</th>
                <th>Tổng tiền</th>
                <th>Phí nền tảng</th>
                <th>Hoa hồng GV</th>
                <th>Trạng thái</th>
                <th>Ngày thanh toán</th>
                <th>Hết hạn giữ</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => {
                const statusInfo = STATUS_LABELS[t.status] || {
                  label: t.status,
                  className: "pending",
                };
                const canMark = canMarkPaid(t);
                const holdDays = getHoldRemainingDays(t);

                return (
                  <tr key={t.id}>
                    <td>
                      <code style={{ fontSize: "12px" }}>
                        {t.id?.substring(0, 8)}...
                      </code>
                    </td>
                    <td>{t.student_name || t.student?.full_name || "—"}</td>
                    <td>{t.course_title || t.course?.title || "—"}</td>
                    <td>
                      {t.course?.instructor_name ||
                        t.course?.instructor?.full_name ||
                        "—"}
                    </td>
                    <td>{t.provider}</td>
                    <td>{formatPrice(t.gross_amount)}</td>
                    <td>{formatPrice(t.platform_fee_amount)}</td>
                    <td>{formatPrice(t.instructor_share_amount)}</td>
                    <td>
                      <span
                        className={`status-badge ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td>{formatDate(t.paid_at)}</td>
                    <td>{formatDate(t.hold_time)}</td>
                    <td>
                      {t.status === "HOLD" && (
                        <div className="mark-paid-btn-wrapper">
                          <button
                            className="mark-paid-btn"
                            onClick={() => handleMarkPaid(t.id)}
                            disabled={!canMark || processingId === t.id}
                          >
                            {processingId === t.id ? (
                              <span
                                className="spinner-border spinner-border-sm"
                                role="status"
                              ></span>
                            ) : (
                              "Đánh dấu đã thanh toán"
                            )}
                          </button>
                          {!canMark && holdDays && (
                            <span className="tooltip-text">
                              Giao dịch vẫn đang trong thời gian giữ tiền 7
                              ngày (còn {holdDays} ngày)
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="payment-empty">
            <i className="bi bi-inbox"></i>
            <p>Không có giao dịch nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FinanceTransactionsPage;
