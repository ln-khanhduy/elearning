import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCourseDetail,
  updateCourse,
  getCurriculum,
  getCategories,
  getTags,
  createChapter,
  updateChapter,
  deleteChapter,
  createLesson,
  updateLesson,
  deleteLesson,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "../../services/courseService";

// ==================== INITIALIZERS ====================
const emptyChapter = () => ({ title: "", description: "" });
const emptyLesson = () => ({
  title: "", description: "", content_type: "VIDEO",
  is_free: false, material_file: null, video_url: "",
});
const emptyQuiz = () => ({
  title: "", description: "", time_limit_minutes: null, passing_score: 0,
});
const emptyQuestion = () => ({
  question_type: "MCQ", prompt: "", points: 1, order: 1,
  correct_text_answer: "", options: [],
});
const emptyOption = () => ({ text: "", is_correct: false });

// ==================== MAIN COMPONENT ====================
function InstructorCourseEditPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // Course state
  const [course, setCourse] = useState(null);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [formData, setFormData] = useState({
    title: "", description: "", price: "", category: "",
    preview_video_url: "",
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Curriculum tree
  const [curriculum, setCurriculum] = useState([]); // chapters with nested lessons/quizzes/questions

  // Chapter form
  const [chapterForm, setChapterForm] = useState(emptyChapter());
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [showChapterForm, setShowChapterForm] = useState(false);

  // Lesson form
  const [lessonForm, setLessonForm] = useState(emptyLesson());
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [lessonChapterId, setLessonChapterId] = useState(null);
  const [showLessonForm, setShowLessonForm] = useState(false);

  // Quiz form
  const [quizForm, setQuizForm] = useState(emptyQuiz());
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [quizLessonId, setQuizLessonId] = useState(null);
  const [showQuizForm, setShowQuizForm] = useState(false);

  // Question form
  const [questionForm, setQuestionForm] = useState(emptyQuestion());
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionQuizId, setQuestionQuizId] = useState(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  // ==================== LOAD DATA ====================
  const loadCourse = useCallback(async () => {
    try {
      const res = await getCourseDetail(courseId);
      const data = res?.data || res;
      setCourse(data);
      setFormData({
        title: data.title || "",
        description: data.description || "",
        price: data.price || "",
        category: data.category || "",
        preview_video_url: data.preview_video_url || "",
      });
      setThumbnailPreview(data.thumbnail_url || "");
      setSelectedTags(data.tags?.map((t) => t.id) || []);

    } catch (error) {
      toast.error("Không thể tải thông tin khóa học.");
      navigate("/instructor/courses");
    }
  }, [courseId, navigate]);

  const loadCurriculum = useCallback(async () => {
    try {
      const res = await getCurriculum(courseId);
      const data = res?.data || res;
      setCurriculum(data?.chapters || []);

    } catch {
      // curriculum may be empty
    }
  }, [courseId]);

  useEffect(() => {
    loadCourse();
    loadCurriculum();
    const fetchMeta = async () => {
      try {
        const [cats, tgs] = await Promise.all([getCategories(), getTags()]);
        setCategories(cats?.data || cats || []);
        setTags(tgs?.data || tgs || []);

      } catch {
        // ignore
      }
    };
    fetchMeta();
  }, [loadCourse, loadCurriculum]);

  // ==================== COURSE VALIDATION ====================
  const validateCourse = () => {
    const errs = {};
    if (!formData.title?.trim()) errs.title = "Tiêu đề không được để trống.";
    if (!formData.description?.trim()) errs.description = "Mô tả không được để trống.";
    if (!formData.price || isNaN(formData.price) || Number(formData.price) < 0)
      errs.price = "Giá phải là số >= 0.";
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
      selectedTags.forEach((tid) => form.append("tags", tid));
      const result = await updateCourse(courseId, form);
      toast.success(result?.message || "Cập nhật khóa học thành công!");
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    } finally {
      setSaving(false);
    }
  };

  // ==================== CHAPTER HANDLERS ====================
  const resetChapterForm = () => {
    setChapterForm(emptyChapter());
    setEditingChapterId(null);
    setShowChapterForm(false);
  };

  const handleAddChapter = () => {
    resetChapterForm();
    setShowChapterForm(true);
  };

  const handleEditChapter = (chapter) => {
    setChapterForm({ title: chapter.title, description: chapter.description || "" });
    setEditingChapterId(chapter.id);
    setShowChapterForm(true);
  };

  const handleSaveChapter = async () => {
    if (!chapterForm.title?.trim()) {
      toast.error("Tên chương không được để trống.");
      return;
    }
    try {
      if (editingChapterId) {
        await updateChapter(editingChapterId, chapterForm);
        toast.success("Cập nhật chương thành công!");
      } else {
        await createChapter(courseId, chapterForm);
        toast.success("Thêm chương thành công!");
      }
      resetChapterForm();
      loadCurriculum();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    }
  };

  const handleDeleteChapter = async (chapterId) => {
    if (!window.confirm("Xóa chương sẽ xóa tất cả bài học bên trong. Bạn có chắc?")) return;
    try {
      await deleteChapter(chapterId);
      toast.success("Xóa chương thành công!");
      loadCurriculum();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    }
  };

  // ==================== LESSON HANDLERS ====================
  const resetLessonForm = () => {
    setLessonForm(emptyLesson());
    setEditingLessonId(null);
    setLessonChapterId(null);
    setShowLessonForm(false);
  };

  const handleAddLesson = (chapterId) => {
    resetLessonForm();
    setLessonChapterId(chapterId);
    setShowLessonForm(true);
  };

  const handleEditLesson = (chapterId, lesson) => {
    setLessonChapterId(chapterId);
    setEditingLessonId(lesson.id);
    setLessonForm({
      title: lesson.title || "",
      description: lesson.description || "",
      content_type: lesson.content_type || "VIDEO",
      is_free: lesson.is_free || false,
      material_file: null,
      video_url: lesson.video_url || "",
    });
    setShowLessonForm(true);
  };

  const handleSaveLesson = async () => {
    if (!lessonForm.title?.trim()) {
      toast.error("Tên bài học không được để trống.");
      return;
    }
    try {
      const form = new FormData();
      form.append("title", lessonForm.title.trim());
      form.append("description", lessonForm.description.trim());
      form.append("content_type", lessonForm.content_type);
      form.append("is_free", lessonForm.is_free ? "true" : "false");
      if (lessonForm.content_type === "VIDEO" && lessonForm.video_url) {
        form.append("video_url", lessonForm.video_url.trim());
      }
      if (lessonForm.material_file) {
        form.append("material_file", lessonForm.material_file);
      }

      if (editingLessonId) {
        await updateLesson(editingLessonId, form);
        toast.success("Cập nhật bài học thành công!");
      } else {
        await createLesson(lessonChapterId, form);
        toast.success("Thêm bài học thành công!");
      }
      resetLessonForm();
      loadCurriculum();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("Bạn có chắc muốn xóa bài học này?")) return;
    try {
      await deleteLesson(lessonId);
      toast.success("Xóa bài học thành công!");
      loadCurriculum();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    }
  };

  // ==================== QUIZ HANDLERS ====================
  const resetQuizForm = () => {
    setQuizForm(emptyQuiz());
    setEditingQuizId(null);
    setQuizLessonId(null);
    setShowQuizForm(false);
  };

  const handleAddQuiz = (lessonId) => {
    resetQuizForm();
    setQuizLessonId(lessonId);
    setShowQuizForm(true);
  };

  const handleEditQuiz = (lessonId, quiz) => {
    setQuizLessonId(lessonId);
    setEditingQuizId(quiz.id);
    setQuizForm({
      title: quiz.title || "",
      description: quiz.description || "",
      time_limit_minutes: quiz.time_limit_minutes || null,
      passing_score: quiz.passing_score || 0,
    });
    setShowQuizForm(true);
  };

  const handleSaveQuiz = async () => {
    if (!quizForm.title?.trim()) {
      toast.error("Tên bài tập không được để trống.");
      return;
    }
    try {
      const payload = {
        ...quizForm,
        time_limit_minutes: quizForm.time_limit_minutes ? Number(quizForm.time_limit_minutes) : null,
        passing_score: Number(quizForm.passing_score),
      };
      if (editingQuizId) {
        await updateQuiz(editingQuizId, payload);
        toast.success("Cập nhật bài tập thành công!");
      } else {
        await createQuiz(quizLessonId, payload);
        toast.success("Thêm bài tập thành công!");
      }
      resetQuizForm();
      loadCurriculum();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm("Bạn có chắc muốn xóa bài tập này?")) return;
    try {
      await deleteQuiz(quizId);
      toast.success("Xóa bài tập thành công!");
      loadCurriculum();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    }
  };

  // ==================== QUESTION HANDLERS ====================
  const resetQuestionForm = () => {
    setQuestionForm(emptyQuestion());
    setEditingQuestionId(null);
    setQuestionQuizId(null);
    setShowQuestionForm(false);
  };

  const handleAddQuestion = (quizId) => {
    resetQuestionForm();
    setQuestionQuizId(quizId);
    setShowQuestionForm(true);
  };

  const handleEditQuestion = (quizId, question) => {
    setQuestionQuizId(quizId);
    setEditingQuestionId(question.id);
    setQuestionForm({
      question_type: question.question_type || "MCQ",
      prompt: question.prompt || "",
      points: question.points || 1,
      order: question.order || 1,
      correct_text_answer: question.correct_text_answer || "",
      options: question.options?.map((o) => ({ text: o.text, is_correct: o.is_correct })) || [],
    });
    setShowQuestionForm(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.prompt?.trim()) {
      toast.error("Nội dung câu hỏi không được để trống.");
      return;
    }
    if (questionForm.question_type === "MCQ") {
      if (questionForm.options.length < 2) {
        toast.error("Câu hỏi trắc nghiệm cần ít nhất 2 đáp án.");
        return;
      }
      if (!questionForm.options.some((o) => o.is_correct)) {
        toast.error("Cần ít nhất 1 đáp án đúng.");
        return;
      }
    }
    if (questionForm.question_type === "FILL_BLANK" && !questionForm.correct_text_answer?.trim()) {
      toast.error("Câu hỏi điền khuyết cần có đáp án đúng.");
      return;
    }
    try {
      const payload = {
        ...questionForm,
        points: Number(questionForm.points),
        order: Number(questionForm.order),
      };
      if (editingQuestionId) {
        await updateQuestion(editingQuestionId, payload);
        toast.success("Cập nhật câu hỏi thành công!");
      } else {
        await createQuestion(questionQuizId, payload);
        toast.success("Thêm câu hỏi thành công!");
      }
      resetQuestionForm();
      loadCurriculum();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Bạn có chắc muốn xóa câu hỏi này?")) return;
    try {
      await deleteQuestion(questionId);
      toast.success("Xóa câu hỏi thành công!");
      loadCurriculum();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    }
  };

  // Question option helpers
  const addOption = () => {
    setQuestionForm((prev) => ({
      ...prev,
      options: [...prev.options, emptyOption()],
    }));
  };

  const updateOption = (index, field, value) => {
    setQuestionForm((prev) => {
      const opts = [...prev.options];
      opts[index] = { ...opts[index], [field]: value };
      return { ...prev, options: opts };
    });
  };

  const removeOption = (index) => {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
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
          <i className="bi bi-arrow-left me-2"></i>Quay lại
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
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="course-form-group">
            <label className="course-form-label">Tags</label>
            <div className="d-flex flex-wrap gap-2">
              {tags.map((tag) => (
                <label key={tag.id} className="tag-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.id)}
                    onChange={() => {
                      setSelectedTags((prev) =>
                        prev.includes(tag.id)
                          ? prev.filter((id) => id !== tag.id)
                          : [...prev, tag.id]
                      );
                    }}
                  />
                  <span className="ms-1">{tag.name}</span>
                </label>
              ))}
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

      {/* ===== CURRICULUM BUILDER ===== */}
      <div className="course-form-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="course-form-section-title mb-0">Curriculum Builder</h4>
          <button className="course-btn-primary btn-sm" onClick={handleAddChapter}>
            <i className="bi bi-plus-lg me-1"></i>Thêm chương
          </button>
        </div>

        {/* Chapter Form */}
        {showChapterForm && (
          <div className="chapter-form mb-3 p-3 bg-light rounded border">
            <h6 className="fw-bold mb-2">
              {editingChapterId ? "Chỉnh sửa chương" : "Thêm chương mới"}
            </h6>
            <div className="course-form-row">
              <div className="course-form-group flex-grow-1">
                <input
                  type="text" className="course-form-input"
                  placeholder="Tên chương"
                  value={chapterForm.title}
                  onChange={(e) => setChapterForm((p) => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div className="course-form-group flex-grow-1">
                <input
                  type="text" className="course-form-input"
                  placeholder="Mô tả (không bắt buộc)"
                  value={chapterForm.description}
                  onChange={(e) => setChapterForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="d-flex gap-2 mt-2">
              <button className="course-btn-primary btn-sm" onClick={handleSaveChapter}>
                {editingChapterId ? "Cập nhật" : "Thêm"}
              </button>
              <button className="course-btn-outline btn-sm" onClick={resetChapterForm}>Hủy</button>
            </div>
          </div>
        )}

        {/* Curriculum Tree */}
        {curriculum.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <i className="bi bi-collection" style={{ fontSize: 32 }}></i>
            <p className="mt-2">Chưa có chương nào. Thêm chương đầu tiên!</p>
          </div>
        ) : (
          <div className="curriculum-tree">
            {curriculum.map((chapter, cIdx) => (
              <div key={chapter.id} className="chapter-node mb-3 border rounded">
                {/* Chapter Header */}
                <div className="chapter-header d-flex justify-content-between align-items-center p-3 bg-light">
                  <div>
                    <strong>Chương {cIdx + 1}: {chapter.title}</strong>
                    {chapter.description && (
                      <small className="d-block text-muted">{chapter.description}</small>
                    )}
                  </div>
                  <div className="chapter-actions">
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEditChapter(chapter)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteChapter(chapter.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>

                {/* Lessons */}
                <div className="chapter-lessons p-3">
                  {(chapter.lessons || []).length === 0 ? (
                    <p className="text-muted small mb-2">Chưa có bài học nào.</p>
                  ) : (
                    chapter.lessons.map((lesson, lIdx) => (
                      <div key={lesson.id} className="lesson-node mb-2 p-2 border rounded">
                        {/* Lesson Header */}
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>Bài {lIdx + 1}: {lesson.title}</strong>
                            <span className="badge bg-secondary ms-2">
                              {lesson.content_type === "VIDEO" ? "Video" : "Tài liệu"}
                            </span>
                            {lesson.is_free && (
                              <span className="badge bg-success ms-1">Miễn phí</span>
                            )}
                          </div>
                          <div className="lesson-actions">
                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEditLesson(chapter.id, lesson)}>
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-danger me-1" onClick={() => handleDeleteLesson(lesson.id)}>
                              <i className="bi bi-trash"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-success" onClick={() => handleAddQuiz(lesson.id)}>
                              <i className="bi bi-plus-circle me-1"></i>Bài tập
                            </button>
                          </div>
                        </div>

                        {/* Quizzes */}
                        <div className="lesson-quizzes ms-3 mt-2">
                          {(lesson.quizzes || []).length === 0 ? (
                            <p className="text-muted small mb-0">Chưa có bài tập nào.</p>
                          ) : (
                            lesson.quizzes.map((quiz, qIdx) => (
                              <div key={quiz.id} className="quiz-node mb-2 p-2 border rounded bg-light">
                                {/* Quiz Header */}
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <strong>Bài tập {qIdx + 1}: {quiz.title}</strong>
                                    {quiz.time_limit_minutes && (
                                      <span className="badge bg-info ms-2">{quiz.time_limit_minutes} phút</span>
                                    )}
                                    <span className="badge bg-warning ms-1">Đạt: {quiz.passing_score}</span>
                                  </div>
                                  <div className="quiz-actions">
                                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEditQuiz(lesson.id, quiz)}>
                                      <i className="bi bi-pencil"></i>
                                    </button>
                                    <button className="btn btn-sm btn-outline-danger me-1" onClick={() => handleDeleteQuiz(quiz.id)}>
                                      <i className="bi bi-trash"></i>
                                    </button>
                                    <button className="btn btn-sm btn-outline-success" onClick={() => handleAddQuestion(quiz.id)}>
                                      <i className="bi bi-plus-circle me-1"></i>Câu hỏi
                                    </button>
                                  </div>
                                </div>

                                {/* Questions */}
                                <div className="quiz-questions ms-3 mt-2">
                                  {(quiz.questions || []).length === 0 ? (
                                    <p className="text-muted small mb-0">Chưa có câu hỏi nào.</p>
                                  ) : (
                                    quiz.questions.map((question, qnIdx) => (
                                      <div key={question.id} className="question-node mb-1 p-2 border rounded">
                                        <div className="d-flex justify-content-between align-items-center">
                                          <div>
                                            <small>
                                              <strong>Câu {qnIdx + 1}:</strong> {question.prompt?.substring(0, 80)}
                                              {question.prompt?.length > 80 ? "..." : ""}
                                            </small>
                                            <span className="badge bg-secondary ms-2">
                                              {question.question_type === "MCQ" ? "Trắc nghiệm" :
                                               question.question_type === "FILL_BLANK" ? "Điền khuyết" : "Tự luận"}
                                            </span>
                                            <span className="badge bg-primary ms-1">{question.points} điểm</span>
                                          </div>
                                          <div>
                                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEditQuestion(quiz.id, question)}>
                                              <i className="bi bi-pencil"></i>
                                            </button>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteQuestion(question.id)}>
                                              <i className="bi bi-trash"></i>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Add Lesson Button */}
                  <button className="course-btn-outline btn-sm mt-2" onClick={() => handleAddLesson(chapter.id)}>
                    <i className="bi bi-plus-lg me-1"></i>Thêm bài học
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== LESSON FORM MODAL ===== */}
      {showLessonForm && (
        <div className="modal-backdrop-custom">
          <div className="modal-content-custom">
            <h5 className="fw-bold mb-3">
              {editingLessonId ? "Chỉnh sửa bài học" : "Thêm bài học mới"}
            </h5>
            <div className="course-form-group">
              <label className="course-form-label">Tên bài học <span className="text-danger">*</span></label>
              <input
                type="text" className="course-form-input"
                value={lessonForm.title}
                onChange={(e) => setLessonForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="course-form-group">
              <label className="course-form-label">Mô tả</label>
              <textarea
                className="course-form-textarea" rows={2}
                value={lessonForm.description}
                onChange={(e) => setLessonForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="course-form-row">
              <div className="course-form-group">
                <label className="course-form-label">Loại nội dung</label>
                <select
                  className="course-form-input"
                  value={lessonForm.content_type}
                  onChange={(e) => setLessonForm((p) => ({ ...p, content_type: e.target.value }))}
                >
                  <option value="VIDEO">Video</option>
                  <option value="DOCUMENT">Tài liệu</option>
                </select>
              </div>
              <div className="course-form-group">
                <label className="course-form-label">Miễn phí</label>
                <select
                  className="course-form-input"
                  value={lessonForm.is_free ? "true" : "false"}
                  onChange={(e) => setLessonForm((p) => ({ ...p, is_free: e.target.value === "true" }))}
                >
                  <option value="false">Không</option>
                  <option value="true">Có</option>
                </select>
              </div>
            </div>
            {lessonForm.content_type === "VIDEO" && (
              <div className="course-form-group">
                <label className="course-form-label">URL Video (YouTube)</label>
                <input
                  type="url" className="course-form-input"
                  value={lessonForm.video_url}
                  onChange={(e) => setLessonForm((p) => ({ ...p, video_url: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            )}
            <div className="course-form-group">
              <label className="course-form-label">Tài liệu đính kèm</label>
              <input
                type="file" className="course-form-input"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setLessonForm((p) => ({ ...p, material_file: e.target.files[0] }))}
              />
            </div>
            <div className="d-flex gap-2 mt-3">
              <button className="course-btn-primary btn-sm" onClick={handleSaveLesson}>
                {editingLessonId ? "Cập nhật" : "Thêm"}
              </button>
              <button className="course-btn-outline btn-sm" onClick={resetLessonForm}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== QUIZ FORM MODAL ===== */}
      {showQuizForm && (
        <div className="modal-backdrop-custom">
          <div className="modal-content-custom">
            <h5 className="fw-bold mb-3">
              {editingQuizId ? "Chỉnh sửa bài tập" : "Thêm bài tập mới"}
            </h5>
            <div className="course-form-group">
              <label className="course-form-label">Tên bài tập <span className="text-danger">*</span></label>
              <input
                type="text" className="course-form-input"
                value={quizForm.title}
                onChange={(e) => setQuizForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="course-form-group">
              <label className="course-form-label">Mô tả</label>
              <textarea
                className="course-form-textarea" rows={2}
                value={quizForm.description}
                onChange={(e) => setQuizForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="course-form-row">
              <div className="course-form-group">
                <label className="course-form-label">Thời gian (phút)</label>
                <input
                  type="number" className="course-form-input" min="0"
                  value={quizForm.time_limit_minutes || ""}
                  onChange={(e) => setQuizForm((p) => ({ ...p, time_limit_minutes: e.target.value }))}
                />
              </div>
              <div className="course-form-group">
                <label className="course-form-label">Điểm đạt</label>
                <input
                  type="number" className="course-form-input" min="0"
                  value={quizForm.passing_score}
                  onChange={(e) => setQuizForm((p) => ({ ...p, passing_score: e.target.value }))}
                />
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button className="course-btn-primary btn-sm" onClick={handleSaveQuiz}>
                {editingQuizId ? "Cập nhật" : "Thêm"}
              </button>
              <button className="course-btn-outline btn-sm" onClick={resetQuizForm}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== QUESTION FORM MODAL ===== */}
      {showQuestionForm && (
        <div className="modal-backdrop-custom">
          <div className="modal-content-custom">
            <h5 className="fw-bold mb-3">
              {editingQuestionId ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
            </h5>
            <div className="course-form-group">
              <label className="course-form-label">Loại câu hỏi</label>
              <select
                className="course-form-input"
                value={questionForm.question_type}
                onChange={(e) => setQuestionForm((p) => ({ ...p, question_type: e.target.value }))}
              >
                <option value="MCQ">Trắc nghiệm</option>
                <option value="FILL_BLANK">Điền khuyết</option>
                <option value="ESSAY">Tự luận</option>
              </select>
            </div>
            <div className="course-form-group">
              <label className="course-form-label">Nội dung câu hỏi <span className="text-danger">*</span></label>
              <textarea
                className="course-form-textarea" rows={3}
                value={questionForm.prompt}
                onChange={(e) => setQuestionForm((p) => ({ ...p, prompt: e.target.value }))}
              />
            </div>
            <div className="course-form-row">
              <div className="course-form-group">
                <label className="course-form-label">Điểm</label>
                <input
                  type="number" className="course-form-input" min="0.5" step="0.5"
                  value={questionForm.points}
                  onChange={(e) => setQuestionForm((p) => ({ ...p, points: e.target.value }))}
                />
              </div>
              <div className="course-form-group">
                <label className="course-form-label">Thứ tự</label>
                <input
                  type="number" className="course-form-input" min="1"
                  value={questionForm.order}
                  onChange={(e) => setQuestionForm((p) => ({ ...p, order: e.target.value }))}
                />
              </div>
            </div>

            {questionForm.question_type === "FILL_BLANK" && (
              <div className="course-form-group">
                <label className="course-form-label">Đáp án đúng <span className="text-danger">*</span></label>
                <input
                  type="text" className="course-form-input"
                  value={questionForm.correct_text_answer}
                  onChange={(e) => setQuestionForm((p) => ({ ...p, correct_text_answer: e.target.value }))}
                  placeholder="Nhập đáp án đúng"
                />
              </div>
            )}

            {questionForm.question_type === "MCQ" && (
              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong className="small">Đáp án</strong>
                  <button type="button" className="course-btn-sm course-btn-outline" onClick={addOption}>
                    <i className="bi bi-plus-lg me-1"></i>Thêm đáp án
                  </button>
                </div>
                {questionForm.options.map((opt, oIdx) => (
                  <div key={oIdx} className="option-row d-flex align-items-center gap-2 mb-2">
                    <input
                      type="text" className="course-form-input flex-grow-1"
                      value={opt.text}
                      onChange={(e) => updateOption(oIdx, "text", e.target.value)}
                      placeholder={`Đáp án ${oIdx + 1}`}
                    />
                    <label className="d-flex align-items-center">
                      <input
                        type="radio"
                        name={`correct-opt-${questionQuizId}-${editingQuestionId || "new"}`}
                        checked={opt.is_correct}
                        onChange={() => {
                          questionForm.options.forEach((_, oi) => updateOption(oi, "is_correct", oi === oIdx));
                        }}
                      />
                      <span className="ms-1 small">Đúng</span>
                    </label>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeOption(oIdx)}>
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="d-flex gap-2 mt-3">
              <button className="course-btn-primary btn-sm" onClick={handleSaveQuestion}>
                {editingQuestionId ? "Cập nhật" : "Thêm"}
              </button>
              <button className="course-btn-outline btn-sm" onClick={resetQuestionForm}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal and tag styles are now in instructor-courses.css */}
    </div>
  );
}

export default InstructorCourseEditPage;
