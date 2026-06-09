import Header from "./Header";
import Footer from "./Footer";
import Sidebar from "./Sidebar";

import "../../style/layout-css/main-layout.css";

function MainLayout({ children }) {
  return (
    <div className="main-layout">
      <Sidebar />

      <div className="main-layout-right">
        <Header />

        <main className="main-content">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default MainLayout;