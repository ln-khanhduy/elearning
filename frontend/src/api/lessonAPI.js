import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error });
  }
};

/* eslint-disable-next-line no-unused-vars */
const downloadRequest = async (callback) => {
  try {
    return await callback();
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error });
  }
};

/**
 * Tải tài liệu bài học về máy và kích hoạt download trên trình duyệt.
 * Dùng chung cho VideoLesson và DocumentLesson.
 * @param {number} lessonId - ID bài học
 * @param {string} [fallbackName] - URL material (material_url) dùng để suy tên file gốc
 *                                  nếu backend cross-origin chưa expose Content-Disposition.
 */
export const downloadAndSaveLessonMaterial = async (lessonId, fallbackName) => {
  const { blob, filename } = await downloadLessonMaterialApi(lessonId, fallbackName);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Không revoke ngay lập tức: trình duyệt bắt đầu download bất đồng bộ,
  // revoke quá sớm có thể khiến file tải về bị 0 byte/rỗng.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const getLessonsApi = async (chapterId) =>
  request(() => apiClient.get(`/api/lessons/chapters/${chapterId}/lessons/`));

export const getLessonDetailApi = async (lessonId) =>
  request(() => apiClient.get(`/api/lessons/lessons/${lessonId}/`));

export const initBunnyUploadApi = async (title) =>
  request(() => apiClient.post("/api/lessons/bunny/init-upload/", { title }));

export const createLessonApi = async (chapterId, data) =>
  request(() => apiClient.post(`/api/lessons/chapters/${chapterId}/lessons/create/`, data));

export const updateLessonApi = async (lessonId, data) =>
  request(() => apiClient.patch(`/api/lessons/lessons/${lessonId}/update/`, data));

export const deleteLessonApi = async (lessonId) =>
  request(() => apiClient.delete(`/api/lessons/lessons/${lessonId}/delete/`));

export const reorderLessonsApi = async (chapterId, lessons) =>
  request(() => apiClient.patch(`/api/lessons/chapters/${chapterId}/lessons/reorder/`, { lessons }));

/**
 * Tải tài liệu bài học về máy (attachment).
 * - Trả về { blob, filename } hoặc throw Error.
 * - filename ưu tiên lấy từ header Content-Disposition của backend (giữ tên file gốc).
 * - Nếu header không đọc được (CORS chưa expose), fallback dựa trên material_url
 *   để vẫn giữ đúng tên file gốc (Student_guide_M2.docx thay vì material_110).
 */
export const downloadLessonMaterialApi = async (lessonId, fallbackName) => {
  try {
    const res = await apiClient.get(
      `/api/lessons/lessons/${lessonId}/download-material/`,
      { responseType: "blob" }
    );
    const blob = res.data;

    // Kiểm tra file rỗng (0 byte) - tránh lưu file hỏng về máy
    if (!blob || blob.size === 0) {
      throw new Error("File tải về rỗng. Vui lòng thử lại sau.");
    }

    // Parse filename từ header Content-Disposition
    let filename = `material_${lessonId}`;
    const contentDisposition = res.headers?.["content-disposition"] || "";
    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
      try {
        filename = decodeURIComponent(utf8Match[1]);
      } catch {
        filename = utf8Match[1];
      }
    } else {
      const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
      if (asciiMatch?.[1]) filename = asciiMatch[1];
    }

    // Fallback: header không đọc được (cross-origin) -> suy tên file từ material_url
    if (filename === `material_${lessonId}` && fallbackName) {
      try {
        const cleanUrl = fallbackName.split("?")[0]; // bỏ query params
        const urlPath = decodeURIComponent(cleanUrl);
        const baseName = urlPath.split("/").pop();
        if (baseName) filename = baseName;
      } catch {
        const baseName = fallbackName.split("?")[0].split("/").pop();
        if (baseName) filename = baseName;
      }
    }

    return { blob, filename };
  } catch (error) {
    // Nếu backend trả JSON error, blob phải đọc lại
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const parsed = JSON.parse(text);
        throw new Error(parsed?.detail || parsed?.error || parsed?.message || "Không thể tải tài liệu.", { cause: error });
      } catch (parseErr) {
        if (parseErr instanceof SyntaxError) {
          throw new Error("Không thể tải tài liệu.", { cause: parseErr });
        }
        throw parseErr;
      }
    }
    throw new Error(getErrorMessage(error), { cause: error });
  }
};
