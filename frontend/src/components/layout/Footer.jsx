import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-left">
        <strong>LMS Learn</strong>
        <span>© 2026 LMS Learn. Bản quyền được bảo lưu.</span>
      </div>

      <div className="footer-right">
        <Link to="/">Trang chủ</Link>
        <Link to="/courses">Khóa học</Link>
        <Link to="/contact">Liên hệ</Link>
        <Link to="/instructor/apply">Trở thành giảng viên</Link>
      </div>
    </footer>
  );
}

export default Footer;
