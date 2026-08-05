import { memo } from "react";

function LoadingSkeleton({ type = "form" }) {
  if (type === "form") {
    return (
      <div className="cw-card">
        <div className="cw-skeleton cw-skeleton-title" style={{ width: "40%" }}></div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ marginBottom: 20 }}>
            <div className="cw-skeleton cw-skeleton-text" style={{ width: "30%" }}></div>
            <div className="cw-skeleton" style={{ height: 40, width: "100%" }}></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "curriculum") {
    return (
      <div className="cw-curriculum-layout">
        <div className="cw-curriculum-sidebar" style={{ padding: 20 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="cw-section" style={{ padding: 16, marginBottom: 12 }}>
              <div className="cw-skeleton cw-skeleton-text" style={{ width: "60%" }}></div>
              <div className="cw-skeleton cw-skeleton-text" style={{ width: "40%" }}></div>
            </div>
          ))}
        </div>
        <div style={{ flex: 1, padding: 40 }}>
          <div className="cw-skeleton cw-skeleton-title" style={{ width: "50%" }}></div>
          <div className="cw-skeleton cw-skeleton-text" style={{ width: "80%" }}></div>
          <div className="cw-skeleton cw-skeleton-text" style={{ width: "60%" }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="cw-card">
      <div className="cw-skeleton cw-skeleton-title"></div>
      <div className="cw-skeleton cw-skeleton-text"></div>
      <div className="cw-skeleton cw-skeleton-text"></div>
      <div className="cw-skeleton cw-skeleton-text"></div>
    </div>
  );
}

export default memo(LoadingSkeleton);
