import { importPreviewApi, importExecuteApi, importTemplateApi } from "../api/questionAPI";

/**
 * Upload file lên server để xem trước dữ liệu import.
 * @param {string} quizId - ID của quiz cần import
 * @param {File} file - File CSV hoặc XLSX
 * @returns {Promise<object>} Dữ liệu preview từ server
 */
export const previewImport = async (quizId, file) => {
  const res = await importPreviewApi(quizId, file);
  return res?.data || res;
};

/**
 * Gửi các dòng đã chọn lên server để thực thi import.
 * @param {string} quizId - ID của quiz cần import
 * @param {Array} rows - Mảng các dòng dữ liệu hợp lệ
 * @returns {Promise<object>} Kết quả import từ server
 */
export const executeImport = async (quizId, rows) => {
  const res = await importExecuteApi(quizId, rows);
  return res?.data || res;
};

/**
 * Tải file template mẫu (CSV hoặc XLSX) về máy.
 * @param {string} format - Định dạng file: "csv" hoặc "xlsx"
 * @returns {Promise<Blob>} Blob file template
 */
export const downloadTemplate = async (format) => {
  const blob = await importTemplateApi(format);
  return blob;
};
