import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

function PublicLayout() {
  return (
    <div className="public-layout">
      <Header />
      <div className="public-layout-content">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

export default PublicLayout;
