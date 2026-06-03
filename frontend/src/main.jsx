import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style/main.css";
import logoSrc from "./img/logo.png";
import ReactDOM from "react-dom/client";
import { UserProvider } from "./context/UserContext";

document.title = "LSN Learn";
const faviconEl = document.getElementById("app-favicon");
if (faviconEl) {
	faviconEl.href = logoSrc;
}

createRoot(document.getElementById("root")).render(
  <UserProvider>
    <App />
  </UserProvider>
);
