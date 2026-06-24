import { memo, useMemo } from "react";

function StepPublish({
  formData,
  thumbnailPreview,
  curriculum,
  course,
  onSaveDraft,
  onPublish,
  onGoToStep,
  saving,
  publishing,
}) {
  const requirements = useMemo(() => {
    return [
      {
        label: "Tiêu đề khóa học",
        pass: !!formData.title?.trim(),
      },
      {
        label: "Mô tả khóa học",
        pass: !!formData.description?.trim(),
      },
      {
        label: "Danh mục",
        pass: !!formData.category,
      },
      {
        label: "Ảnh bìa",
        pass: !!thumbnailPreview,
      },
      {
        label: "Ít nhất 1 chương",
        pass: curriculum.length > 0,
      },
      {
        label: "Ít nhất 1 bài học",
        pass: curriculum.some((s) => (s.lessons?.length || 0) > 0),
      },
      {
        label: "Giá bán",
        pass: formData.price !== "" && formData.price !== undefined,
      },
    ];
  }, [formData, thumbnailPreview, curriculum]);

  const allPassed = requirements.every((r) => r.pass);
  const missingItems = requirements.filter((r) => !r.pass);

  return (
    <div className="cw-publish-center">
      <div className="cw-publish-icon">
        <i className="bi bi-rocket-takeoff"></i>
      </div>

      <h2 className="cw-publish-title">
        {allPassed
          ? "Khóa học đã sẵn sàng!"
          : "Hoàn thiện khóa học của bạn"}
      </h2>

      <p className="cw-publish-desc">
        {allPassed
          ? "Bạn có thể xuất bản khóa học ngay bây giờ hoặc lưu nháp để chỉnh sửa sau."
          : "Vui lòng hoàn thành các mục còn thiếu trước khi xuất bản khóa học."}
      </p>

      <div className="cw-publish-actions">
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
                onClick={() => {
                  const stepMap = {
                    "Tiêu đề khóa học": 1,
                    "Mô tả khóa học": 1,
                    "Danh mục": 1,
                    "Ảnh bìa": 1,
                    "Ít nhất 1 chương": 2,
                    "Ít nhất 1 bài học": 2,
                    "Giá bán": 3,
                  };
                  onGoToStep(stepMap[item.label] || 1);
                }}
              >
                Đến bước {stepMap[item.label] || 1}
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
  );
}

const stepMap = {
  "Tiêu đề khóa học": 1,
  "Mô tả khóa học": 1,
  "Danh mục": 1,
  "Ảnh bìa": 1,
  "Ít nhất 1 chương": 2,
  "Ít nhất 1 bài học": 2,
  "Giá bán": 3,
};

export default memo(StepPublish);
