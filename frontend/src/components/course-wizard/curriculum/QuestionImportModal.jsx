import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { previewImport, executeImport, downloadTemplate } from "../../../services/questionImportService";

export default function QuestionImportModal({ quizId, onClose, onImportSuccess }) {
  const [step, setStep] = useState("upload"); // upload | preview | importing | done
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [allRows, setAllRows] = useState([]); // Lưu toàn bộ dòng đã parse để thực thi
  const [selectedRows, setSelectedRows] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [missingColumns, setMissingColumns] = useState(null);
  const fileInputRef = useRef(null);
  const mountedRef = useRef(true);

  // Đánh dấu component đã unmount để tránh cập nhật state sau khi unmount
  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  // Cập nhật state an toàn, chỉ khi component còn mounted
  const safeSetState = (setter, value) => { if (mountedRef.current) setter(value); };

  // Xử lý chọn file, kiểm tra định dạng và kích thước
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["csv", "xlsx"].includes(ext)) { toast.error("Chỉ hỗ trợ file CSV hoặc XLSX."); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error("File không được vượt quá 10MB."); return; }
    setFile(f);
  };

  // Upload file lên server để xem trước dữ liệu
  const handleUpload = async () => {
    if (!file) { toast.error("Vui lòng chọn file."); return; }
    try {
      const data = await previewImport(quizId, file);
      if (!mountedRef.current) return;
      if (data?.missing_columns) { setMissingColumns(data.missing_columns); toast.error("File thiếu cột bắt buộc."); return; }
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
        safeSetState(setAllRows, data.preview);
        safeSetState(setSelectedRows, data.preview.map((_, i) => i));
        safeSetState(setStep, "preview");
        toast.success(`Đọc thành công ${data.valid_rows} câu hỏi.`);
      }
    } catch (error) {
      if (mountedRef.current) toast.error(error.message || "Có lỗi xảy ra khi đọc file.");
    }
  };

  // Chọn hoặc bỏ chọn một dòng trong bảng xem trước
  const toggleRow = (index) => {
    setSelectedRows((prev) => prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]);
  };

  // Chọn hoặc bỏ chọn tất cả dòng
  const toggleAll = () => {
    selectedRows.length === allRows.length ? setSelectedRows([]) : setSelectedRows(allRows.map((_, i) => i));
  };

  // Import các dòng đã chọn lên server
  const handleImport = async () => {
    if (selectedRows.length === 0) { toast.error("Vui lòng chọn ít nhất 1 câu hỏi để import."); return; }
    setStep("importing");
    try {
      const rowsToImport = selectedRows.map((i) => allRows[i]);
      const data = await executeImport(quizId, rowsToImport);
      if (!mountedRef.current) return;
      safeSetState(setImportResult, data);
      safeSetState(setStep, "done");
      if (data.imported_count > 0) { toast.success(`Import thành công ${data.imported_count} câu hỏi.`); onImportSuccess?.(); }
    } catch (error) {
      if (mountedRef.current) { toast.error(error.message || "Có lỗi xảy ra khi import."); safeSetState(setStep, "preview"); }
    }
  };

  // Tải file template mẫu (CSV hoặc XLSX) về máy người dùng
  const handleDownloadTemplate = async (format) => {
    try {
      const blob = await downloadTemplate(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `question_import_template.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) { toast.error("Không thể tải template."); }
  };

  // Reset toàn bộ state về bước upload ban đầu
  const resetUpload = () => {
    setFile(null); setPreviewData(null); setAllRows([]); setSelectedRows([]);
    setImportResult(null); setMissingColumns(null); setStep("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Đóng modal, chặn nếu đang import
  const handleClose = () => { if (step === "importing") return; onClose(); };

  // Xác định class badge dựa vào độ khó
  const badgeClass = (difficulty) => {
    if (difficulty === "EASY") return "cw-import-badge cw-import-badge-easy";
    if (difficulty === "MEDIUM") return "cw-import-badge cw-import-badge-medium";
    return "cw-import-badge cw-import-badge-hard";
  };

  return (
    <div className="cw-import-overlay" onClick={handleClose}>
      <div className="cw-import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cw-import-header">
          <h5>Import câu hỏi từ file</h5>
          {step !== "importing" && <button className="cw-editor-panel-close" onClick={handleClose}><i className="bi bi-x-lg"></i></button>}
        </div>

        <div className="cw-import-body">
          {/* Bước 1: Upload file */}
          {step === "upload" && (
            <div>
              <div className="cw-form-group">
                <label className="cw-form-label"><span className="cw-form-label-text">Chọn file CSV hoặc XLSX</span></label>
                <input ref={fileInputRef} type="file" className="cw-input" accept=".csv,.xlsx" onChange={handleFileChange} />
                <p className="cw-form-help-text">File cần có các cột: question, difficulty, option_a, option_b, option_c, option_d, correct</p>
                <p className="cw-form-help-text cw-import-info-text">
                  <i className="bi bi-info-circle"></i>
                  Lưu ý: Nếu dùng Excel, hãy lưu file với định dạng "CSV UTF-8" (hoặc dùng template bên dưới) để đảm bảo tiếng Việt hiển thị đúng.
                </p>
              </div>
              <div className="cw-import-flex-row">
                <button type="button" className="cw-btn cw-btn-outline cw-btn-sm" onClick={() => handleDownloadTemplate("csv")}><i className="bi bi-download"></i> Tải template CSV</button>
                <button type="button" className="cw-btn cw-btn-outline cw-btn-sm" onClick={() => handleDownloadTemplate("xlsx")}><i className="bi bi-download"></i> Tải template XLSX</button>
              </div>
            </div>
          )}

          {/* Bước 2: Xem trước dữ liệu */}
          {step === "preview" && previewData && (
            <div>
              <div className="cw-import-toolbar">
                <div>
                  <span className="cw-import-stat">{allRows.length} câu hỏi hợp lệ</span>
                  {previewData.error_count > 0 && <span className="cw-import-error-count">{previewData.error_count} lỗi</span>}
                </div>
                <div className="cw-import-flex-row">
                  <button type="button" className="cw-btn cw-btn-outline cw-btn-sm" onClick={resetUpload}><i className="bi bi-arrow-left"></i> Chọn file khác</button>
                </div>
              </div>

              {/* Hiển thị danh sách lỗi */}
              {previewData.errors?.length > 0 && (
                <div className="cw-import-error-box">
                  <strong className="cw-import-error-title">Lỗi:</strong>
                  <ul className="cw-import-error-list">
                    {previewData.errors.map((err, i) => <li key={i}>Dòng {err.row}: {err.message}</li>)}
                  </ul>
                </div>
              )}

              {/* Bảng xem trước dữ liệu */}
              {allRows.length > 0 && (
                <div className="cw-import-table-wrap">
                  <table className="cw-import-table">
                    <thead>
                      <tr>
                        <th className="cw-import-th-check">
                          <input type="checkbox" className="cw-import-checkbox" checked={selectedRows.length === allRows.length} onChange={toggleAll} />
                        </th>
                        <th className="cw-import-th-num">#</th>
                        <th>Câu hỏi</th>
                        <th className="cw-import-th-sm">Độ khó</th>
                        <th className="cw-import-th-sm">Đáp án</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allRows.map((row, i) => (
                        <tr key={i} className={selectedRows.includes(i) ? "cw-import-row-selected" : ""}>
                          <td className="cw-import-td-center">
                            <input type="checkbox" className="cw-import-checkbox" checked={selectedRows.includes(i)} onChange={() => toggleRow(i)} />
                          </td>
                          <td className="cw-import-td-num">{row.row}</td>
                          <td>{row.question}</td>
                          <td><span className={badgeClass(row.difficulty)}>{row.difficulty}</span></td>
                          <td><code className="cw-import-code">{row.correct}</code></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Bước 3: Đang import - hiển thị spinner */}
          {step === "importing" && (
            <div className="cw-import-spinner-wrap">
              <div className="spinner-border cw-import-spinner" role="status">
                <span className="visually-hidden">Đang import...</span>
              </div>
              <p className="cw-import-spinner-text">Đang import câu hỏi...</p>
            </div>
          )}

          {/* Bước 4: Hoàn tất - hiển thị kết quả */}
          {step === "done" && importResult && (
            <div className="cw-import-done-wrap">
              <div className="cw-import-done-icon"><i className="bi bi-check-circle-fill"></i></div>
              <h5 className="cw-import-done-title">Import hoàn tất</h5>
              <p className="cw-import-done-text">Đã import thành công <strong>{importResult.imported_count}</strong> câu hỏi.</p>
              {importResult.errors?.length > 0 && (
                <div className="cw-import-warn-box">
                  <strong className="cw-import-warn-title">Có {importResult.errors.length} lỗi:</strong>
                  <ul className="cw-import-warn-list">
                    {importResult.errors.map((err, i) => <li key={i}>Dòng {err.row}: {err.message}</li>)}
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
              <button className="cw-btn cw-btn-primary" onClick={handleUpload} disabled={!file}><i className="bi bi-eye"></i> Xem trước</button>
            </>
          )}
          {step === "preview" && (
            <>
              <button className="cw-btn cw-btn-secondary" onClick={resetUpload}><i className="bi bi-arrow-left"></i> Quay lại</button>
              <button className="cw-btn cw-btn-primary" onClick={handleImport} disabled={selectedRows.length === 0}><i className="bi bi-upload"></i> Import {selectedRows.length} câu hỏi</button>
            </>
          )}
          {step === "done" && (
            <button className="cw-btn cw-btn-primary" onClick={onClose}><i className="bi bi-check-lg"></i> Hoàn tất</button>
          )}
        </div>
      </div>
    </div>
  );
}
