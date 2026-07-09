import React from "react";

function TopCourses({ courses, valueKey, maxValue, formatPrice }) {
  if (!courses || courses.length === 0) return <p className="text-muted small mb-0">Chưa có dữ liệu.</p>;
  const max = maxValue || Math.max(...courses.map((c) => c[valueKey]), 1);

  return (
    <>
      {courses.map(([title, data]) => {
        const w = (data[valueKey] / max) * 100;
        return (
          <div key={title} className="mb-2">
            <div className="d-flex justify-content-between mb-1" style={{ fontSize: "var(--font-size-xs, 12px)" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{title}</span>
              <span style={{ fontWeight: 500, flexShrink: 0, marginLeft: 8 }}>
                {formatPrice ? formatPrice(data[valueKey]) : data[valueKey]}
              </span>
            </div>
            <div style={{ height: 6, background: "#e9ecef", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${w}%`, height: "100%", background: "var(--primary, #0f3d75)", borderRadius: 3 }}></div>
            </div>
          </div>
        );
      })}
    </>
  );
}

export default TopCourses;