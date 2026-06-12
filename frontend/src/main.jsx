import React from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style/main.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "react-toastify/dist/ReactToastify.css";
import logoSrc from "./img/logo.png";
import ReactDOM from "react-dom/client";
import { UserProvider } from "./context/UserContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import AppRouter from "./routers/AppRouter";
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
        <AppRouter />
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="light" />
      </UserProvider>
  </GoogleOAuthProvider>
  
);
