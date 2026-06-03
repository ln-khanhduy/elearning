import "../../style/layout-css/footer.css";

function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-left">
        <strong>LMS Learn</strong>
        <span>© 2026 LMS Learn. All rights reserved.</span>
      </div>

      <div className="footer-right">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
        <a href="#">Help Center</a>
      </div>
    </footer>
  );
}

export default Footer;