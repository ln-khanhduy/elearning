import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { sidebarItems } from "../../utils/sidebarItems";
import { useUser } from "../../context/UserContext";
import { logoutApi } from "../../api/authAPI";

function Sidebar({ isOpen, onClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { user, clearUserSession } = useUser();
  const roleCode = typeof user?.role === "object" && user?.role !== null ? user.role.code : user?.role;

  // Lọc: chỉ giữ item hợp lệ, và chỉ giữ group nếu có ít nhất 1 item hợp lệ trong group đó
  const visibleItems = sidebarItems.filter((item, index) => {
    if (item.type === "group") {
      for (let i = index + 1; i < sidebarItems.length; i++) {
        const next = sidebarItems[i];
        if (next.type === "group") break;
        if (next.roles.includes(roleCode)) return true;
      }
      return false;
    }
    return item.roles.includes(roleCode);
  });

  const hasItemAfterGroup = (index) => {
    return visibleItems.slice(index + 1).some((item) => item.type === "item");
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error(error);
    } finally {
      clearUserSession();
      navigate("/login", { replace: true });
    }
  };

  const toggleCollapse = () => {
    setCollapsed((prev) => !prev);
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className={`app-sidebar ${collapsed ? "collapsed" : ""} ${isOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-collapse-top">
        <button className="sidebar-collapse-btn d-none d-lg-flex" onClick={toggleCollapse} title={collapsed ? "Mở rộng" : "Thu gọn"}>
          <i className={`bi ${collapsed ? "bi-chevron-right" : "bi-chevron-left"}`}></i>
        </button>
        <button className="sidebar-collapse-btn d-lg-none" onClick={onClose} title="Đóng">
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      <nav className="sidebar-menu">
        {visibleItems.map((item, index) => {
          if (item.type === "group") {
            if (!hasItemAfterGroup(index)) return null;
            return <div key={index} className={`sidebar-group ${collapsed ? "collapsed" : ""}`}>{!collapsed ? item.label : "—"}</div>;
          }

          return (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"} title={collapsed ? item.label : undefined} onClick={handleNavClick} end>
              <i className={`bi ${item.icon}`}></i>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <button className="sidebar-logout" onClick={handleLogout} title={collapsed ? "Đăng xuất" : undefined}>
        <i className="bi bi-box-arrow-right"></i>
        {!collapsed && <span>Đăng xuất</span>}
      </button>
    </aside>
  );
}

export default Sidebar;
