import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCourseDetail,
  updateCourse,
  getSections,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
  getLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
} from "../../services/courseService";
import { getCategoriesApi } from "../../api/courseAPI";
import "../../style/instructor-courses.css";

function InstructorCourseEditPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // Course state
  const [course, setCourse] = useState(null);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    preview_video_url: "",
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Sections state
  const [sections, setSections] = useState([]);
  const [expandedSection, setExpandedSection] = useState(null);
  const [sectionForm, setSectionForm] = useState({ title: "", description: "" });
  const [editingSection, setEditingSection] = useState(null);
  const [sectionLoading, setSectionLoading] = useState(false);

  // Lessons state
  const [lessonsMap, setLessonsMap] = useState({});
  const [lessonForm, setLessonForm] = useState({
    title: "", description: "", content_type: "VIDEO",
    material_file: null, is_free: false,
  });
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonSectionId, setLessonSectionId] = useState(null);
  const [lessonLoading, setLessonLoading] = useState(false);

  // Load course
  const loadCourse = useCallback(async () => {
    try {
      const data = await getCourseDetail(courseId);
      setCourse(data);
      setFormData({
        title: data.title || "",
        description: data.description || "",
        price: data.price || "",
        category: data.category || "",
        preview_video_url: data.preview_video_url || "",
      });
      setThumbnailPreview(data.thumbnail_url || "");
    } catch (error) {
      toast.error("Không thể tải thông tin khóa học.");
      navigate("/instructor/courses");
    } finally {
      setLoading(false);
    }
  }, [courseId, navigate]);

  // Load sections
  const loadSections = useCallback(async () => {
    try {
      const data = await getSections(courseId);
      setSections(data || []);
    } catch (error) {
      // Sections may be empty
    }
  }, [courseId]);

  // Load lessons for a section
  const loadLessons = useCallback(async (sectionId) => {
    try {
      const data = await getLessons(sectionId);
      setLessonsMap((prev) => ({ ...prev, [sectionId]: data || [] }));
    } catch (error) {
      // Lessons may be empty
    }
  }, []);

  useEffect(() => {
    loadCourse();
    loadSections();
    const fetchCategories = async () => {
      try {
        const data = await getCategoriesApi();
        setCategories(data);
      } catch {
        // ignore
      }
    };
    fetchCategories();
  }, [loadCourse, loadSections]);

  // ==================== COURSE VALIDATE ====================
  const validateCourse = () => {
    const errs = {};
    if (!formData.title || !formData.title.trim()) {
      errs.title = "Tiêu đề khóa học không được để trống.";
    } else if (formData.title.trim().length < 5) {
      errs.title = "Tiêu đề phải có ít nhất 5 ký tự.";
    } else if (formData.title.trim().length > 50) {
      errs.title = "Tiêu đề không được vượt quá 50 ký tự.";
    } else if (/[<>{}$%^&*()=+[\]\\|;:'",.!@#~`]/.test(formData.title)) {
      errs.title = "Tiêu đề không được chứa ký tự đặc biệt.";
    }
    if (!formData.description || !formData.description.trim()) {
      errs.description = "Mô tả khóa học không được để trống.";
    } else if (formData.description.trim().length < 20) {
      errs.description = "Mô tả phải có ít nhất 20 ký tự.";
    }
    if (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0) {
      errs.price = "Giá khóa học phải là số dương.";
    }
    if (formData.preview_video_url && !/^https?:\/\/.+/.test(formData.preview_video_url)) {
      errs.preview_video_url = "URL video không hợp lệ.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ==================== COURSE HANDLERS ====================
  const handleCourseChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận file ảnh JPG, PNG, WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh bìa tối đa 5MB.");
      return;
    }
    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!validateCourse()) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.append("title", formData.title.trim());
      form.append("description", formData.description.trim());
      form.append("price", formData.price);
      if (formData.category) form.append("category", formData.category);
      if (formData.preview_video_url) form.append("preview_video_url", formData.preview_video_url.trim());
      if (thumbnail) form.append("thumbnail", thumbnail);
      const result = await updateCourse(courseId, form);
      toast.success(result.detail || "Cập nhật khóa học thành công!");
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    } finally {
      setSaving(false);
    }
  };

  // ==================== SECTION HANDLERS ====================
  const validateSection = () => {
    if (!sectionForm.title || !sectionForm.title.trim()) {
      toast.error("Tên chương không được để trống.");
      return false;
    }
    if (sectionForm.title.trim().length > 50) {
      toast.error("Tên chương không được vượt quá 50 ký tự.");
      return false;
    }
    if (/[<>{}$%^&*()=+[\]\\|;:'",!@#~`]/.test(sectionForm.title)) {
      toast.error("Tên chương không được chứa ký tự đặc biệt.");
      return false;
    }
    return true;
  };

  const handleAddSection = async () => {
    if (!validateSection()) return;
    setSectionLoading(true);
    try {
      const result = await createSection(courseId, sectionForm);
      toast.success(result.detail || "Thêm chương thành công!");
      setSectionForm({ title: "", description: "" });
      loadSections();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    } finally {
      setSectionLoading(false);
    }
  };

  const handleEditSection = (section) => {
    setEditingSection(section.id);
    setSectionForm({ title: section.title, description: section.description || "" });
  };

  const handleUpdateSection = async () => {
    if (!validateSection()) return;
    setSectionLoading(true);
    try {
      const result = await updateSection(editingSection, sectionForm);
      toast.success(result.detail || "Cập nhật chương thành công!");
      setEditingSection(null);
      setSectionForm({ title: "", description: "" });
      loadSections();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    } finally {
      setSectionLoading(false);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm("Xóa chương này sẽ xóa tất cả bài học bên trong. Bạn có chắc?")) return;
    try {
      await deleteSection(sectionId);
      toast.success("Xóa chương thành công!");
      setExpandedSection(null);
      loadSections();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    }
  };

  const handleCancelSectionEdit = () => {
    setEditingSection(null);
    setSectionForm({ title: "", description: "" });
  };

  const toggleSection = (sectionId) => {
    if (expandedSection === sectionId) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionId);
      if (!lessonsMap[sectionId]) {
        loadLessons(sectionId);
      }
    }
  };

  // ==================== LESSON HANDLERS ====================
  const validateLesson = () => {
    if (!lessonForm.title || !lessonForm.title.trim()) {
      toast.error("Tên bài học không được để trống.");
      return false;
    }
    if (lessonForm.title.trim().length > 50) {
      toast.error("Tên bài học không được vượt quá 50 ký tự.");
      return false;
    }
    if (/[<>{}$%^&*()=+[\]\\|;:'",!@#~`]/.test(lessonForm.title)) {
      toast.error("Tên bài học không được chứa ký tự đặc biệt.");
      return false;
    }
    return true;
  };

  const resetLessonForm = () => {
    setLessonForm({
      title: "", description: "", content_type: "VIDEO",
      material_file: null, is_free: false,
    });
    setEditingLesson(null);
    setLessonSectionId(null);
  };

  const handleAddLesson = (sectionId) => {
    resetLessonForm();
    setLessonSectionId(sectionId);
  };

  const handleEditLesson = (sectionId, lesson) => {
    setLessonSectionId(sectionId);
    setEditingLesson(lesson.id);
    setLessonForm({
      title: lesson.title || "",
      description: lesson.description || "",
      content_type: lesson.content_type || "VIDEO",
      material_file: null,
      is_free: lesson.is_free || false,
    });
  };

  const handleSaveLesson = async () => {
    if (!validateLesson()) return;
    setLessonLoading(true);
    try {
      const form = new FormData();
      form.append("title", lessonForm.title.trim());
      form.append("description", lessonForm.description.trim());
      form.append("content_type", lessonForm.content_type);
      form.append("is_free", lessonForm.is_free ? "true" : "false");
      if (lessonForm.material_file) form.append("material_file", lessonForm.material_file);

      if (editingLesson) {
        const result = await updateLesson(editingLesson, form);
        toast.success(result.detail || "Cập nhật bài học thành công!");
      } else {
        const result = await createLesson(lessonSectionId, form);
        toast.success(result.detail || "Thêm bài học thành công!");
      }
      resetLessonForm();
      loadLessons(lessonSectionId);
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    } finally {
      setLessonLoading(false);
    }
  };

  const handleDeleteLesson = async (sectionId, lessonId) => {
    if (!window.confirm("Bạn có chắc muốn xóa bài học này?")) return;
    try {
      await deleteLesson(lessonId);
      toast.success("Xóa bài học thành công!");
      loadLessons(sectionId);
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    }
  };

  const handleCancelLesson = () => {
    resetLessonForm();
  };

  // ==================== RENDER ====================
  if (loading) {
    return (
      <div className="instructor-courses-page">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="instructor-courses-page">
      <div className="courses-header">
        <div>
          <h2>Chỉnh sửa khóa học</h2>
          <p className="text-muted">{course?.title}</p>
        </div>
        <button className="course-btn-outline" onClick={() => navigate("/instructor/courses")}>
          <i className="bi bi-arrow-left me-2"></i>
          Quay lại
        </button>
      </div>

      {/* ===== COURSE INFO FORM ===== */}
      <form className="course-form" onSubmit={handleSaveCourse}>
        <div className="course-form-card">
          <h4 className="course-form-section-title">Thông tin khóa học</h4>

          <div className="course-form-group">
            <label className="course-form-label">Tiêu đề <span className="text-danger">*</span></label>
            <input
              type="text" name="title"
              className={`course-form-input ${errors.title ? "is-invalid" : ""}`}
              value={formData.title} onChange={handleCourseChange}
              maxLength={50}
            />
            {errors.title && <small className="course-form-error">{errors.title}</small>}
          </div>

          <div className="course-form-group">
            <label className="course-form-label">Mô tả <span className="text-danger">*</span></label>
            <textarea
              name="description" rows={4}
              className={`course-form-textarea ${errors.description ? "is-invalid" : ""}`}
              value={formData.description} onChange={handleCourseChange}
            />
            {errors.description && <small className="course-form-error">{errors.description}</small>}
          </div>

          <div className="course-form-row">
            <div className="course-form-group">
              <label className="course-form-label">Giá (VNĐ) <span className="text-danger">*</span></label>
              <input
                type="number" name="price" min="0"
                className={`course-form-input ${errors.price ? "is-invalid" : ""}`}
                value={formData.price} onChange={handleCourseChange}
              />
              {errors.price && <small className="course-form-error">{errors.price}</small>}
            </div>
            <div className="course-form-group">
              <label className="course-form-label">Danh mục</label>
              <select
                name="category"
                className="course-form-input"
                value={formData.category}
                onChange={handleCourseChange}
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="course-form-group">
            <label className="course-form-label">URL Video giới thiệu</label>
            <input
              type="url" name="preview_video_url"
              className={`course-form-input ${errors.preview_video_url ? "is-invalid" : ""}`}
              value={formData.preview_video_url} onChange={handleCourseChange}
            />
            {errors.preview_video_url && <small className="course-form-error">{errors.preview_video_url}</small>}
          </div>

          <div className="course-form-group">
            <label className="course-form-label">Ảnh bìa</label>
            <div className="course-form-upload" onClick={() => document.getElementById("edit-thumb-input").click()}>
              <input id="edit-thumb-input" type="file" accept=".jpg,.jpeg,.png,.webp" className="d-none" onChange={handleThumbnailChange} />
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Preview" className="course-form-upload-preview" />
              ) : (
                <div className="course-form-upload-placeholder">
                  <i className="bi bi-cloud-upload"></i>
                  <span>Nhấp để tải ảnh bìa</span>
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="course-btn-primary" disabled={saving}>
            {saving ? (
              <><span className="spinner-border spinner-border-sm me-2"></span>Đang lưu...</>
            ) : (
              <><i className="bi bi-save me-2"></i>Lưu thông tin</>
            )}
          </button>
        </div>
      </form>

      {/* ===== SECTIONS & LESSONS ===== */}
      <div className="course-form-card">
        <h4 className="course-form-section-title">Nội dung khóa học</h4>
        <p className="text-muted small mb-3">
          Thêm các chương (section) và bài học (lesson) cho khóa học.
        </p>

        {/* Add Section Form */}
        <div className="section-add-form">
          <h6 className="fw-bold mb-2">
            {editingSection ? "Chỉnh sửa chương" : "Thêm chương mới"}
          </h6>
          <div className="course-form-row">
            <div className="course-form-group flex-grow-1">
              <input
                type="text"
                className="course-form-input"
                placeholder="Tên chương (VD: Chương 1: Giới thiệu)"
                value={sectionForm.title}
                onChange={(e) => setSectionForm((prev) => ({ ...prev, title: e.target.value }))}
                maxLength={50}
              />
            </div>
            <div className="course-form-group flex-grow-1">
              <input
                type="text"
                className="course-form-input"
                placeholder="Mô tả ngắn (không bắt buộc)"
                value={sectionForm.description}
                onChange={(e) => setSectionForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="d-flex gap-2 align-items-end pb-2">
              {editingSection ? (
                <>
                  <button className="course-btn-primary btn-sm" onClick={handleUpdateSection} disabled={sectionLoading}>
                    {sectionLoading ? "Đang lưu..." : "Cập nhật"}
                  </button>
                  <button className="course-btn-outline btn-sm" onClick={handleCancelSectionEdit}>Hủy</button>
                </>
              ) : (
                <button className="course-btn-primary btn-sm" onClick={handleAddSection} disabled={sectionLoading}>
                  {sectionLoading ? "Đang thêm..." : "Thêm"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sections List */}
        {sections.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <i className="bi bi-collection" style={{ fontSize: 32 }}></i>
            <p className="mt-2">Chưa có chương nào. Thêm chương đầu tiên!</p>
          </div>
        ) : (
          <div className="sections-list">
            {sections.map((section, index) => (
              <div key={section.id} className="section-item">
                <div className="section-header" onClick={() => toggleSection(section.id)}>
                  <div className="section-header-left">
                    <i className={`bi ${expandedSection === section.id ? "bi-chevron-down" : "bi-chevron-right"} me-2`}></i>
                    <span className="section-order">Chương {index + 1}</span>
                    <span className="section-title-text">{section.title}</span>
                  </div>
                  <div className="section-header-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEditSection(section)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteSection(section.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>

                {expandedSection === section.id && (
                  <div className="section-body">
                    {/* Lessons */}
                    {(lessonsMap[section.id] || []).length === 0 ? (
                      <div className="text-center py-3 text-muted">
                        <small>Chưa có bài học nào.</small>
                      </div>
                    ) : (
                      <div className="lessons-list">
                        {(lessonsMap[section.id] || []).map((lesson, lIndex) => (
                          <div key={lesson.id} className="lesson-item">
                            <div className="lesson-info">
                              <span className="lesson-order">Bài {lIndex + 1}</span>
                              <span className="lesson-title">{lesson.title}</span>
                              <span className="lesson-type-badge">
                                {lesson.content_type === "VIDEO" ? (
                                  <><i className="bi bi-play-circle me-1"></i>Video</>
                                ) : (
                                  <><i className="bi bi-file-text me-1"></i>Tài liệu</>
                                )}
                              </span>
                              {lesson.is_free && (
                                <span className="lesson-free-badge">Miễn phí</span>
                              )}
                              {lesson.duration_seconds > 0 && (
                                <span className="lesson-duration">
                                  {Math.floor(lesson.duration_seconds / 60)}:{(lesson.duration_seconds % 60).toString().padStart(2, "0")}
                                </span>
                              )}
                            </div>
                            <div className="lesson-actions">
                              <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEditLesson(section.id, lesson)}>
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteLesson(section.id, lesson.id)}>
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Lesson Form */}
                    {lessonSectionId === section.id ? (
                      <div className="lesson-add-form mt-3 p-3 bg-light rounded">
                        <h6 className="fw-bold mb-2">
                          {editingLesson ? "Chỉnh sửa bài học" : "Thêm bài học mới"}
                        </h6>
                        <div className="course-form-group">
                          <label className="course-form-label">Tên bài học <span className="text-danger">*</span></label>
                          <input
                            type="text" className="course-form-input"
                            placeholder="VD: Bài 1: Giới thiệu về Python"
                            value={lessonForm.title}
                            onChange={(e) => setLessonForm((prev) => ({ ...prev, title: e.target.value }))}
                            maxLength={50}
                          />
                        </div>
                        <div className="course-form-group">
                          <label className="course-form-label">Mô tả</label>
                          <textarea
                            className="course-form-textarea" rows={2}
                            value={lessonForm.description}
                            onChange={(e) => setLessonForm((prev) => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                        <div className="course-form-row">
                          <div className="course-form-group">
                            <label className="course-form-label">Loại nội dung</label>
                            <select
                              className="course-form-input"
                              value={lessonForm.content_type}
                              onChange={(e) => setLessonForm((prev) => ({ ...prev, content_type: e.target.value }))}
                            >
                              <option value="VIDEO">Video</option>
                              <option value="DOCUMENT">Tài liệu</option>
                            </select>
                          </div>
                        </div>
                        <div className="course-form-group">
                          <label className="course-form-label">Tài liệu đính kèm</label>
                          <input
                            type="file"
                            className="course-form-input"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              setLessonForm((prev) => ({ ...prev, material_file: file }));
                            }}
                          />
                        </div>
                        <div className="course-form-checkbox">
                          <label>
                            <input
                              type="checkbox"
                              checked={lessonForm.is_free}
                              onChange={(e) => setLessonForm((prev) => ({ ...prev, is_free: e.target.checked }))}
                            />
                            <span className="ms-2">Bài học miễn phí (không cần đăng ký khóa học)</span>
                          </label>
                        </div>
                        <div className="d-flex gap-2 mt-2">
                          <button className="course-btn-primary btn-sm" onClick={handleSaveLesson} disabled={lessonLoading}>
                            {lessonLoading ? "Đang lưu..." : (editingLesson ? "Cập nhật" : "Thêm bài học")}
                          </button>
                          <button className="course-btn-outline btn-sm" onClick={handleCancelLesson}>Hủy</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="course-btn-outline btn-sm mt-2"
                        onClick={() => handleAddLesson(section.id)}
                      >
                        <i className="bi bi-plus-lg me-1"></i>Thêm bài học
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default InstructorCourseEditPage;
