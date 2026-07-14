import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getWishlistApi, removeFromWishlistApi } from "../../api/wishlistAPI";
import { addToCartApi } from "../../api/cartAPI";

function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWishlistApi();
      setItems(data?.data?.items || []);
    } catch (error) {
      toast.error("Không thể tải danh sách yêu thích.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const handleRemove = async (courseId) => {
    try {
      await removeFromWishlistApi(courseId);
      toast.success("Đã xóa khỏi danh sách yêu thích.");
      loadWishlist();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAddToCart = async (courseId) => {
    try {
      await addToCartApi(courseId);
      toast.success("Đã thêm vào giỏ hàng.");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const formatPrice = (val) => {
    if (!val && val !== 0) return null;
    return Number(val).toLocaleString("vi-VN") + "₫";
  };

  return (
    <div className="wishlist-page">
      <h4 className="mb-4">
        <i className="bi bi-heart-fill text-danger me-2"></i>
        Khóa học yêu thích
      </h4>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="wishlist-empty text-center py-5">
          <div className="wishlist-empty-icon">
            <i className="bi bi-heart"></i>
          </div>
          <h5>Chưa có khóa học yêu thích</h5>
          <p className="text-muted">Khám phá các khóa học và thêm vào danh sách yêu thích để mua sau.</p>
          <Link to="/courses" className="btn btn-primary mt-2">
            <i className="bi bi-compass me-1"></i>Khám phá khóa học
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {items.map((item) => (
            <div key={item.id} className="col-12 col-sm-6 col-lg-4">
              <div className="card h-100 shadow-sm">
                <div className="position-relative">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt={item.course_title} className="card-img-top" style={{ height: "180px", objectFit: "cover" }} />
                  ) : (
                    <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: "180px" }}>
                      <i className="bi bi-image text-muted" style={{ fontSize: "3rem" }}></i>
                    </div>
                  )}
                  <button
                    className="btn btn-sm position-absolute top-0 end-0 m-2 bg-white rounded-circle shadow-sm"
                    onClick={() => handleRemove(item.course_id)}
                    title="Xóa khỏi yêu thích"
                  >
                    <i className="bi bi-heart-fill text-danger"></i>
                  </button>
                </div>
                <div className="card-body d-flex flex-column">
                  <Link to={`/courses/${item.course_id}`} className="text-decoration-none">
                    <h6 className="card-title text-dark">{item.course_title}</h6>
                  </Link>
                  {item.instructor_name && (
                    <p className="card-text small text-muted mb-2">
                      <i className="bi bi-person me-1"></i>{item.instructor_name}
                    </p>
                  )}
                  <div className="mt-auto d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-primary">{formatPrice(item.price)}</span>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleAddToCart(item.course_id)}
                    >
                      <i className="bi bi-cart-plus me-1"></i>Thêm vào giỏ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WishlistPage;