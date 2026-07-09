import React from "react";

/**
 * KpiCard - Hiển thị một chỉ số thống kê dạng card.
 */
function KpiCard({ label, value, color, formatPrice }) {
  const displayValue = formatPrice ? formatPrice(value) : value;
  return (
    <div className="p-3" style={{
      background: "var(--card, #fff)", borderRadius: "var(--card-radius, 10px)",
      border: "1px solid #e9ecef", height: "100%",
    }}>
      <div className="small text-muted mb-1">{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || "var(--course-text, #1a1a2e)" }}>
        {displayValue}
      </div>
    </div>
  );
}

export default KpiCard;