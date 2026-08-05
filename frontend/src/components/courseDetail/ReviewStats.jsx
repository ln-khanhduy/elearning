import React from "react";

/**
 * ReviewStats - Hiển thị thống kê đánh giá khóa học.
 * Gồm: điểm trung bình, số lượng đánh giá, biểu đồ phân phối sao.
 */
function ReviewStats({ stats }) {
  if (!stats || stats.total_count === 0) return null;

  const { avg_rating, total_count, distribution } = stats;
  const maxCount = Math.max(...Object.values(distribution || {}), 1);

  return (
    <div className="review-stats">
      <div className="review-stats-average">
        <span className="review-stats-rating">{avg_rating.toFixed(1)}</span>
        <div className="review-stars-display">
          {[1, 2, 3, 4, 5].map((star) => (
            <i
              key={star}
              className={`bi ${
                star <= Math.round(avg_rating) ? "bi-star-fill" : "bi-star"
              }`}
              style={{ color: star <= Math.round(avg_rating) ? "#f59e0b" : "#d1d5db" }}
            ></i>
          ))}
        </div>
        <span className="review-stats-total">{total_count} đánh giá</span>
      </div>
      <div className="review-stats-distribution">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution?.[star] || 0;
          const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
          return (
            <div key={star} className="review-stats-bar-row">
              <span className="review-stats-bar-label">{star} <i className="bi bi-star-fill"></i></span>
              <div className="review-stats-bar-track">
                <div
                  className="review-stats-bar-fill"
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
              <span className="review-stats-bar-count">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ReviewStats;