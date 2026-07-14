import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="not-found-page d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
      <div className="text-center" style={{ maxWidth: 500 }}>
        <div style={{ fontSize: 100, fontWeight: 800, color: "#e0e0e0", lineHeight: 1 }}>404</div>
        <h3 className="mt-3">Trang không tồn tại</h3>
        <p className="text-muted">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển. 
          Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ.
        </p>
        <div className="d-flex gap-2 justify-content-center mt-4">
          <Link to="/home" className="btn btn-primary">
            <i className="bi bi-house me-1"></i>Về trang chủ
          </Link>
          <Link to="/courses" className="btn btn-outline-secondary">
            <i className="bi bi-book me-1"></i>Khám phá khóa học
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;