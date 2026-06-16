import React, { useState } from "react";
import "../../style/course-detail/course-tabs.css";

/**
 * Tabs điều hướng nội dung khóa học
 * Các tab: Tổng quan, Nội dung, Đánh giá, Giảng viên
 */
function CourseTabs({ children }) {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = React.Children.toArray(children).filter(Boolean);

  return (
    <div className="course-tabs">
      <div className="course-tabs-nav">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`tab-btn ${activeTab === index ? "tab-active" : ""}`}
            onClick={() => setActiveTab(index)}
          >
            {tab.props.label}
            {tab.props.badge !== undefined && (
              <span className="tab-badge">{tab.props.badge}</span>
            )}
          </button>
        ))}
      </div>
      <div className="course-tabs-content">
        {tabs[activeTab]}
      </div>
    </div>
  );
}

/**
 * TabPanel - component bọc nội dung mỗi tab
 */
export function TabPanel({ label, badge, children }) {
  return <div className="tab-panel">{children}</div>;
}

export default CourseTabs;
