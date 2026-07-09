import React from "react";

function TermsModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="terms-modal-overlay" onClick={onClose}>
      <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
        <div className="terms-modal-header">
          <h3>Điều khoản và Chính sách bảo mật</h3>
          <button className="terms-modal-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="terms-modal-body">
          <h4>1. Điều khoản sử dụng</h4>
          <p>
            Khi truy cập và sử dụng nền tảng LMS Learn, bạn đồng ý tuân thủ các điều khoản sau đây. 
            Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ của chúng tôi.
          </p>
          <ul>
            <li>Bạn chịu trách nhiệm bảo mật thông tin tài khoản và mật khẩu của mình.</li>
            <li>Bạn không được sử dụng dịch vụ cho bất kỳ mục đích bất hợp pháp nào.</li>
            <li>Chúng tôi có quyền tạm ngưng hoặc chấm dứt tài khoản nếu phát hiện vi phạm.</li>
            <li>Nội dung khóa học chỉ được sử dụng cho mục đích học tập cá nhân, không được sao chép hoặc phân phối.</li>
          </ul>

          <h4>2. Chính sách bảo mật</h4>
          <p>
            LMS Learn cam kết bảo vệ thông tin cá nhân của bạn. Chúng tôi chỉ thu thập những thông tin cần thiết
            để cung cấp dịch vụ và cải thiện trải nghiệm học tập.
          </p>
          <ul>
            <li>Thông tin thu thập bao gồm: họ tên, email, số điện thoại, thông tin thanh toán.</li>
            <li>Thông tin của bạn không được chia sẻ với bên thứ ba nếu không có sự đồng ý.</li>
            <li>Chúng tôi áp dụng các biện pháp bảo mật để bảo vệ dữ liệu khỏi truy cập trái phép.</li>
            <li>Bạn có quyền yêu cầu xóa tài khoản và dữ liệu cá nhân bất kỳ lúc nào.</li>
          </ul>

          <h4>3. Chính sách thanh toán và hoàn tiền</h4>
          <p>
            Thanh toán được xử lý an toàn qua cổng thanh toán Stripe. Bạn có thể yêu cầu hoàn tiền
            trong vòng 7 ngày kể từ ngày mua nếu khóa học không đáp ứng được mong đợi.
          </p>

          <h4>4. Liên hệ</h4>
          <p>
            Mọi thắc mắc về điều khoản và chính sách, vui lòng liên hệ qua email{" "}
            <a href="mailto:lnkhanhduy2004@gmail.com">lnkhanhduy2004@gmail.com</a> hoặc
            số điện thoại <a href="tel:0906297095">0906 297 095</a>.
          </p>
        </div>
        <div className="terms-modal-footer">
          <button className="terms-modal-btn" onClick={onClose}>
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}

export default TermsModal;