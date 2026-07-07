import React, { useState, useEffect, useCallback } from "react";
import { getMyCertificates } from "../../services/certificateService";
import { Link } from "react-router-dom";
import "../../style/student/certificates-page.css";

function CertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCertificates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyCertificates();
      setCertificates(data || []);
    } catch (error) {
      console.error("Lỗi khi tải chứng chỉ:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCertificates();
  }, [loadCertificates]);

  if (loading) {
    return (
      <div className="certificates-page">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="certificates-page">
      <div className="certificates-header">
        <div>
          <h1>Chứng chỉ của tôi</h1>
          <p className="text-muted">
            Tất cả chứng chỉ bạn đã đạt được từ các khóa học
          </p>
        </div>
      </div>

      {certificates.length === 0 ? (
        <div className="certificates-empty">
          <i className="bi bi-award"></i>
          <h3>Chưa có chứng chỉ nào</h3>
          <p>Hoàn thành khóa học để nhận chứng chỉ</p>
          <Link to="/courses" className="cert-btn-explore">
            Khám phá khóa học
          </Link>
        </div>
      ) : (
        <div className="certificates-grid">
          {certificates.map((cert) => (
            <div key={cert.id} className="certificate-card">
              <div className="certificate-card-header">
                <i className="bi bi-award-fill"></i>
                <span className="certificate-badge">Chứng chỉ hoàn thành</span>
              </div>
              <div className="certificate-card-body">
                <h3 className="certificate-course-title">{cert.course_title}</h3>
                <div className="certificate-info-row">
                  <span className="certificate-label">Mã chứng chỉ:</span>
                  <span className="certificate-code">{cert.certificate_code}</span>
                </div>
                <div className="certificate-info-row">
                  <span className="certificate-label">Ngày cấp:</span>
                  <span className="certificate-date">
                    {new Date(cert.issued_at).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="certificate-info-row">
                  <span className="certificate-label">Học viên:</span>
                  <span className="certificate-student">{cert.student_name}</span>
                </div>
              </div>
              <div className="certificate-card-footer">
                <Link
                  to={`/courses/${cert.course_id || ""}/learn`}
                  className="btn btn-outline-secondary btn-sm"
                >
                  <i className="bi bi-eye"></i> Xem khóa học
                </Link>
                {cert.image_url && (
                  <button
                    onClick={() => window.open(cert.image_url, "_blank")}
                    className="btn btn-certificate-view btn-sm"
                  >
                    <i className="bi bi-image"></i> Xem chứng chỉ
                  </button>
                )}
                {cert.pdf_url && (
                  <a
                    href={cert.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                  >
                    <i className="bi bi-download"></i> Tải PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CertificatesPage;
