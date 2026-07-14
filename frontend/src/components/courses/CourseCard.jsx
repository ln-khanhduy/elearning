import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { addToWishlistApi, removeFromWishlistApi } from "../../api/wishlistAPI";
import { addToCartApi, removeFromCartApi } from "../../api/cartAPI";
import { useUser } from "../../context/UserContext";

/**
 * Card hiển thị thông tin khóa học
 * Bao gồm: thumbnail, title, instructor (avatar + tên), rating, level, category, price, wishlist, cart
 */
function CourseCard({ course }) {
  const {
    id,
    title,
    thumbnail_url,
    assigned_instructor_name,
    assigned_instructor_avatar,
    category_name,
    level,
    price,
    rating,
    student_count,
    duration,
    is_wishlisted: initialWishlisted,
  } = course;
  const { isAuthenticated } = useUser();
  const [wishlisted, setWishlisted] = useState(!!initialWishlisted);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  const instructor_name = assigned_instructor_name;
  const instructor_avatar = assigned_instructor_avatar;

  // Format giá
  const formatPrice = (val) => {
    if (val === undefined || val === null) return null;
    const num = Number(val);
    if (num === 0) return "Miễn phí";
    return `${num.toLocaleString("vi-VN")}₫`;
  };

  // Format đánh giá
  const displayRating = rating ? Number(rating).toFixed(1) : null;

  // Level badge color
  const levelLabel = level
    ? { BEGINNER: "Cơ bản", INTERMEDIATE: "Trung cấp", ADVANCED: "Nâng cao" }[
        level
      ] || level
    : null;

  // Get first letter for avatar fallback
  const avatarLetter = (instructor_name || "G")[0].toUpperCase();

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để sử dụng tính năng này.");
      return;
    }
    if (wishlistLoading) return;
    setWishlistLoading(true);
    try {
      if (wishlisted) {
        await removeFromWishlistApi(id);
        setWishlisted(false);
        toast.success("Đã xóa khỏi danh sách yêu thích.");
      } else {
        await addToWishlistApi(id);
        setWishlisted(true);
        toast.success("Đã thêm vào danh sách yêu thích.", {
          action: {
            text: "Hoàn tác",
            onClick: () => {
              removeFromWishlistApi(id).then(() => {
                setWishlisted(false);
                window.dispatchEvent(new Event("wishlist-change"));
              }).catch(() => {});
            },
          },
        });
      }
      window.dispatchEvent(new Event("wishlist-change"));
    } catch (err) {
      toast.error("Không thể thao tác. Vui lòng thử lại.");
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để sử dụng tính năng này.");
      return;
    }
    if (cartLoading) return;
    setCartLoading(true);
    try {
      await addToCartApi(id);
      window.dispatchEvent(new Event("cart-change"));
      toast.success("Đã thêm vào giỏ hàng.", {
        action: {
          text: "Hoàn tác",
          onClick: () => {
            removeFromCartApi(id).then(() => {
              window.dispatchEvent(new Event("cart-change"));
            }).catch(() => {});
          },
        },
      });
    } catch (err) {
      toast.error(err.message || "Không thể thêm vào giỏ hàng.");
    } finally {
      setCartLoading(false);
    }
  };

  return (
    <div className="course-card">
      {/* Thumbnail */}
      <Link to={`/courses/${id}`} className="course-card-image-link">
        <div className="course-card-image">
          {thumbnail_url ? (
            <img
              src={thumbnail_url}
              alt={title}
              loading="lazy"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className="course-card-placeholder"
            style={{ display: thumbnail_url ? "none" : "flex" }}
          >
            <i className="bi bi-book"></i>
            <span>{category_name || "Khóa học"}</span>
          </div>
          {category_name && (
            <span className="course-card-badge">{category_name}</span>
          )}
          {/* Wishlist button */}
          <button
            className={`course-card-wishlist-btn ${wishlisted ? "active" : ""}`}
            onClick={handleToggleWishlist}
            disabled={wishlistLoading}
            title={wishlisted ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
          >
            <i className={`bi ${wishlistLoading ? "bi-arrow-repeat spin" : wishlisted ? "bi-heart-fill" : "bi-heart"}`}></i>
          </button>
          {/* Cart button */}
          <button
            className="course-card-cart-btn"
            onClick={handleAddToCart}
            disabled={cartLoading}
            title="Thêm vào giỏ hàng"
          >
            <i className={`bi ${cartLoading ? "bi-arrow-repeat spin" : "bi-cart-plus"}`}></i>
          </button>
        </div>
      </Link>

      {/* Body */}
      <div className="course-card-body">
        <Link to={`/courses/${id}`} className="course-card-title-link">
          <h3 className="course-card-title">{title}</h3>
        </Link>

        {/* Instructor with avatar */}
        <div className="course-card-instructor">
          {instructor_avatar ? (
            <img
              src={instructor_avatar}
              alt={instructor_name}
              className="course-card-instructor-avatar"
              loading="lazy"
            />
          ) : (
            <span className="course-card-instructor-avatar-fallback">
              {avatarLetter}
            </span>
          )}
          <span className="course-card-instructor-name">
            {instructor_name || "Giảng viên"}
          </span>
        </div>

        {/* Rating & Students */}
        <div className="course-card-meta">
          {displayRating && (
            <span className="course-card-rating">
              <i className="bi bi-star-fill"></i>
              <span>{displayRating}</span>
            </span>
          )}
          {student_count > 0 && (
            <span className="course-card-students">
              <i className="bi bi-people"></i>
              <span>{student_count}</span>
            </span>
          )}
          {duration && (
            <span className="course-card-duration">
              <i className="bi bi-clock"></i>
              <span>{duration}h</span>
            </span>
          )}
        </div>

        {/* Level */}
        {levelLabel && (
          <span className="course-card-level">{levelLabel}</span>
        )}

        {/* Footer */}
        <div className="course-card-footer">
          <span
            className={`course-card-price ${
              Number(price) === 0 ? "free" : ""
            }`}
          >
            {formatPrice(price) || "Liên hệ"}
          </span>
          <Link to={`/courses/${id}`} className="course-card-btn">
            Xem chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CourseCard;