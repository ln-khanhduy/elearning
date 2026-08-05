import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { getPayoutsApi, instructorPayoutApi } from "../../../api/payoutAPI";
import { formatPrice } from "../../../utils/formatPrice";
import "../../../style/finance/finance-payout.css";

// Trang thanh toán giảng viên: danh sách giảng viên đủ điều kiện, thanh toán theo từng giảng viên
// sau khi kiểm tra kỹ thông tin ngân hàng và số tiền
function FinancePayoutPage() {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [confirmedAgree, setConfirmedAgree] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getPayoutsApi();
      setInstructors(result?.data || []);
    } catch (err) {
      toast.error(err.message || "Không thể tải danh sách.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const totalAllAmount = instructors.reduce((s, g) => s + Number(g.total_amount || 0), 0);
  const totalAllTransactions = instructors.reduce((s, g) => s + Number(g.transaction_count || 0), 0);

  const openConfirmModal = (instructor) => {
    setSelectedInstructor(instructor);
    setConfirmedAgree(false);
  };

  const handlePayout = async () => {
    if (!selectedInstructor) return;
    const { bank_name, bank_account_number, bank_account_name, instructor_id, transactions } = selectedInstructor;

    if (!confirmedAgree) {
      toast.warning("Vui lòng tích xác nhận đã kiểm tra thông tin trước khi thanh toán.");
      return;
    }

    setProcessing(true);
    try {
      const txIds = transactions.map((t) => t.id);
      const result = await instructorPayoutApi(instructor_id, txIds, {
        bank_name,
        bank_account_number,
        bank_account_name,
      });
      toast.success(result?.message || "Thanh toán thành công!");
      setSelectedInstructor(null);
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
            <div className="payout-summary-label">Giảng viên chờ thanh toán</div>
            <div className="payout-summary-value">{instructors.length}</div>
          </div>
          <div className="payout-summary-card">
            <div className="payout-summary-label">Số giao dịch</div>
            <div className="payout-summary-value">{totalAllTransactions}</div>
          </div>
          <div className="payout-summary-card">
            <div className="payout-summary-label">Tổng tiền sẵn sàng</div>
            <div className="payout-summary-value" style={{ color: "var(--success, #16a34a)" }}>{formatPrice(totalAllAmount)}</div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
        ) : instructors.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-cash" style={{ fontSize: 48 }}></i>
            <p className="mt-2 mb-1">Không có giảng viên nào đủ điều kiện thanh toán.</p>
            <small>Các giao dịch cần: trạng thái HOLD, đã qua thời gian giữ tiền, có giảng viên phụ trách.</small>
          </div>
        ) : (
          <div className="payout-instructor-list">
            {instructors.map((g) => {
              const hasBank = g.bank_name && g.bank_account_number && g.bank_account_name;
              return (
                <div key={g.instructor_id} className="payout-instructor-card">
                  <div className="payout-instructor-header">
                    <div className="payout-instructor-info">
                      <div className="payout-instructor-name">
                        <i className="bi bi-person-circle me-2"></i>
                        {g.instructor_name}
                      </div>
                      <div className="payout-instructor-email">{g.instructor_email}</div>
                    </div>
                    <div className="payout-instructor-amount">
                      <div className="payout-summary-label">Tổng tiền</div>
                      <div className="payout-summary-value" style={{ color: "var(--success, #16a34a)" }}>{formatPrice(g.total_amount)}</div>
                      <div className="payout-instructor-count">{g.transaction_count} giao dịch</div>
                    </div>
                  </div>

                  <div className="payout-instructor-bank">
                    <div className="payout-bank-field">
                      <span className="payout-bank-label">Tên ngân hàng</span>
                      <span className="payout-bank-value">{g.bank_name || "—"}</span>
                    </div>
                    <div className="payout-bank-field">
                      <span className="payout-bank-label">Số tài khoản</span>
                      <span className="payout-bank-value">{g.bank_account_number || "—"}</span>
                    </div>
                    <div className="payout-bank-field">
                      <span className="payout-bank-label">Chủ tài khoản</span>
                      <span className="payout-bank-value">{g.bank_account_name || "—"}</span>
                    </div>
                  </div>

                  <div className="payout-instructor-footer">
                    <div className="payout-instructor-courses">
                      {g.transactions.slice(0, 3).map((tx) => (
                        <span key={tx.id} className="payout-course-tag">{tx.course_title}</span>
                      ))}
                      {g.transactions.length > 3 && <span className="payout-course-tag">+{g.transactions.length - 3} khóa</span>}
                    </div>
                    <button
                      className="payout-btn"
                      onClick={() => openConfirmModal(g)}
                      disabled={!hasBank}
                      title={!hasBank ? "Giảng viên chưa cập nhật thông tin ngân hàng" : "Thanh toán cho giảng viên này"}
                    >
                      <i className="bi bi-cash-stack me-1"></i> Thanh toán
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal xác nhận thanh toán */}
      {selectedInstructor && (
        <div className="payout-modal-overlay" onClick={() => !processing && setSelectedInstructor(null)}>
          <div className="payout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payout-modal-header">
              <h4>Xác nhận thanh toán cho giảng viên</h4>
              <button className="payout-modal-close" onClick={() => !processing && setSelectedInstructor(null)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="payout-modal-body">
              <div className="payout-modal-info">
                <div><strong>Giảng viên:</strong> {selectedInstructor.instructor_name}</div>
                <div><strong>Số giao dịch:</strong> {selectedInstructor.transaction_count}</div>
                <div className="payout-modal-amount"><strong>Số tiền thanh toán:</strong> <span style={{ color: "var(--success, #16a34a)" }}>{formatPrice(selectedInstructor.total_amount)}</span></div>
              </div>

              <div className="payout-modal-bank">
                <div className="payout-modal-section-title">Thông tin tài khoản nhận tiền (từ hồ sơ giảng viên)</div>
                <div className="payout-bank-field">
                  <span className="payout-bank-label">Tên ngân hàng</span>
                  <span className="payout-bank-value">{selectedInstructor.bank_name || "—"}</span>
                </div>
                <div className="payout-bank-field">
                  <span className="payout-bank-label">Số tài khoản</span>
                  <span className="payout-bank-value">{selectedInstructor.bank_account_number || "—"}</span>
                </div>
                <div className="payout-bank-field">
                  <span className="payout-bank-label">Chủ tài khoản</span>
                  <span className="payout-bank-value">{selectedInstructor.bank_account_name || "—"}</span>
                </div>
              </div>

              <div className="payout-modal-confirm">
                <label className="payout-modal-check">
                  <input
                    type="checkbox"
                    checked={confirmedAgree}
                    onChange={(e) => setConfirmedAgree(e.target.checked)}
                    disabled={processing}
                  />
                  Tôi xác nhận đã kiểm tra kỹ thông tin tài khoản và số tiền trước khi thanh toán.
                </label>
              </div>
            </div>
            <div className="payout-modal-footer">
              <button className="payout-btn-cancel" onClick={() => !processing && setSelectedInstructor(null)} disabled={processing}>Hủy</button>
              <button className="payout-btn" onClick={handlePayout} disabled={processing}>
                {processing ? (
                  <><span className="spinner-border spinner-border-sm me-1"></span> Đang xử lý...</>
                ) : (
                  <><i className="bi bi-cash-stack me-1"></i> Xác nhận thanh toán</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinancePayoutPage;