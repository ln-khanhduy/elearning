import React from "react";

function ContactPage() {
  const contacts = [
    {
      icon: "bi bi-telephone-fill",
      label: "Số điện thoại",
      items: [
        { value: "0906 297 095", href: "tel:0906297095" },
        { value: "0706 408 105", href: "tel:0706408105" },
      ],
    },
    {
      icon: "bi bi-envelope-fill",
      label: "Email",
      items: [
        { value: "ln.khanhduy2004@gmail.com", href: "mailto:ln.khanhduy2004@gmail.com" },
      ],
    },
    {
      icon: "bi bi-github",
      label: "Github",
      items: [
        { value: "github.com/ln-khanhduy", href: "https://github.com/ln-khanhduy", external: true },
      ],
    },
    {
      icon: "bi bi-facebook",
      label: "Facebook",
      items: [
        { value: "facebook.com/khanh.duy.269476", href: "https://facebook.com/khanh.duy.269476", external: true },
      ],
    },
    {
      icon: "bi bi-chat-dots-fill",
      label: "Zalo",
      items: [
        { value: "0906 297 095", href: "https://zalo.me/0906297095", external: true },
      ],
    },
  ];

  return (
    <div className="container-center py-5">
      <div className="contact-page">
        <div className="contact-header">
          <h2>Liên hệ</h2>
          <p>Chúng tôi luôn sẵn sàng hỗ trợ bạn. Hãy kết nối qua các kênh dưới đây.</p>
        </div>
        <div className="contact-grid">
          {contacts.map((group) => (
            <div key={group.label} className="contact-card">
              <div className="contact-card-icon">
                <i className={group.icon}></i>
              </div>
              <h4 className="contact-card-label">{group.label}</h4>
              <div className="contact-card-items">
                {group.items.map((item) => (
                  <a
                    key={item.value}
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="contact-card-link"
                  >
                    {item.value}
                    {item.external && <i className="bi bi-box-arrow-up-right ms-1" style={{ fontSize: "0.7rem" }}></i>}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ContactPage;