import React, { useState } from "react";
import "../../style/course-detail/course-tabs.css";

/**
 * CourseTabs - Tabs điều hướng nội dung khóa học
 * Các tab: Tổng quan, Nội dung, Đánh giá, Giảng viên
 * Dùng TabPanel để bọc nội dung từng tab
 */
function CourseTabs({ children }) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = React.Children.toArray(children).filter(Boolean);

  return (
    <div className="course-tabs">
      {/* Thanh điều hướng tabs */}
      <div className="course-tabs-nav">
        {tabs.map((tab, index) => (
          <button key={index} className={`tab-btn ${activeTab === index ? "tab-active" : ""}`}
            onClick={() => setActiveTab(index)}>
            {tab.props.label}
            {tab.props.badge !== undefined && <span className="tab-badge">{tab.props.badge}</span>}
          </button>
        ))}
      </div>
      {/* Nội dung tab đang active */}
      <div className="course-tabs-content">{tabs[activeTab]}</div>
    </div>
  );
}

/**
 * TabPanel - Component bọc nội dung mỗi tab
 * Props: label (tiêu đề tab), badge (số lượng), children (nội dung)
 */
export function TabPanel({ label, badge, children }) {
  return <div className="tab-panel">{children}</div>;
}

export default CourseTabs;
