import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getInstructorRevenueApi } from "../../api/paymentAPI";
import "../../style/payment/payment.css";

const STATUS_LABELS = {
  HOLD: { label: "Đang giữ", className: "hold" },
  PAID: { label: "Đủ điều kiện nhận", className: "paid" },
  REFUNDED: { label: "Đã hoàn tiền", className: "refunded" },
  FAILED: { label: "Thất bại", className: "failed" },
  PENDING: { label: "Chờ xử lý", className: "pending" },
};

function InstructorRevenuePage() {
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRevenue();
  }, []);

  const loadRevenue = async () => {
    try {
      setLoading(true);
      const result = await getInstructorRevenueApi();
      setRevenue(result?.data || result);
    } catch (err) {
      toast.error(
        err.message || "Không thể tải doanh thu. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="revenue-page">
        <div className="payment-loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p>Đang tải doanh thu...</p>
        </div>
      </div>
    );
  }

  if (!revenue) {
    return (
      <div className="revenue-page">
        <div className="payment-empty">
          <i className="bi bi-currency-dollar"></i>
          <p>Không có dữ liệu doanh thu.</p>
          <button className="btn btn-primary mt-3" onClick={loadRevenue}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="revenue-page">
      <h1>Doanh thu của tôi</h1>
      <p className="page-subtitle">
        Theo dõi doanh thu từ các khóa học của bạn
      </p>

      {/* Summary Cards */}
      <div className="revenue-summary">
        <div className="revenue-summary-card">
          <div className="card-icon hold">
            <i className="bi bi-clock-history"></i>
          </div>
          <div className="card-label">Đang giữ (7 ngày)</div>
          <div className="card-value">
            {formatPrice(revenue.total_hold)}
          </div>
        </div>

        <div className="revenue-summary-card">
          <div className="card-icon available">
            <i className="bi bi-wallet2"></i>
          </div>
          <div className="card-label">Đủ điều kiện nhận</div>
          <div className="card-value">
            {formatPrice(revenue.total_available)}
          </div>
        </div>

        <div className="revenue-summary-card">
          <div className="card-icon refunded">
            <i className="bi bi-arrow-return-left"></i>
          </div>
          <div className="card-label">Đã hoàn tiền</div>
          <div className="card-value">
            {formatPrice(revenue.total_refunded)}
          </div>
        </div>

        <div className="revenue-summary-card">
          <div className="card-icon transactions">
            <i className="bi bi-receipt"></i>
          </div>
          <div className="card-label">Tổng giao dịch</div>
          <div className="card-value">{revenue.total_transactions}</div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="revenue-table-wrapper">
        <h3>Lịch sử giao dịch</h3>
        {revenue.transactions && revenue.transactions.length > 0 ? (
          <table className="revenue-table">
            <thead>
              <tr>
                <th>Khóa học</th>
                <th>Học viên</th>
                <th>Phương thức</th>
                <th>Tổng tiền</th>
                <th>Hoa hồng</th>
                <th>Trạng thái</th>
                <th>Ngày thanh toán</th>
                <th>Hết hạn giữ</th>
              </tr>
            </thead>
            <tbody>
              {revenue.transactions.map((t) => {
                const statusInfo = STATUS_LABELS[t.status] || {
                  label: t.status,
                  className: "pending",
                };
                return (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.course_title}</strong>
                    </td>
                    <td>{t.student_name}</td>
                    <td>{t.provider}</td>
                    <td>{formatPrice(t.gross_amount)}</td>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="payment-empty">
            <i className="bi bi-inbox"></i>
            <p>Chưa có giao dịch nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default InstructorRevenuePage;
