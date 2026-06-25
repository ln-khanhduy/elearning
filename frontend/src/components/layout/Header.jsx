import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import logoSrc from "../../img/logo.png";
import { logoutApi } from "../../api/authAPI";
import { useUser } from "../../context/UserContext";

function Header({ onToggleSidebar }) {
  const [openMenu, setOpenMenu] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, clearUserSession } = useUser();

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error(error);
    } finally {
      clearUserSession();
      setOpenMenu(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="header-container">
      <div className="container-fluid header-wrapper">
        <div className="header-left">
          <button type="button" className="sidebar-toggle d-lg-none" onClick={onToggleSidebar} aria-label="Toggle sidebar">
            <i className="bi bi-list"></i>
          </button>
          <Link to="/home" className="logo-box text-decoration-none">
            <img src={logoSrc} alt="Logo" className="logo-img" />
            <div className="logo fw-bold">LMS Learn</div>
          </Link>
          <nav className="nav-menu d-none d-lg-flex">
            <Link to="/home">Trang chủ</Link>
            <Link to="/courses">Khóa học</Link>
            <Link to="/instructors">Giảng viên</Link>
            <Link to="/contact">Liên hệ</Link>
            <Link to="/profile">Hồ sơ</Link>
          </nav>
        </div>
        <div className="header-right">
          <div className="search-box d-none d-md-flex">
            <i className="bi bi-search"></i>
            <input type="text" placeholder="Tìm khóa học..." />
          </div>
          {loading ? (
            <div className="header-auth-loading"></div>
          ) : isAuthenticated ? (
            <div className="user-actions">
              <span className="user-email d-none d-md-inline">{user?.email}</span>
              <div className="user-menu">
                <button type="button" className="avatar-btn" onClick={() => setOpenMenu((prev) => !prev)}>
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="avatar-img" />
                  ) : (
                    <span className="avatar-circle">{(user?.email || "U").charAt(0).toUpperCase()}</span>
                  )}
                </button>
                {openMenu && (
                  <div className="user-dropdown">
                    {user?.role === "SUPERADMIN" && (
                      <Link to="/dashboard" className="user-dropdown-item" onClick={() => setOpenMenu(false)}>
                        <i className="bi bi-grid me-2"></i>Dashboard
                      </Link>
                    )}
                    <Link to="/profile" className="user-dropdown-item" onClick={() => setOpenMenu(false)}>Hồ sơ</Link>
                    <button type="button" className="user-dropdown-item logout-item" onClick={handleLogout}>Đăng xuất</button>
                  </div>
                )}
              </div>
              <button type="button" className="btn btn-outline-danger btn-sm px-3 d-none d-md-inline-block" onClick={handleLogout}>Đăng xuất</button>
            </div>
          ) : (
            <>
              <Link to="/instructor/apply" className="btn btn-outline-warning btn-sm px-3 me-2">Trở thành giảng viên</Link>
              <Link to="/login" className="btn btn-outline-primary btn-sm px-3">Đăng nhập</Link>
              <Link to="/register" className="btn btn-primary btn-sm px-3">Đăng ký</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
