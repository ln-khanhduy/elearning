import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import logoSrc from "../../img/logo.png";
import { logoutApi } from "../../api/authAPI";
import { useUser } from "../../context/UserContext";
import "../../style/layout-css/header.css";

function Header() {
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
          <Link to="/home" className="logo-box text-decoration-none">
            <img src={logoSrc} alt="Logo" className="logo-img" />
            <div className="logo fw-bold">LMS Learn</div>
          </Link>

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
              <span className="user-email">{user?.email}</span>

              <div className="user-menu">
                <button
                  type="button"
                  className="avatar-btn"
                  onClick={() => setOpenMenu((prev) => !prev)}
                >
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="avatar-img" />
                  ) : (
                    <span className="avatar-circle">
                      {(user?.email || "U").charAt(0).toUpperCase()}
                    </span>
                  )}
                </button>

                {openMenu && (
                  <div className="user-dropdown">
                    <Link
                      to="/profile"
                      className="user-dropdown-item"
                      onClick={() => setOpenMenu(false)}
                    >
                      Hồ sơ
                    </Link>

                    <button
                      type="button"
                      className="user-dropdown-item logout-item"
                      onClick={handleLogout}
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="btn btn-outline-danger btn-sm px-3"
                onClick={handleLogout}
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline-primary btn-sm px-3">
                Đăng nhập
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm px-3">
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;