import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Sidebar from "./Sidebar";

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="main-layout">
      <div className="main-layout-left">
        <Header onToggleSidebar={toggleSidebar} />
        <div className="main-layout-body">
          {/* Overlay cho mobile khi sidebar mở */}
          {sidebarOpen && <div className="sidebar-overlay d-lg-none" onClick={closeSidebar}></div>}
          <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
          <main className="main-content">
            <Outlet />
          </main>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default MainLayout;
