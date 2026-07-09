import React from "react";

function BarChart({ data, labelKey, valueKey, maxValue, color, height }) {
  const h = height || 160;
  const max = maxValue || Math.max(...data.map((d) => d[valueKey]), 1);

  return (
    <div className="d-flex align-items-end gap-2" style={{ height: h }}>
      {data.map((item, i) => {
        const val = item[valueKey];
        const barH = max > 0 ? (val / max) * (h - 20) : 0;
        return (
          <div key={i} className="d-flex flex-column align-items-center flex-fill" title={`${item[labelKey]}: ${item[valueKey]}`}>
            <div style={{
              width: "100%", maxWidth: 50, height: Math.max(barH, 4),
              background: color || "var(--primary, #0f3d75)",
              borderRadius: "4px 4px 0 0", transition: "height 0.3s",
            }}></div>
            <span style={{ fontSize: 10, color: "var(--muted, #6c757d)", marginTop: 4, whiteSpace: "nowrap" }}>
              {item[labelKey]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default BarChart;