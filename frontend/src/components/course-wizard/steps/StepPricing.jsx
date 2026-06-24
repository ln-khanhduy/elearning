import { memo, useCallback, useState, useRef, useEffect } from "react";

function formatPrice(num) {
  if (!num || isNaN(num)) return "0";
  return Number(num).toLocaleString("vi-VN") + "đ";
}

function formatNumberInput(value) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num) || num === 0) return num === 0 ? "0" : "";
  return Number(num).toLocaleString("vi-VN");
}

function PriceInput({ name, value, placeholder, error, onChange, min }) {
  const [displayValue, setDisplayValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value ? formatNumberInput(String(value)) : "");
    }
  }, [value, isFocused]);

  const handleChange = useCallback(
    (e) => {
      const raw = e.target.value;
      const digits = raw.replace(/\D/g, "");
      setDisplayValue(formatNumberInput(digits));
      onChange({ target: { name, value: digits } });
    },
    [name, onChange]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    const digits = displayValue.replace(/\D/g, "");
    setDisplayValue(digits);
  }, [displayValue]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    const digits = displayValue.replace(/\D/g, "");
    setDisplayValue(digits ? formatNumberInput(digits) : "");
  }, [displayValue]);

  return (
    <div className="cw-price-input-group">
      <input
        type="text"
        inputMode="numeric"
        name={name}
        className={`cw-input ${error ? "error" : ""}`}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        min={min}
      />
      <span style={{ fontSize: 14, fontWeight: 600, color: "#495057", whiteSpace: "nowrap" }}>
        VNĐ
      </span>
    </div>
  );
}

function StepPricing({ formData, errors, onFieldChange }) {
  const price = Number(formData.price) || 0;

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      onFieldChange(name, value);
    },
    [onFieldChange]
  );

  return (
    <div className="cw-card">
      <h3 className="cw-card-title">Giá bán & Cài đặt</h3>

      <div className="cw-form-grid">
        <div className="cw-form-group">
          <label className="cw-form-label">
            <span className="cw-form-label-text">
              Giá bán <span className="text-danger">*</span>
            </span>
          </label>
          <PriceInput
            name="price"
            value={formData.price}
            onChange={handleChange}
            error={errors.price}
            min="0"
          />
          {errors.price && (
            <div className="cw-error-text">
              <i className="bi bi-exclamation-circle"></i>
              {errors.price}
            </div>
          )}
        </div>
      </div>

      {/* Price Preview */}
      {price > 0 && (
        <div className="cw-price-preview">
          <div className="cw-price-preview-row total">
            <span>Giá bán</span>
            <span>{formatPrice(price)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(StepPricing);