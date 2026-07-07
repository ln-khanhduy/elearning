import React, { useState } from "react";

/**
 * ReviewForm - Form đánh giá khóa học với star rating.
 * Hỗ trợ: tạo mới, sửa, reply (reply không có rating).
 * Cho phép đánh giá bằng sao hoặc văn bản, không bắt buộc cả 2.
 */
function ReviewForm({
  initialRating = 0,
  initialContent = "",
  onSubmit,
  onCancel,
  loading: externalLoading,
  mode = "create", // "create" | "edit" | "reply"
}) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState(initialContent);
  const [submitting, setSubmitting] = useState(false);

  const loading = submitting || externalLoading;
  const isReply = mode === "reply";

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Không bắt buộc cả rating lẫn content, có thể chọn 1 trong 2 hoặc cả 2
    if (!isReply && rating === 0 && !content.trim()) return;

    setSubmitting(true);
    await onSubmit(rating, content.trim());
    setSubmitting(false);
  };

  const handleStarClick = (star) => {
    // Nếu click vào sao đang được chọn thì bỏ chọn (về 0)
    setRating(rating === star ? 0 : star);
  };

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      {!isReply && (
        <div className="review-form-stars">
          <span className="review-form-label">Đánh giá của bạn</span>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <i
                key={star}
                className={`bi ${
                  star <= (hoverRating || rating) ? "bi-star-fill" : "bi-star"
                }`}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleStarClick(star)}
                style={{
                  cursor: "pointer",
                  fontSize: 24,
                  color: star <= (hoverRating || rating) ? "#f59e0b" : "#d1d5db",
                  transition: "color 0.15s",
                }}
              ></i>
            ))}
          </div>
        </div>
      )}

      <div className="review-form-content">
        {isReply ? (
          <textarea
            className="review-textarea"
            rows={3}
            placeholder="Viết phản hồi..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        ) : (
          <textarea
            className="review-textarea"
            rows={4}
            placeholder={mode === "edit" ? "Chỉnh sửa đánh giá của bạn..." : "Chia sẻ trải nghiệm của bạn về khóa học này..."}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        )}
      </div>

      <div className="review-form-actions">
        {onCancel && (
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCancel}>
            Hủy
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={loading || (!isReply && rating === 0 && !content.trim())}
        >
          {loading ? (
            <><span className="spinner-border spinner-border-sm me-1"></span> Đang gửi...</>
          ) : mode === "edit" ? (
            "Lưu chỉnh sửa"
          ) : isReply ? (
            "Gửi phản hồi"
          ) : (
            "Gửi đánh giá"
          )}
        </button>
      </div>
    </form>
  );
}

export default ReviewForm;