import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import logoSrc from "../../img/logo.png";
import { clearAuthSessionData } from "../../utils/authToken";
import { logoutApi } from "../../api/authAPI";
import { useAuth } from "../../context/UserContext";
import "../../style/layout-css/header.css";

function Header() {
  const [openMenu, setOpenMenu] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, setUser } = useAuth();

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error(error);
    } finally {
      clearAuthSessionData();
      setUser(null);
      setOpenMenu(false);
      navigate("/login");
    }
  };

  return (
    <header className="header-container">
      <div className="container-fluid header-wrapper">
        <div className="header-left">
          <div className="logo-box">
            <img src={logoSrc} alt="Logo" className="logo-img" />
            <div className="logo fw-bold">LMS Learn</div>
          </div>

          <nav className="nav-menu">
            <Link to="/home">Trang chủ</Link>
            <Link to="/courses">Khóa học</Link>
            <Link to="/instructors">Giảng viên</Link>
            <Link to="/contact">Liên hệ</Link>
          </nav>
        </div>

        <div className="header-right">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input type="text" placeholder="Tìm khóa học..." />
          </div>

          {loading ? (
            <div className="header-auth-loading"></div>
          ) : isAuthenticated ? (
            <div className="user-actions">
              <span className="user-fullname">{user?.full_name || user?.email}</span>

              <div className="user-menu">
                <button type="button" className="avatar-btn" onClick={() => setOpenMenu((prev) => !prev)}>
                  {user?.avatar_url ? <img src={user.avatar_url} alt="Avatar" className="avatar-img" /> : <span className="avatar-circle">{user?.full_name?.charAt(0)?.toUpperCase() || "U"}</span>}
                </button>

                {openMenu && (
                  <div className="user-dropdown">
                    <Link to="/profile" className="user-dropdown-item" onClick={() => setOpenMenu(false)}>Hồ sơ</Link>
                    <button type="button" className="user-dropdown-item logout-item" onClick={handleLogout}>Đăng xuất</button>
                  </div>
                )}
              </div>

              <button type="button" className="btn btn-outline-danger btn-sm px-3" onClick={handleLogout}>Đăng xuất</button>
            </div>
          ) : (
            <>
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