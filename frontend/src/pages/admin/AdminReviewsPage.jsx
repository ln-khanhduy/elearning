import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { getReviews, updateReviewStatus } from "../../services/reviewService";

function AdminReviewsPage() {
  const STATUS_MAP = {
    PUBLISHED: { label: "Công khai", color: "#198754" },
    HIDDEN: { label: "Đã ẩn", color: "#6f42c1" },
    DELETED: { label: "Đã xóa", color: "#dc3545" },
  };
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getReviews();
      setReviews(data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách đánh giá.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleUpdateStatus = async (reviewId, status) => {
    const action = status === "HIDDEN" ? "ẩn" : status === "PUBLISHED" ? "hiện" : "xóa";
    if (!window.confirm(`Xác nhận ${action} đánh giá này?`)) return;
    try {
      setActionLoading(`${status}-${reviewId}`);
      await updateReviewStatus(reviewId, status);
      toast.success(`Đã ${action} đánh giá thành công!`);
      loadReviews();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const s = STATUS_MAP[status] || { label: status, color: "#6c757d" };
    return (
      <span className="admin-rv-badge" style={{ backgroundColor: s.color + "20", color: s.color }}>
        {s.label}
      </span>
    );
  };

  const getStars = (rating) => {
    if (!rating) return null;
    return (
      <span className="admin-rv-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`bi ${star <= rating ? "bi-star-fill" : "bi-star"}`}
            style={{ color: star <= rating ? "#ffc107" : "#ddd" }}
          ></i>
        ))}
      </span>
    );
  };

  const filteredReviews = statusFilter
    ? reviews.filter((r) => r.status === statusFilter)
    : reviews;

  return (
    <div className="admin-reviews-page">
      <div className="admin-reviews-header">
        <div>
          <h2>Bình luận / Đánh giá</h2>
          <p className="text-muted">Quản lý tất cả đánh giá và bình luận trong hệ thống.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-reviews-filters">
        <select
          className="admin-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PUBLISHED">Công khai</option>
          <option value="HIDDEN">Đã ẩn</option>
          <option value="DELETED">Đã xóa</option>
        </select>
        <span className="admin-rv-count">{filteredReviews.length} đánh giá</span>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="admin-reviews-empty">
          <i className="bi bi-chat-square-text"></i>
          <h4>Không có đánh giá nào</h4>
          <p>Chưa có đánh giá nào trong hệ thống.</p>
        </div>
      ) : (
        <div className="admin-reviews-list">
          {filteredReviews.map((review) => (
            <div key={review.id} className="admin-rv-card">
              <div className="admin-rv-header">
                <div className="admin-rv-user">
                  <div className="admin-rv-avatar">
                    {review.user_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <strong>{review.user_name}</strong>
                    <small className="d-block text-muted">
                      {review.course_title}
                    </small>
                  </div>
                </div>
                <div className="admin-rv-meta">
                  {getStars(review.rating)}
                  {getStatusBadge(review.status)}
                  <small className="text-muted">
                    {new Date(review.created_at).toLocaleDateString("vi-VN")}
                  </small>
                </div>
              </div>
              <div className="admin-rv-content">
                <p>{review.content}</p>
              </div>
              <div className="admin-rv-actions">
                {review.status === "PUBLISHED" && (
                  <button
                    className="admin-rv-btn-hide"
                    onClick={() => handleUpdateStatus(review.id, "HIDDEN")}
                    disabled={actionLoading === `HIDDEN-${review.id}`}
                  >
                    <i className="bi bi-eye-slash"></i> Ẩn
                  </button>
                )}
                {review.status === "HIDDEN" && (
                  <button
                    className="admin-rv-btn-show"
                    onClick={() => handleUpdateStatus(review.id, "PUBLISHED")}
                    disabled={actionLoading === `PUBLISHED-${review.id}`}
                  >
                    <i className="bi bi-eye"></i> Hiện lại
                  </button>
                )}
                {review.status !== "DELETED" && (
                  <button
                    className="admin-rv-btn-delete"
                    onClick={() => handleUpdateStatus(review.id, "DELETED")}
                    disabled={actionLoading === `DELETED-${review.id}`}
                  >
                    <i className="bi bi-trash"></i> Xóa
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminReviewsPage;
