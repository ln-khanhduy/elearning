import { NavLink } from "react-router-dom";
import { sidebarItems } from "../../utils/sidebarItems";
import "../../style/layout-css/sidebar.css";

function Sidebar() {
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  const visibleItems = sidebarItems.filter((item) => {
    if (item.type === "group") return true;
    return item.roles.includes(role);
  });

  const hasItemAfterGroup = (index) => {
    return visibleItems.slice(index + 1).some((item) => item.type === "item");
  };

  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">F</div>
        <span>FUTURE</span>
      </div>

      <nav className="sidebar-menu">
        {visibleItems.map((item, index) => {
          if (item.type === "group") {
            if (!hasItemAfterGroup(index)) return null;
            return <div key={index} className="sidebar-group">{item.label}</div>;
          }

          return (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
              <i className={`bi ${item.icon}`}></i>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <button className="sidebar-logout">
        <i className="bi bi-box-arrow-right"></i>
        <span>Đăng xuất</span>
      </button>
    </aside>
  );
}

export default Sidebar;