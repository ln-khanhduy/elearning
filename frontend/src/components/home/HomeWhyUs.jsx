/**
 * Why Learn With Us section - section duy nhất được phép dùng nội dung tĩnh.
 * Hiển thị 4 lợi ích chính của nền tảng.
 */
function HomeWhyUs() {
  const benefits = [
    {
      icon: "bi bi-laptop",
      title: "Học mọi lúc, mọi nơi",
      desc: "Truy cập khóa học 24/7 từ bất kỳ thiết bị nào. Học theo tốc độ của riêng bạn, không áp lực thời gian.",
      color: "#4361ee",
      bg: "#4361ee12",
    },
    {
      icon: "bi bi-person-video3",
      title: "Giảng viên chất lượng",
      desc: "Đội ngũ giảng viên giàu kinh nghiệm, được tuyển chọn kỹ lưỡng từ các trường đại học và doanh nghiệp hàng đầu.",
      color: "#2ec4b6",
      bg: "#2ec4b612",
    },
    {
      icon: "bi bi-file-earmark-text",
      title: "Nội dung thực tế",
      desc: "Chương trình học được thiết kế bám sát nhu cầu thị trường, giúp bạn áp dụng ngay vào công việc.",
      color: "#f77f00",
      bg: "#f77f0012",
    },
    {
      icon: "bi bi-patch-check",
      title: "Theo dõi tiến độ học tập",
      desc: "Theo dõi tiến độ học tập chi tiết, nhận chứng chỉ hoàn thành và xây dựng hồ sơ kỹ năng cá nhân.",
      color: "#06d6a0",
      bg: "#06d6a012",
    },
  ];

  return (
    <section className="home-section home-why-section">
      <div className="home-container">
        <div className="home-section-header home-section-header-center">
          <span className="home-section-tag">Tại sao chọn chúng tôi</span>
          <h2 className="home-section-title">Lợi ích khi học tại LMS Learn</h2>
          <p className="home-section-desc">
            Cam kết mang đến trải nghiệm học tập tốt nhất cho bạn
          </p>
        </div>
        <div className="home-why-grid">
          {benefits.map((item, index) => (
            <div key={index} className="home-why-card">
              <div className="home-why-icon" style={{ background: item.bg, color: item.color }}>
                <i className={item.icon} />
              </div>
              <h3 className="home-why-title">{item.title}</h3>
              <p className="home-why-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HomeWhyUs;
