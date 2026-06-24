import { useState, useRef, useCallback } from "react";

export default function DragDropArea({
  onFile,
  accept = ".jpg,.jpeg,.png,.webp",
  preview,
  placeholder = "Kéo thả file vào đây hoặc nhấp để chọn",
  hint = "Hỗ trợ JPG, PNG, WEBP. Tối đa 5MB.",
  maxSize = 5 * 1024 * 1024,
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) validateAndSet(file);
    },
    [onFile, maxSize]
  );

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) validateAndSet(file);
  };

  const validateAndSet = (file) => {
    const ext = "." + file.name.split(".").pop().toLowerCase();
    const allowed = accept.split(",").map((a) => a.trim().toLowerCase());
    if (!allowed.includes(ext) && !allowed.includes(file.type)) {
      alert(`Chỉ chấp nhận file: ${accept}`);
      return;
    }
    if (file.size > maxSize) {
      alert(`Kích thước file tối đa ${Math.round(maxSize / 1024 / 1024)}MB.`);
      return;
    }
    onFile(file);
  };

  return (
    <div
      className={`cw-dropzone ${dragging ? "dragging" : ""} ${preview ? "has-preview" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="d-none"
        onChange={handleChange}
      />
      {preview ? (
        <>
          <img src={preview} alt="Preview" className="cw-dropzone-preview" />
          <div className="cw-dropzone-change">
            <i className="bi bi-arrow-repeat"></i> Thay đổi ảnh
          </div>
        </>
      ) : (
        <>
          <div className="cw-dropzone-icon">
            <i className="bi bi-cloud-upload"></i>
          </div>
          <div className="cw-dropzone-text">{placeholder}</div>
          <div className="cw-dropzone-hint">{hint}</div>
        </>
      )}
    </div>
  );
}
