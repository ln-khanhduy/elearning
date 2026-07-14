import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import logoSrc from "../../img/logo.png";
import { logoutApi } from "../../api/authAPI";
import { useUser } from "../../context/UserContext";
import NotificationBell from "../notification/NotificationBell";

function Header({ onToggleSidebar }) {
  const [openMenu, setOpenMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, clearUserSession } = useUser();
  const searchTimeoutRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

  const refreshWishlistCount = useCallback(() => {
    import("../../api/wishlistAPI").then(({ getWishlistCountApi }) => {
      getWishlistCountApi().then((res) => {
        setWishlistCount(res?.data?.count ?? 0);
      }).catch(() => {});
    });
  }, []);

  const refreshCartCount = useCallback(() => {
    import("../../api/cartAPI").then(({ getCartApi }) => {
      getCartApi().then((res) => {
        const data = res?.data || res || {};
        setCartCount(data?.item_count || data?.items?.length || 0);
      }).catch(() => {});
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshWishlistCount();
      refreshCartCount();
    }
  }, [isAuthenticated, refreshWishlistCount, refreshCartCount]);

  useEffect(() => {
    const handleWishlistChange = () => refreshWishlistCount();
    const handleCartChange = () => refreshCartCount();
    window.addEventListener("wishlist-change", handleWishlistChange);
    window.addEventListener("cart-change", handleCartChange);
    return () => {
      window.removeEventListener("wishlist-change", handleWishlistChange);
      window.removeEventListener("cart-change", handleCartChange);
    };
  }, [refreshWishlistCount, refreshCartCount]);

  useEffect(() => {
    if (showMobileSearch && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [showMobileSearch]);

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/courses?q=${encodeURIComponent(q)}`);
    } else {
      navigate("/courses");
    }
    setShowMobileSearch(false);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      const trimmed = value.trim();
      if (trimmed) {
        navigate(`/courses?q=${encodeURIComponent(trimmed)}`);
        setShowMobileSearch(false);
      }
    }, 400);
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
            <NavLink to="/home" className={({ isActive }) => isActive ? "active" : ""}>Trang chủ</NavLink>
            <NavLink to="/courses" className={({ isActive }) => isActive ? "active" : ""}>Khóa học</NavLink>
            {isAuthenticated && (
              <NavLink to="/my-courses" className={({ isActive }) => isActive ? "active" : ""}>Khóa học của tôi</NavLink>
            )}
            {isAuthenticated && (
              <NavLink to="/profile" className={({ isActive }) => isActive ? "active" : ""}>Hồ sơ</NavLink>
            )}
            <NavLink to="/contact" className={({ isActive }) => isActive ? "active" : ""}>Liên hệ</NavLink>
          </nav>
        </div>
        <div className="header-right">
          {isAuthenticated && !loading && (
            <>
              {/* Desktop search */}
              <form className="search-box d-none d-md-flex" onSubmit={handleSearchSubmit}>
                <button type="submit" className="search-submit-btn" aria-label="Tìm kiếm">
                  <i className="bi bi-search"></i>
                </button>
                <input
                  type="text"
                  placeholder="Tìm khóa học..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </form>
              {/* Mobile search toggle */}
              <button type="button" className="header-icon-link d-md-none" onClick={() => setShowMobileSearch(true)} title="Tìm kiếm">
                <i className="bi bi-search"></i>
              </button>
            </>
          )}
          {loading ? (
            <div className="header-auth-loading"></div>
          ) : isAuthenticated ? (
            <div className="user-actions">
              <Link to="/my-wishlist" className="header-icon-link position-relative" title="Yêu thích">
                <i className="bi bi-heart"></i>
                {wishlistCount > 0 && <span className="wishlist-badge">{wishlistCount > 99 ? "99+" : wishlistCount}</span>}
              </Link>
              <Link to="/cart" className="header-icon-link position-relative" title="Giỏ hàng">
                <i className="bi bi-cart3"></i>
                {cartCount > 0 && <span className="wishlist-badge">{cartCount > 99 ? "99+" : cartCount}</span>}
              </Link>
              <NotificationBell />
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
                    <Link to="/my-learning" className="user-dropdown-item" onClick={() => setOpenMenu(false)}>
                      <i className="bi bi-play-circle me-2"></i>Tiếp tục học
                    </Link>
                    <Link to="/profile" className="user-dropdown-item" onClick={() => setOpenMenu(false)}>
                      <i className="bi bi-person-circle me-2"></i>Hồ sơ
                    </Link>
                    <button type="button" className="user-dropdown-item logout-item" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>Đăng xuất
                    </button>
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

      {/* Mobile search overlay */}
      {showMobileSearch && (
        <div className="mobile-search-overlay">
          <div className="mobile-search-bar">
            <i className="bi bi-search"></i>
            <input
              ref={mobileSearchInputRef}
              type="text"
              placeholder="Tìm khóa học..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearchSubmit(e); }}
            />
            <button type="button" className="mobile-search-close" onClick={() => { setShowMobileSearch(false); setSearchQuery(""); }}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;