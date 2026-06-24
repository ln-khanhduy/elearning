import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { importPreview, importExecute, importTemplate } from "../../../services/curriculumService";

export default function QuestionImportModal({ quizId, onClose, onImportSuccess }) {
  const [step, setStep] = useState("upload"); // upload | preview | importing | done
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [allRows, setAllRows] = useState([]); // Store full parsed rows for execute
  const [selectedRows, setSelectedRows] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [missingColumns, setMissingColumns] = useState(null);
  const fileInputRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSetState = (setter, value) => {
    if (mountedRef.current) {
      setter(value);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      const ext = f.name.split(".").pop().toLowerCase();
      if (!["csv", "xlsx"].includes(ext)) {
        toast.error("Chỉ hỗ trợ file CSV hoặc XLSX.");
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error("File không được vượt quá 10MB.");
        return;
      }
      setFile(f);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Vui lòng chọn file.");
      return;
    }
    try {
      const res = await importPreview(quizId, file);
      const data = res?.data || res;

      if (!mountedRef.current) return;

      // Check if the error is about missing columns
      if (data?.missing_columns) {
        setMissingColumns(data.missing_columns);
        toast.error("File thiếu cột bắt buộc.");
        return;
      }

      setMissingColumns(null);

      if (data.error_count > 0) {
        safeSetState(setPreviewData, data);
        safeSetState(setAllRows, data.preview || []);
        safeSetState(setSelectedRows, (data.preview || []).map((_, i) => i));
        safeSetState(setStep, "preview");
        toast.warning(`Có ${data.error_count} lỗi trong file.`);
      } else if (data.valid_rows === 0) {
        toast.error("Không có dữ liệu hợp lệ để import.");
      } else {
        safeSetState(setPreviewData, data);
        // Store all valid rows for later execution
        safeSetState(setAllRows, data.preview);
        safeSetState(setSelectedRows, data.preview.map((_, i) => i));
        safeSetState(setStep, "preview");
        toast.success(`Đọc thành công ${data.valid_rows} câu hỏi.`);
      }
    } catch (error) {
      if (mountedRef.current) {
        toast.error(error.message || "Có lỗi xảy ra khi đọc file.");
      }
    }
  };

  const toggleRow = (index) => {
    setSelectedRows((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleAll = () => {
    if (selectedRows.length === allRows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(allRows.map((_, i) => i));
    }
  };

  const handleImport = async () => {
    if (selectedRows.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 câu hỏi để import.");
      return;
    }
    setStep("importing");
    try {
      // Send only the selected rows
      const rowsToImport = selectedRows.map((i) => allRows[i]);
      const res = await importExecute(quizId, rowsToImport);
      const data = res?.data || res;

      if (!mountedRef.current) return;

      safeSetState(setImportResult, data);
      safeSetState(setStep, "done");
      if (data.imported_count > 0) {
        toast.success(`Import thành công ${data.imported_count} câu hỏi.`);
        onImportSuccess?.();
      }
    } catch (error) {
      if (mountedRef.current) {
        toast.error(error.message || "Có lỗi xảy ra khi import.");
        safeSetState(setStep, "preview");
      }
    }
  };

  const handleDownloadTemplate = async (format) => {
    try {
      const blob = await importTemplate(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `question_import_template.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Không thể tải template.");
    }
  };

  const resetUpload = () => {
    setFile(null);
    setPreviewData(null);
    setAllRows([]);
    setSelectedRows([]);
    setImportResult(null);
    setMissingColumns(null);
    setStep("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    if (step === "importing") return; // Prevent closing while importing
    onClose();
  };

  return (
    <div className="cw-import-overlay" onClick={handleClose}>
      <div className="cw-import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cw-import-header">
          <h5>Import câu hỏi từ file</h5>
          {step !== "importing" && (
            <button className="cw-editor-panel-close" onClick={handleClose}>
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>

        <div className="cw-import-body">
          {/* Step 1: Upload */}
          {step === "upload" && (
            <div>
              <div className="cw-form-group">
                <label className="cw-form-label">
                  <span className="cw-form-label-text">Chọn file CSV hoặc XLSX</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="cw-input"
                  accept=".csv,.xlsx"
                  onChange={handleFileChange}
                />
                <p className="cw-form-help-text">
                  File cần có các cột: question, difficulty, option_a, option_b, option_c, option_d, correct
                </p>
                <p className="cw-form-help-text" style={{ color: "#856404", marginTop: 4 }}>
                  <i className="bi bi-info-circle"></i>
                  Lưu ý: Nếu dùng Excel, hãy lưu file với định dạng "CSV UTF-8" (hoặc dùng template bên dưới) để đảm bảo tiếng Việt hiển thị đúng.
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="cw-btn cw-btn-outline cw-btn-sm"
                  onClick={() => handleDownloadTemplate("csv")}
                >
                  <i className="bi bi-download"></i>
                  Tải template CSV
                </button>
                <button
                  type="button"
                  className="cw-btn cw-btn-outline cw-btn-sm"
                  onClick={() => handleDownloadTemplate("xlsx")}
                >
                  <i className="bi bi-download"></i>
                  Tải template XLSX
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === "preview" && previewData && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>
                    {allRows.length} câu hỏi hợp lệ
                  </span>
                  {previewData.error_count > 0 && (
                    <span style={{ color: "#dc3545", marginLeft: 8, fontSize: 13 }}>
                      {previewData.error_count} lỗi
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="cw-btn cw-btn-outline cw-btn-sm"
                    onClick={resetUpload}
                  >
                    <i className="bi bi-arrow-left"></i>
                    Chọn file khác
                  </button>
                </div>
              </div>

              {/* Errors */}
              {previewData.errors?.length > 0 && (
                <div style={{ background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
                  <strong style={{ fontSize: 12, color: "#dc3545" }}>Lỗi:</strong>
                  <ul style={{ margin: "4px 0 0", paddingLeft: 20, fontSize: 12, color: "#dc3545" }}>
                    {previewData.errors.map((err, i) => (
                      <li key={i}>Dòng {err.row}: {err.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview table */}
              {allRows.length > 0 && (
                <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #e9ecef", borderRadius: 8 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8f9fc", position: "sticky", top: 0 }}>
                        <th style={{ width: 40, padding: "8px 10px", borderBottom: "1px solid #e9ecef", textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={selectedRows.length === allRows.length}
                            onChange={toggleAll}
                            style={{ cursor: "pointer" }}
                          />
                        </th>
                        <th style={{ width: 50, padding: "8px 10px", borderBottom: "1px solid #e9ecef", textAlign: "left", fontWeight: 600, color: "#495057" }}>#</th>
                        <th style={{ padding: "8px 10px", borderBottom: "1px solid #e9ecef", textAlign: "left", fontWeight: 600, color: "#495057" }}>Câu hỏi</th>
                        <th style={{ width: 100, padding: "8px 10px", borderBottom: "1px solid #e9ecef", textAlign: "left", fontWeight: 600, color: "#495057" }}>Độ khó</th>
                        <th style={{ width: 100, padding: "8px 10px", borderBottom: "1px solid #e9ecef", textAlign: "left", fontWeight: 600, color: "#495057" }}>Đáp án</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allRows.map((row, i) => (
                        <tr key={i} style={{ background: selectedRows.includes(i) ? "#f0f4ff" : "transparent" }}>
                          <td style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f0", textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={selectedRows.includes(i)}
                              onChange={() => toggleRow(i)}
                              style={{ cursor: "pointer" }}
                            />
                          </td>
                          <td style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f0", color: "#6c757d" }}>{row.row}</td>
                          <td style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f0" }}>{row.question}</td>
                          <td style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f0" }}>
                            <span style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              background: row.difficulty === "EASY" ? "#d1e7dd" : row.difficulty === "MEDIUM" ? "#fff3cd" : "#f8d7da",
                              color: row.difficulty === "EASY" ? "#0f5132" : row.difficulty === "MEDIUM" ? "#856404" : "#842029",
                            }}>
                              {row.difficulty}
                            </span>
                          </td>
                          <td style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f0" }}>
                            <code style={{ background: "#f0f0f0", padding: "1px 4px", borderRadius: 3, fontSize: 12 }}>{row.correct}</code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Importing */}
          {step === "importing" && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div className="spinner-border" style={{ width: 32, height: 32, color: "#0f3d75", marginBottom: 12 }} role="status">
                <span className="visually-hidden">Đang import...</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: "#495057" }}>Đang import câu hỏi...</p>
            </div>
          )}

          {/* Step 4: Done */}
          {step === "done" && importResult && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ marginBottom: 12 }}>
                <i className="bi bi-check-circle-fill" style={{ fontSize: "3rem", color: "#198754" }}></i>
              </div>
              <h5 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e", margin: "0 0 8px" }}>Import hoàn tất</h5>
              <p style={{ margin: "0 0 4px", fontSize: 14, color: "#495057" }}>
                Đã import thành công <strong>{importResult.imported_count}</strong> câu hỏi.
              </p>
              {importResult.errors?.length > 0 && (
                <div style={{ background: "#fffdf0", border: "1px solid #ffeeba", borderRadius: 8, padding: "8px 12px", marginTop: 12, textAlign: "left" }}>
                  <strong style={{ fontSize: 12, color: "#856404" }}>Có {importResult.errors.length} lỗi:</strong>
                  <ul style={{ margin: "4px 0 0", paddingLeft: 20, fontSize: 12, color: "#856404" }}>
                    {importResult.errors.map((err, i) => (
                      <li key={i}>Dòng {err.row}: {err.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="cw-import-footer">
          {step === "upload" && (
            <>
              <button className="cw-btn cw-btn-secondary" onClick={handleClose}>Hủy</button>
              <button className="cw-btn cw-btn-primary" onClick={handleUpload} disabled={!file}>
                <i className="bi bi-eye"></i>
                Xem trước
              </button>
            </>
          )}
          {step === "preview" && (
            <>
              <button className="cw-btn cw-btn-secondary" onClick={resetUpload}>
                <i className="bi bi-arrow-left"></i>
                Quay lại
              </button>
              <button
                className="cw-btn cw-btn-primary"
                onClick={handleImport}
                disabled={selectedRows.length === 0}
              >
                <i className="bi bi-upload"></i>
                Import {selectedRows.length} câu hỏi
              </button>
            </>
          )}
          {step === "done" && (
            <button className="cw-btn cw-btn-primary" onClick={onClose}>
              <i className="bi bi-check-lg"></i>
              Hoàn tất
            </button>
          )}
        </div>
      </div>
    </div>
  );
}