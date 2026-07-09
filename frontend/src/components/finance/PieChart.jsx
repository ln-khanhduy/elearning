import React from "react";

function PieChart({ data, labelKey, valueKey, colorKey }) {
  const total = data.reduce((s, d) => s + Number(d[valueKey] || 0), 0);

  return (
    <div className="d-flex align-items-center gap-3">
      <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
        <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
          {(() => {
            let offset = 0;
            const circumference = 2 * Math.PI * 14;
            return data.filter((d) => Number(d[valueKey] || 0) > 0).map((d, i) => {
              const p = Number(d[valueKey]) / total;
              const length = p * circumference;
              const seg = (
                <circle key={i} r="14" cx="18" cy="18" fill="none"
                  stroke={d[colorKey] || "#6b7280"} strokeWidth="4"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += length;
              return seg;
            });
          })()}
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {data.filter((d) => Number(d[valueKey] || 0) > 0).map((d, i) => {
          const pct = total > 0 ? ((Number(d[valueKey]) / total) * 100).toFixed(1) : "0";
          return (
            <div key={i} className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: "var(--font-size-xs, 12px)" }}>
              <span>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: d[colorKey] || "#6b7280", marginRight: 6 }}></span>
                {d[labelKey]}
              </span>
              <span style={{ fontWeight: 500 }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PieChart;