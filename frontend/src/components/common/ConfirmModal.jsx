import React from "react";

/**
 * ConfirmModal - Modal xác nhận thay thế window.confirm()
 * Props: show, title, message, confirmLabel, cancelLabel, variant, onConfirm, onCancel
 */
export default function ConfirmModal({
  show, title = "Xác nhận", message = "Bạn có chắc chắn?",
  confirmLabel = "Xác nhận", cancelLabel = "Hủy", variant = "primary",
  onConfirm, onCancel,
}) {
  if (!show) return null;

  return (
    <div className="modal-backdrop-custom" onClick={onCancel}>
      <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
        <h5 className="fw-bold mb-3">{title}</h5>
        <p className="text-muted mb-4">{message}</p>
        <div className="d-flex gap-2 justify-content-end">
          <button type="button" className="course-btn-outline" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className={`course-btn-${variant}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}