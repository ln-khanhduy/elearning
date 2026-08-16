import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style/main.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "react-toastify/dist/ReactToastify.css";
import logoSrc from "./img/logo.png";
import { UserProvider } from "./context/UserContext";
import { DutyProvider } from "./context/DutyContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import AppRouter from "./routers/AppRouter";
import FloatingChatWidget from "./components/chat/FloatingChatWidget";
import FloatingDutyWidget from "./components/instructor/FloatingDutyWidget";
import { ToastContainer } from "react-toastify";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
document.title = "LMS Learn";
const faviconEl = document.getElementById("app-favicon");
if (faviconEl) {
  faviconEl.href = logoSrc;
}

createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <UserProvider>
      <DutyProvider>
        <AppRouter />
        {/* Floating chat theo khóa — xuất hiện khi đã đăng nhập */}
        <FloatingChatWidget />
        {/* Bong bóng đếm giờ trực — xuất hiện ở MỌI trang khi có ca đang trực */}
        <FloatingDutyWidget />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="light"
        />
      </DutyProvider>
    </UserProvider>
  </GoogleOAuthProvider>
);