import { memo } from "react";

function StickyActionBar({
  currentStep,
  totalSteps = 5,
  onPrevious,
  onNext,
  onSaveDraft,
  saving,
  isFirstStep,
  isLastStep,
  nextLabel,
  hidePrevious,
}) {
  return (
    <div className="cw-action-bar">
      <div className="cw-action-left">
        <button
          type="button"
          className="cw-btn cw-btn-secondary"
          onClick={onSaveDraft}
          disabled={saving}
        >
          <i className="bi bi-cloud-upload"></i>
          {saving ? "Đang lưu..." : "Lưu nháp"}
        </button>
      </div>

      <div className="cw-action-right">
        {!isFirstStep && !hidePrevious && (
          <button
            type="button"
            className="cw-btn cw-btn-secondary"
            onClick={onPrevious}
          >
            <i className="bi bi-chevron-left"></i>
            Quay lại
          </button>
        )}

        {!isLastStep ? (
          <button
            type="button"
            className="cw-btn cw-btn-primary"
            onClick={onNext}
          >
            {nextLabel || "Tiếp theo"}
            <i className="bi bi-chevron-right"></i>
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default memo(StickyActionBar);
