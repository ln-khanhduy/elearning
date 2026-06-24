import { memo, useMemo } from "react";

function StepReview({ formData, thumbnailPreview, curriculum }) {
  const checklist = useMemo(() => {
    const items = [
      {
        label: "Tiêu đề khóa học",
        pass: !!formData.title?.trim(),
        hint: "Thiếu tiêu đề",
      },
      {
        label: "Mô tả khóa học",
        pass: !!formData.description?.trim(),
        hint: "Thiếu mô tả",
      },
      {
        label: "Danh mục",
        pass: !!formData.category,
        hint: "Chưa chọn danh mục",
      },
      {
        label: "Ảnh bìa",
        pass: !!thumbnailPreview,
        hint: "Thiếu ảnh bìa",
      },
      {
        label: "Nội dung khóa học",
        pass: curriculum.length > 0,
        hint: "Chưa có chương học nào",
      },
      {
        label: "Bài học",
        pass: curriculum.some((s) => (s.lessons?.length || 0) > 0),
        hint: "Cần ít nhất 1 bài học",
      },
      {
        label: "Giá bán",
        pass: formData.price !== "" && formData.price !== undefined,
        hint: "Chưa thiết lập giá",
      },
    ];
    return items;
  }, [formData, thumbnailPreview, curriculum]);

  const totalLessons = curriculum.reduce((sum, s) => {
    const lessonCount = s.lessons?.length || 0;
    const quizCount = (s.lessons || []).reduce((qSum, l) => qSum + (l.quizzes?.length || 0), 0);
    return sum + lessonCount + quizCount;
  }, 0);

  return (
    <div className="cw-review-layout">
      {/* Course Preview */}
      <div className="cw-review-preview">
        {thumbnailPreview ? (
          <img src={thumbnailPreview} alt="" className="cw-review-thumbnail" />
        ) : (
          <div className="cw-review-thumbnail-placeholder">
            <i className="bi bi-image" style={{ fontSize: 32 }}></i>
          </div>
        )}

        <div className="cw-review-content">
          <h2 className="cw-review-title">
            {formData.title || "Chưa có tiêu đề"}
          </h2>
          <p className="cw-review-desc">
            {formData.description || "Chưa có mô tả"}
          </p>

          <div className="cw-review-meta">
            <div className="cw-review-meta-item">
              <i className="bi bi-collection"></i>
              <span>{curriculum.length} chương</span>
            </div>
            <div className="cw-review-meta-item">
              <i className="bi bi-play-circle"></i>
              <span>{totalLessons} bài học</span>
            </div>
            <div className="cw-review-meta-item">
              <i className="bi bi-currency-dollar"></i>
              <span>
                {formData.price > 0
                  ? Number(formData.price).toLocaleString("vi-VN") + "đ"
                  : "Miễn phí"}
              </span>
            </div>
          </div>

          {/* Curriculum Preview */}
          {curriculum.length > 0 && (
            <div className="cw-review-curriculum">
              <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
                Nội dung khóa học
              </h4>
              {curriculum.map((section, idx) => (
                <div key={section.id} className="cw-review-section">
                  <div className="cw-review-section-title">
                    Chương {idx + 1}: {section.title}
                  </div>
                  {(section.lessons || []).map((lesson) => (
                    <div key={lesson.id}>
                      <div className="cw-review-lesson">
                        <i
                          className={`bi ${
                            lesson.content_type === "VIDEO"
                              ? "bi-play-circle"
                              : "bi-file-text"
                          }`}
                        ></i>
                        <span>{lesson.title}</span>
                      </div>
                      {(lesson.quizzes || []).map((quiz) => (
                        <div key={quiz.id} className="cw-review-lesson cw-review-quiz">
                          <i className="bi bi-patch-question"></i>
                          <span>{quiz.title}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Checklist */}
      <div className="cw-checklist">
        <div className="cw-checklist-title">
          <i className="bi bi-check2-square me-2"></i>
          Kiểm tra
        </div>
        {checklist.map((item, idx) => (
          <div
            key={idx}
            className={`cw-checklist-item ${item.pass ? "pass" : "fail"}`}
          >
            <span className="cw-checklist-icon">
              {item.pass ? (
                <i className="bi bi-check-circle-fill"></i>
              ) : (
                <i className="bi bi-exclamation-circle-fill"></i>
              )}
            </span>
            <span>{item.pass ? item.label : item.hint}</span>
          </div>
        ))}

        <div style={{ marginTop: 20 }}>
          {checklist.every((i) => i.pass) ? (
            <div
              style={{
                padding: 12,
                background: "#d1e7dd",
                borderRadius: 8,
                textAlign: "center",
                fontSize: 13,
                fontWeight: 600,
                color: "#0f5132",
              }}
            >
              <i className="bi bi-check-circle-fill me-1"></i>
              Khóa học đã sẵn sàng để xuất bản!
            </div>
          ) : (
            <div
              style={{
                padding: 12,
                background: "#fff3cd",
                borderRadius: 8,
                textAlign: "center",
                fontSize: 13,
                fontWeight: 600,
                color: "#856404",
              }}
            >
              <i className="bi bi-info-circle-fill me-1"></i>
              Còn {checklist.filter((i) => !i.pass).length} mục cần hoàn thiện
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(StepReview);
