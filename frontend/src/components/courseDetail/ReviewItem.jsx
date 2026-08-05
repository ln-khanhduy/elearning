import React, { useState } from "react";
import ReviewForm from "./ReviewForm";

/**
 * ReviewItem - Hiển thị một đánh giá kèm replies.
 * Hỗ trợ: sửa, xóa, trả lời.
 */
function ReviewItem({ review, userId, onUpdate, onDelete, onReply }) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const isOwner = userId && review.user === userId;
  const hasReplies = review.replies && review.replies.length > 0;

  const handleUpdate = async (rating, content) => {
    const success = await onUpdate(review.id, rating, content);
    if (success) setShowEditForm(false);
  };

  const handleReply = async (rating, content) => {
    const success = await onReply(review.id, content);
    if (success) setShowReplyForm(false);
  };

  const handleDelete = async () => {
    if (window.confirm("Bạn có chắc muốn xóa đánh giá này?")) {
      await onDelete(review.id);
    }
  };

  // Render đánh giá (không phải reply)
  const userAvatar = review.user_avatar || null;
  const userName = review.user_name || "Người dùng";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="review-item">
      <div className="review-item-header">
        <div className="review-item-avatar">
          {userAvatar ? (
            <img src={userAvatar} alt={userName} className="review-avatar-img" />
          ) : (
            <span className="review-avatar-circle">{userInitial}</span>
          )}
        </div>
        <div className="review-item-user">
          <strong className="review-item-name">{userName}</strong>
          <div className="review-item-meta">
            {review.rating && (
              <span className="review-item-stars">
                {[1, 2, 3, 4, 5].map((s) => (
                  <i
                    key={s}
                    className={`bi ${s <= review.rating ? "bi-star-fill" : "bi-star"}`}
                    style={{ color: s <= review.rating ? "#f59e0b" : "#d1d5db", fontSize: 12 }}
                  ></i>
                ))}
              </span>
            )}
            <span className="review-item-date">
              {new Date(review.created_at).toLocaleDateString("vi-VN")}
            </span>
            {review.edited_at && (
              <span className="review-item-edited">(đã chỉnh sửa)</span>
            )}
          </div>
        </div>
        {isOwner && !showEditForm && (
          <div className="review-item-actions">
            <button className="review-action-btn" onClick={() => setShowEditForm(true)} title="Sửa">
              <i className="bi bi-pencil"></i>
            </button>
            <button className="review-action-btn" onClick={handleDelete} title="Xóa">
              <i className="bi bi-trash"></i>
            </button>
          </div>
        )}
      </div>

      {showEditForm ? (
        <ReviewForm
          initialRating={review.rating || 0}
          initialContent={review.content}
          onSubmit={handleUpdate}
          onCancel={() => setShowEditForm(false)}
          mode="edit"
        />
      ) : (
        <p className="review-item-content">{review.content}</p>
      )}

      <div className="review-item-footer">
        {!showEditForm && (
          <button className="review-reply-btn" onClick={() => setShowReplyForm(!showReplyForm)}>
            <i className="bi bi-reply"></i> Trả lời
          </button>
        )}
        {hasReplies && (
          <button className="review-toggle-replies" onClick={() => setShowReplies(!showReplies)}>
            {showReplies
              ? `Ẩn ${review.replies.length} phản hồi`
              : `Xem ${review.replies.length} phản hồi`}
          </button>
        )}
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <div className="review-reply-form">
          <ReviewForm
            onSubmit={handleReply}
            onCancel={() => setShowReplyForm(false)}
            mode="reply"
          />
        </div>
      )}

      {/* Replies */}
      {showReplies && hasReplies && (
        <div className="review-replies">
          {review.replies.map((reply) => (
            <ReviewReply key={reply.id} reply={reply} />
          ))}
        </div>
      )}
    </div>
  );
}

/** ReviewReply - Một phản hồi đơn giản (không có actions cho reply) */
function ReviewReply({ reply }) {
  const userAvatar = reply.user_avatar || null;
  const userName = reply.user_name || "Người dùng";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="review-reply">
      <div className="review-reply-avatar">
        {userAvatar ? (
          <img src={userAvatar} alt={userName} className="review-avatar-img" />
        ) : (
          <span className="review-avatar-circle-sm">{userInitial}</span>
        )}
      </div>
      <div className="review-reply-body">
        <div className="review-reply-header">
          <strong className="review-reply-name">{userName}</strong>
          <span className="review-item-date">
            {new Date(reply.created_at).toLocaleDateString("vi-VN")}
          </span>
        </div>
        <p className="review-reply-content">{reply.content}</p>
      </div>
    </div>
  );
}

export default ReviewItem;