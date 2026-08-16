import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getCourseAction } from "../../services/courseActionService";
import { formatPrice } from "../../utils/formatPrice";
import { addToWishlistApi, removeFromWishlistApi } from "../../api/wishlistAPI";
import { addToCartApi } from "../../api/cartAPI";
import { useUser } from "../../context/UserContext";
import "../../style/courseDetail/course-progress-card.css";

/**
 * CourseProgressCard - Sidebar hiển thị tiến độ học tập tại trang chi tiết khóa học
 * Gồm: giá khóa học, thanh progress, nút CTA, wishlist + cart actions
 */
function CourseProgressCard({
  isEnrolled, progressPercent, completedCount, totalLessons=0,
  plans = [], selectedPlan, onSelectPlan,
  price, originalPrice,
  onEnroll, onStartLearning, onContinueLearning, loading, courseId,
}) {
  const { isAuthenticated } = useUser();
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  // Mặc định chọn gói đầu tiên nếu chưa chọn
  useEffect(() => {
    if (!isEnrolled && plans.length > 0 && !selectedPlan && onSelectPlan) {
      onSelectPlan(plans[0]);
    }
  }, [isEnrolled, plans, selectedPlan, onSelectPlan]);

  const displayPrice = selectedPlan ? Number(selectedPlan.price) : (price ?? null);

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để sử dụng tính năng này.");
      return;
    }
    if (wishlistLoading) return;
    setWishlistLoading(true);
    try {
      if (wishlisted) {
        await removeFromWishlistApi(courseId);
        setWishlisted(false);
        toast.success("Đã xóa khỏi danh sách yêu thích.");
      } else {
        await addToWishlistApi(courseId);
        setWishlisted(true);
        toast.success("Đã thêm vào danh sách yêu thích.");
      }
      window.dispatchEvent(new Event("wishlist-change"));
    } catch {
      toast.error("Không thể thao tác. Vui lòng thử lại.");
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để sử dụng tính năng này.");
      return;
    }
    if (!selectedPlan) {
      toast.info("Vui lòng chọn gói truy cập trước khi thêm vào giỏ.");
      return;
    }
    if (cartLoading) return;
    setCartLoading(true);
    try {
      await addToCartApi(courseId, selectedPlan.id);
      toast.success("Đã thêm vào giỏ hàng.");
      window.dispatchEvent(new Event("cart-change"));
    } catch (err) {
      toast.error(err.message || "Không thể thêm vào giỏ hàng.");
    } finally {
      setCartLoading(false);
    }
  };
  // Xác định hành động dựa vào trạng thái enrollment và progress
  const action = getCourseAction({
    isEnrolled, progressPercent: progressPercent || 0,
    completedLessonsCount: completedCount || 0, totalLessonsCount: totalLessons || 0,
    price: displayPrice,
  });

  // Xử lý click nút : gọi callback tương ứng
  const handleClick = () => {
    if (loading) return;
    if (action.action === "enroll") onEnroll?.();
    else if (action.action === "start") onStartLearning?.();
    else if (action.action === "continue") onContinueLearning?.();
  };

  return (
    <div className="course-progress-card">
      {/* Chọn gói truy cập + giá - chỉ hiển thị khi chưa enroll */}
      {!isEnrolled && (
        <>
          {plans.length > 0 && (
            <div className="progress-card-plans">
              <div className="progress-card-plans-title">
                <i className="bi bi-box-seam"></i>
                Chọn gói truy cập
              </div>
              <div className="progress-card-plan-grid">
                {plans.map((p) => (
                  <label
                    key={p.id}
                    className={`progress-card-plan ${selectedPlan?.id === p.id ? "active" : ""}`}
                    onClick={() => onSelectPlan?.(p)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="progress-card-plan-header">
                      <input
                        type="radio"
                        name="plan"
                        checked={selectedPlan?.id === p.id}
                        onChange={() => onSelectPlan?.(p)}
                        className="progress-card-plan-radio"
                      />
                      <span className="progress-card-plan-name">{p.name}</span>
                    </div>
                    <span className="progress-card-plan-price">{formatPrice(p.price)}</span>
                    <div className="progress-card-plan-duration">
                      <i className="bi bi-clock-history"></i>
                      {p.duration_days}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
          {displayPrice !== null && displayPrice !== undefined && (
            <div className="progress-card-price">
              <span className="price-current">{formatPrice(displayPrice)}</span>
              {originalPrice && Number(originalPrice) > Number(displayPrice) && (
                <span className="price-original">{formatPrice(originalPrice)}</span>
              )}
            </div>
          )}
        </>
      )}

      {/* Thanh tiến độ - chỉ hiển thị khi đã enroll */}
      {isEnrolled && (
        <div className="progress-card-progress">
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${Math.min(progressPercent || 0, 100)}%` }}></div>
          </div>
          <div className="progress-stats">
            <span className="progress-lessons">{completedCount}/{totalLessons} bài học</span>
          </div>
        </div>
      )}

      {/* Nút CTA - dựa vào action từ getCourseAction */}
      <button className={`progress-card-btn btn-${action.variant}`} onClick={handleClick} disabled={loading}>
        {loading ? (
          <span className="spinner-border spinner-border-sm" role="status"></span>
        ) : (
          <><i className={action.icon}></i> {action.label}</>
        )}
      </button>

      {/* Wishlist + Cart actions (chỉ khi chưa enroll) */}
      {!isEnrolled && (
        <div className="progress-card-actions">
          <button
            className={`progress-card-action-btn ${wishlisted ? "active" : ""}`}
            onClick={handleToggleWishlist}
            disabled={wishlistLoading}
            title={wishlisted ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
          >
            <i className={`bi ${wishlistLoading ? "bi-arrow-repeat spin" : wishlisted ? "bi-heart-fill" : "bi-heart"}`}></i>
            <span>{wishlisted ? "Đã yêu thích" : "Yêu thích"}</span>
          </button>
          <button
            className="progress-card-action-btn"
            onClick={handleAddToCart}
            disabled={cartLoading}
            title="Thêm vào giỏ hàng"
          >
            <i className={`bi ${cartLoading ? "bi-arrow-repeat spin" : "bi-cart-plus"}`}></i>
            <span>Thêm vào giỏ</span>
          </button>
        </div>
      )}

      {/* Thông tin khóa học */}
      <div className="progress-card-info">
        <div className="info-item"><i className="bi bi-clock-history"></i><span>Truy cập theo thời hạn gói</span></div>
        <div className="info-item"><i className="bi bi-phone"></i><span>Học mọi lúc, mọi nơi</span></div>
        <div className="info-item"><i className="bi bi-award"></i><span>Chứng chỉ hoàn thành</span></div>
      </div>
    </div>
  );
}

export default CourseProgressCard;
