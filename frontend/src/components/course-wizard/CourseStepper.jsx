import { memo } from "react";

const STEPS = [
  { label: "Thông tin", icon: "bi-info-circle" },
  { label: "Nội dung", icon: "bi-collection" },
  { label: "Giá bán", icon: "bi-currency-dollar" },
  { label: "Xem lại", icon: "bi-eye" },
  { label: "Xuất bản", icon: "bi-rocket-takeoff" },
];

function CourseStepper({ currentStep, onStepClick }) {
  return (
    <>
      {/* Desktop stepper */}
      <div className="cw-stepper-wrapper">
        <div className="cw-stepper">
          {STEPS.map((step, index) => {
            const stepNum = index + 1;
            const isActive = stepNum === currentStep;
            const isCompleted = stepNum < currentStep;
            const isClickable = stepNum <= currentStep;

            return (
              <div key={index} className="cw-step-group" style={{ display: "flex", alignItems: "center" }}>
                {index > 0 && (
                  <div className={`cw-step-connector ${stepNum <= currentStep ? "completed" : ""}`} />
                )}
                <div
                  className="cw-step-item"
                  onClick={() => isClickable && onStepClick?.(stepNum)}
                  style={{ cursor: isClickable ? "pointer" : "default" }}
                >
                  <div
                    className={`cw-step-number ${isActive ? "active" : isCompleted ? "completed" : "inactive"}`}
                  >
                    {isCompleted ? <i className="bi bi-check"></i> : stepNum}
                  </div>
                  <span className={`cw-step-label ${isActive ? "active" : isCompleted ? "completed" : ""}`}>
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile stepper */}
      <div className="cw-stepper-mobile">
        <div className="cw-stepper-mobile-label">
          Bước {currentStep}/5: {STEPS[currentStep - 1]?.label}
        </div>
        <div className="cw-stepper-mobile-bar">
          <div
            className="cw-stepper-mobile-fill"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>
      </div>
    </>
  );
}

export default memo(CourseStepper);
