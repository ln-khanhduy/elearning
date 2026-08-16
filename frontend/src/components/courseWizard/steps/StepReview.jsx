import { memo, useMemo } from "react";

function StepReview({
  formData,
  thumbnailPreview,
  curriculum,
  plans,
  course,
  assignedInstructor,
  onPublish,
  onSaveDraft,
  onGoToStep,
  saving,
  publishing,
}) {
  // Giá bán được quản lý qua các gói truy cập (CourseAccessPlan) ở bước 3
  const validPlans = useMemo(
    () =>
      (plans || []).filter(
        (p) =>
          (p.name || "").trim().length > 0 &&
          Number(p.duration_days) > 0 &&
          Number(p.price) >= 50000
      ),
    [plans]
  );

  const hasInstructor = !!assignedInstructor?.id;

  const checklist = useMemo(() => {
    const items = [
      {
        label: "Tiêu đề khóa học",
        pass: !!formData.title?.trim(),
        hint: "Thiếu tiêu đề",
        step: 1,
      },
      {
        label: "Mô tả khóa học",
        pass: !!formData.description?.trim(),
        hint: "Thiếu mô tả",
        step: 1,
      },
      {
        label: "Danh mục",
        pass: !!formData.category,
        hint: "Chưa chọn danh mục",
        step: 1,
      },
      {
        label: "Ảnh bìa",
        pass: !!thumbnailPreview,
        hint: "Thiếu ảnh bìa",
        step: 1,
      },
      {
        label: "Nội dung khóa học",
        pass: curriculum.length > 0,
        hint: "Chưa có chương học nào",
        step: 2,
      },
      {
        label: "Bài học",
        pass: curriculum.some((s) => (s.lessons?.length || 0) > 0),
        hint: "Cần ít nhất 1 bài học",
        step: 2,
      },
      {
        label: "Giá bán",
        pass: validPlans.length > 0,
        hint: "Chưa thiết lập giá",
        step: 3,
      },
      {
        label: "Phân công giảng viên",
        pass: hasInstructor,
        hint: "Chưa phân công giảng viên",
        step: 4,
      },
    ];
    return items;
  }, [formData, thumbnailPreview, curriculum, validPlans, hasInstructor]);

  const totalLessons = curriculum.reduce((sum, s) => {
    const lessonCount = s.lessons?.length || 0;
    const quizCount = (s.lessons || []).reduce((qSum, l) => qSum + (l.quizzes?.length || 0), 0);
    return sum + lessonCount + quizCount;
  }, 0);

  const allPassed = checklist.every((i) => i.pass);
  const missingItems = checklist.filter((i) => !i.pass);

  return (
    <div className="cw-review-layout">
      {/* Course Preview */}
      <div className="cw-review-preview">
        {thumbnailPreview ? (
          <img
            src={thumbnailPreview}
            alt=""
            className="cw-review-thumbnail"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
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
                {validPlans.length > 0
                  ? `${validPlans.length} gói truy cập`
                  : "Chưa thiết lập giá"}
              </span>
            </div>
            <div className="cw-review-meta-item">
              <i className="bi bi-person-check"></i>
              <span>
                {hasInstructor
                  ? assignedInstructor.name || "Đã phân công giảng viên"
                  : "Chưa phân công giảng viên"}
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

      {/* Checklist + Publish Actions */}
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
            {!item.pass && (
              <button
                className="cw-btn cw-btn-sm cw-btn-outline"
                style={{ marginLeft: "auto", padding: "2px 8px", fontSize: 11 }}
                onClick={() => onGoToStep?.(item.step || 1)}
              >
                Đến bước {item.step || 1}
              </button>
            )}
          </div>
        ))}

        <div style={{ marginTop: 20 }}>
          {allPassed ? (
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
              Còn {missingItems.length} mục cần hoàn thiện
            </div>
          )}
        </div>

        {/* Publish / Save Draft Actions */}
        <div className="cw-publish-actions" style={{ marginTop: 24 }}>
          <button
            className="cw-btn cw-btn-secondary"
            onClick={onSaveDraft}
            disabled={saving}
            style={{ maxWidth: 320, width: "100%" }}
          >
            <i className="bi bi-cloud-upload"></i>
            {saving ? "Đang lưu..." : "Lưu nháp"}
          </button>

          <button
            className="cw-btn cw-btn-success"
            onClick={onPublish}
            disabled={!allPassed || publishing}
            style={{ maxWidth: 320, width: "100%" }}
          >
            {publishing ? (
              <>
                <span className="spinner-border spinner-border-sm"></span>
                {course?.status === "PUBLISHED" ? "Đang cập nhật..." : "Đang xuất bản..."}
              </>
            ) : (
              <>
                <i className="bi bi-globe2"></i>
                {course?.status === "PUBLISHED" ? "Xác nhận cập nhật khóa học" : "Xuất bản khóa học"}
              </>
            )}
          </button>
        </div>

        {!allPassed && (
          <div className="cw-publish-requirements">
            <div className="cw-publish-requirements-title">
              <i className="bi bi-exclamation-triangle me-1"></i>
              Cần hoàn thiện trước khi xuất bản:
            </div>
            {missingItems.map((item, idx) => (
              <div key={idx} className="cw-publish-requirement">
                <i className="bi bi-x-circle-fill"></i>
                <span>{item.label}</span>
                <button
                  className="cw-btn cw-btn-sm cw-btn-outline"
                  style={{ marginLeft: "auto", padding: "2px 8px", fontSize: 11 }}
                  onClick={() => onGoToStep?.(item.step || 1)}
                >
                  Đến bước {item.step || 1}
                </button>
              </div>
            ))}
          </div>
        )}

        {course?.status === "PUBLISHED" && (
          <div
            style={{
              marginTop: 24,
              padding: 16,
              background: "#d1e7dd",
              borderRadius: 12,
              fontSize: 13,
              color: "#0f5132",
            }}
          >
            <i className="bi bi-check-circle-fill me-1"></i>
            Khóa học đã được xuất bản. Cập nhật sẽ được áp dụng ngay lập tức.
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(StepReview);