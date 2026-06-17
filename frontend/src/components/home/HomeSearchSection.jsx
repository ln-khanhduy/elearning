import { useState } from "react";
import { useNavigate } from "react-router-dom";

function HomeSearchSection() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/courses?q=${encodeURIComponent(q)}`);
    } else {
      navigate("/courses");
    }
  };

  return (
    <section className="home-search-section">
      <div className="home-search-container">
        <div className="home-search-content">
          <h2 className="home-search-title">Bạn muốn học gì hôm nay?</h2>
          <p className="home-search-desc">
            Khám phá hàng trăm khóa học từ các chuyên gia hàng đầu
          </p>
          <form className="home-search-form" onSubmit={handleSubmit}>
            <div className="home-search-input-wrapper">
              <i className="bi bi-search home-search-input-icon" />
              <input
                type="text"
                className="home-search-input"
                placeholder="Tìm kiếm khóa học..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="home-search-btn">
              Tìm kiếm
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default HomeSearchSection;
