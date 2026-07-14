import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import CourseStepper from "../../components/course-wizard/CourseStepper";
import StickyActionBar from "../../components/course-wizard/StickyActionBar";
import AutoSaveIndicator from "../../components/course-wizard/shared/AutoSaveIndicator";
import LoadingSkeleton from "../../components/course-wizard/shared/LoadingSkeleton";
import QuestionImportModal from "../../components/course-wizard/curriculum/QuestionImportModal";
import ConfirmModal from "../../components/common/ConfirmModal";

import StepCourseInformation from "../../components/course-wizard/steps/StepCourseInformation";
import StepCurriculumBuilder from "../../components/course-wizard/steps/StepCurriculumBuilder";
import StepPricing from "../../components/course-wizard/steps/StepPricing";
import StepReview from "../../components/course-wizard/steps/StepReview";
import StepPublish from "../../components/course-wizard/steps/StepPublish";

import {
  getAdminCourseDetailApi,
  createAdminCourseApi,
  updateAdminCourseApi,
  publishAdminCourseApi,
  getCategoriesApi,
  getCurriculumApi,
} from "../../api/courseAPI";
import {
  createChapterApi,
  updateChapterApi,
  deleteChapterApi,
} from "../../api/chapterAPI";
import {
  createLessonApi,
  updateLessonApi,
  deleteLessonApi,
} from "../../api/lessonAPI";
import {
  createQuizApi,
  updateQuizApi,
  deleteQuizApi,
} from "../../api/quizAPI";
import {
  createQuestionApi,
  updateQuestionApi,
  getQuestionsApi,
} from "../../api/questionAPI";

import "../../style/course-wizard.css";

const STEPS = [1, 2, 3, 4, 5];

export default function CourseBuilderPage({ mode = "create" }) {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const isEdit = mode === "edit" && courseId;

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const autoSaveTimer = useRef(null);

  // Course data
  const [course, setCourse] = useState(null);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    is_free: false,
    discount_price: "",
    preview_video_url: "",
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [errors, setErrors] = useState({});

  // Curriculum
  const [curriculum, setCurriculum] = useState([]);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState(null); // "lesson" | "quiz"
  const [editingItem, setEditingItem] = useState(null);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Import modal
  const [importQuizId, setImportQuizId] = useState(null);

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState({ show: false, title: "", message: "", onConfirm: null, variant: "danger" });

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const cats = await getCategoriesApi();
        setCategories(cats?.data || cats || []);
      } catch {
        // ignore
      }
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    if (!isEdit) {
      setLoading(false);
      return;
    }
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const res = await getAdminCourseDetailApi(courseId);
      const data = res?.data || res;
      setCourse(data);
      setFormData({
        title: data.title || "",
        description: data.description || "",
        price: data.price ?? "",
        category: data.category?.id ?? data.category ?? "",
        is_free: data.price == 0,
        discount_price: data.discount_price ?? "",
        preview_video_url: data.preview_video_url || "",
      });
      setThumbnailPreview(data.thumbnail_url || "");

      // Load curriculum
      try {
        const curRes = await getCurriculumApi(courseId);
        // Response structure: { success: true, data: { id, title, ..., chapters: [...] } }
        const curData = curRes?.data?.chapters || curRes?.chapters || [];
        setCurriculum(Array.isArray(curData) ? curData : []);
      } catch {
        setCurriculum([]);
      }
    } catch {
      toast.error("Không thể tải thông tin khóa học.");
      navigate("/admin/courses");
    } finally {
      setLoading(false);
    }
  };

  // ==================== AUTO SAVE ====================

  const saveDraft = useCallback(async () => {
    setSaving(true);
    try {
      // Nếu đang tạo mới, tạo khóa học trước rồi chuyển sang edit
      if (!isEdit) {
        const form = new FormData();
        form.append("title", formData.title?.trim() || "");
        form.append("description", formData.description?.trim() || "");
        form.append("price", formData.price || 0);
        if (formData.category) form.append("category", formData.category);
        if (formData.preview_video_url?.trim())
          form.append("preview_video_url", formData.preview_video_url.trim());
        if (thumbnail) form.append("thumbnail", thumbnail);

        const res = await createAdminCourseApi(form);
        const newCourseId = res?.data?.id || res?.id;
        if (newCourseId) {
          toast.success("Đã lưu nháp!");
          navigate(`/admin/courses/${newCourseId}/edit`, { replace: true });
        }
        return;
      }

      const form = new FormData();
      form.append("title", formData.title?.trim() || "");
      form.append("description", formData.description?.trim() || "");
      form.append("price", formData.price || 0);
      if (formData.category) form.append("category", formData.category);
      if (formData.preview_video_url)
        form.append("preview_video_url", formData.preview_video_url.trim());
      if (formData.discount_price)
        form.append("discount_price", formData.discount_price);
      if (thumbnail) form.append("thumbnail", thumbnail);

      const result = await updateAdminCourseApi(courseId, form);
      const updatedData = result?.data || result;
      if (updatedData) {
        setCourse(updatedData);
        setThumbnail(null);
      }
      setLastSavedAt(Date.now());
      setIsDirty(false);
    } catch (error) {
      toast.error(error.message || "Không thể lưu.");
    } finally {
      setSaving(false);
    }
  }, [isEdit, courseId, formData, thumbnail, navigate]);

  // Debounced auto-save
  useEffect(() => {
    if (!isEdit || !isDirty) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveDraft();
    }, 2000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [isDirty, isEdit, saveDraft]);

  // beforeunload warning
  useEffect(() => {
    const handler = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ==================== FORM HANDLERS ====================

  const handleFieldChange = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  const handleThumbnailChange = useCallback((file) => {
    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
    setIsDirty(true);
  }, []);

  const validateStep1 = () => {
    const errs = {};
    if (!formData.title?.trim()) errs.title = "Tiêu đề không được để trống.";
    if (!formData.description?.trim())
      errs.description = "Mô tả không được để trống.";
    if (!formData.category) errs.category = "Vui lòng chọn danh mục.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ==================== CURRICULUM HANDLERS ====================

  const handleAddSection = useCallback(async () => {
    if (!isEdit) {
      toast.warning("Vui lòng lưu thông tin cơ bản trước.");
      return;
    }
    try {
      const res = await createChapterApi(courseId, {
        title: `Chương ${curriculum.length + 1}`,
      });
      const newChapter = res?.data || res;
      setCurriculum((prev) => [...prev, newChapter]);
      toast.success("Đã thêm chương mới.");
    } catch (error) {
      toast.error(error.message || "Không thể thêm chương.");
    }
  }, [isEdit, courseId, curriculum]);

  const handleEditSection = useCallback(
    async (sectionId, newTitle) => {
      if (!newTitle) return;
      try {
        await updateChapterApi(sectionId, { title: newTitle });
        setCurriculum((prev) =>
          prev.map((s) =>
            s.id === sectionId ? { ...s, title: newTitle } : s
          )
        );
        toast.success("Đã cập nhật chương.");
      } catch (error) {
        toast.error(error.message || "Không thể cập nhật chương.");
      }
    },
    []
  );

  const handleDeleteSection = useCallback(async (sectionId) => {
    setConfirmModal({
      show: true,
      title: "Xóa chương",
      message: "Bạn có chắc chắn muốn xóa chương này?",
      variant: "danger",
      confirmLabel: "Xóa",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, show: false }));
        try {
          await deleteChapterApi(sectionId);
          setCurriculum((prev) => prev.filter((s) => s.id !== sectionId));
          toast.success("Đã xóa chương.");
        } catch (error) {
          toast.error(error.message || "Không thể xóa chương.");
        }
      },
      onCancel: () => setConfirmModal((prev) => ({ ...prev, show: false })),
    });
  }, []);

  const handleAddLesson = useCallback(
    async (sectionId) => {
      const newLesson = {
        id: `temp_${Date.now()}`,
        title: "Bài học mới",
        content_type: "VIDEO",
        section_id: sectionId,
      };
      if (isEdit) {
        try {
          const res = await createLessonApi(sectionId, {
            title: "Bài học mới",
          });
          newLesson.id = res?.data?.id || res?.id || newLesson.id;
        } catch (error) {
          toast.error(error.message || "Không thể thêm bài học.");
          return;
        }
      }
      setCurriculum((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? { ...s, lessons: [...(s.lessons || []), newLesson] }
            : s
        )
      );
      setEditingItem(newLesson);
      setEditingSectionId(sectionId);
      setDrawerType("lesson");
      setDrawerOpen(true);
      setSelectedItem({ type: "lesson", id: newLesson.id });
    },
    [isEdit]
  );

  const handleSaveLesson = useCallback(
    async (lessonData) => {
      if (!isEdit) return;
      setSaving(true);
      try {
        // If there's a material file, use FormData
        let payload = lessonData;
        if (lessonData.material_file instanceof File) {
          const fd = new FormData();
          fd.append("title", lessonData.title || "");
          fd.append("description", lessonData.description || "");
          fd.append("content_type", lessonData.content_type || "VIDEO");
          fd.append("video_url", lessonData.video_url || "");
          fd.append("material_file", lessonData.material_file);
          payload = fd;
        }

        if (lessonData.id) {
          await updateLessonApi(lessonData.id, payload);
          setCurriculum((prev) =>
            prev.map((s) =>
              s.id === lessonData.section_id
                ? {
                    ...s,
                    lessons: (s.lessons || []).map((l) =>
                      l.id === lessonData.id ? { ...l, ...lessonData } : l
                    ),
                  }
                : s
            )
          );
        } else {
          const res = await createLessonApi(lessonData.section_id, payload);
          const newLesson = res?.data || res;
          setCurriculum((prev) =>
            prev.map((s) =>
              s.id === lessonData.section_id
                ? { ...s, lessons: [...(s.lessons || []), newLesson] }
                : s
            )
          );
        }
        toast.success("Đã lưu bài học.");
      } catch (error) {
        toast.error(error.message || "Không thể lưu bài học.");
      } finally {
        setSaving(false);
      }
    },
    [isEdit]
  );

  const handleDeleteLesson = useCallback(async (lessonId, sectionId) => {
    setConfirmModal({
      show: true,
      title: "Xóa bài học",
      message: "Bạn có chắc chắn muốn xóa bài học này?",
      variant: "danger",
      confirmLabel: "Xóa",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, show: false }));
        try {
          await deleteLessonApi(lessonId);
          setCurriculum((prev) =>
            prev.map((s) =>
              s.id === sectionId
                ? { ...s, lessons: (s.lessons || []).filter((l) => l.id !== lessonId) }
                : s
            )
          );
          if (selectedItem?.id === lessonId) {
            setDrawerOpen(false);
            setSelectedItem(null);
          }
          toast.success("Đã xóa bài học.");
        } catch (error) {
          toast.error(error.message || "Không thể xóa bài học.");
        }
      },
      onCancel: () => setConfirmModal((prev) => ({ ...prev, show: false })),
    });
  }, [selectedItem]);

  const QUIZ_TYPE_LABELS = {
    MCQ: "Trắc nghiệm",
    ESSAY: "Tự luận",
    FILL_BLANK: "Điền khuyết",
  };

  const handleAddQuiz = useCallback(
    async (lessonId, sectionId, quizType = "MCQ") => {
      const typeLabel = QUIZ_TYPE_LABELS[quizType] || "Bài tập";
      const newQuiz = {
        id: `temp_${Date.now()}`,
        title: `Bài tập ${typeLabel.toLowerCase()}`,
        questions_count: 0,
        lesson_id: lessonId,
        section_id: sectionId,
        quiz_type: quizType,
      };
      // Don't create quiz on backend yet - wait until user clicks "Lưu"
      setCurriculum((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                lessons: (s.lessons || []).map((l) =>
                  l.id === lessonId
                    ? { ...l, quizzes: [...(l.quizzes || []), newQuiz] }
                    : l
                ),
              }
            : s
        )
      );
      setEditingItem(newQuiz);
      setEditingSectionId(sectionId);
      setDrawerType("quiz");
      setDrawerOpen(true);
      setSelectedItem({ type: "quiz", id: newQuiz.id });
    },
    []
  );

  const handleSaveQuiz = useCallback(
    async (quizData) => {
      if (!isEdit) return;
      setSaving(true);
      try {
        // Map question_type to quiz_type for backend compatibility
        const payload = { ...quizData };
        if (payload.question_type && !payload.quiz_type) {
          payload.quiz_type = payload.question_type;
        }
        // Lưu prompt và correct_text_answer riêng để tạo Question sau (cho ESSAY/FILL_BLANK)
        const prompt = payload.prompt || "";
        const correctTextAnswer = payload.correct_text_answer || "";
        delete payload.question_type;
        delete payload.prompt;
        delete payload.correct_text_answer;
        delete payload.section_id;
        delete payload.lesson_id;
        delete payload.id;
        delete payload.questions_count;

        const isTempId = typeof quizData.id === "string" && quizData.id.startsWith("temp_");
        if (isTempId) {
          // New quiz - create on backend
          const res = await createQuizApi(quizData.lesson_id, payload);
          const newQuiz = res?.data || res;
          const newQuizId = newQuiz?.id;

          // Nếu là ESSAY hoặc FILL_BLANK và có prompt, tạo Question tương ứng
          if (newQuizId && prompt && (payload.quiz_type === "ESSAY" || payload.quiz_type === "FILL_BLANK")) {
            try {
              const questionPayload = {
                prompt: prompt,
                points: 10,
                order: 1,
                question_type: payload.quiz_type,
              };
              // FILL_BLANK cần có correct_text_answer
              if (payload.quiz_type === "FILL_BLANK" && correctTextAnswer) {
                questionPayload.correct_text_answer = correctTextAnswer;
              }
              await createQuestionApi(newQuizId, questionPayload);
            } catch (questionErr) {
              // Không throw lỗi ở đây - quiz đã được tạo thành công
              console.error("Không thể tạo câu hỏi cho quiz:", questionErr);
            }
          }

          setCurriculum((prev) =>
            prev.map((s) =>
              s.id === quizData.section_id
                ? {
                    ...s,
                    lessons: (s.lessons || []).map((l) =>
                      l.id === (quizData.lesson_id || quizData.lesson)
                        ? {
                            ...l,
                            quizzes: (l.quizzes || []).map((q) =>
                              q.id === quizData.id ? { ...q, ...newQuiz, id: newQuiz.id } : q
                            ),
                          }
                        : l
                    ),
                  }
                : s
            )
          );
          // Update editingItem with the real ID from backend
          setEditingItem((prev) => prev?.id === quizData.id ? { ...prev, ...newQuiz, id: newQuiz.id } : prev);
          setSelectedItem((prev) => prev?.id === quizData.id ? { ...prev, id: newQuiz.id } : prev);
        } else if (quizData.id) {
          // Existing quiz - update on backend
          await updateQuizApi(quizData.id, payload);

          // Nếu là ESSAY hoặc FILL_BLANK và có prompt, cập nhật hoặc tạo Question
          if (prompt && (payload.quiz_type === "ESSAY" || payload.quiz_type === "FILL_BLANK")) {
            try {
              // Lấy danh sách questions hiện tại
              const questionsRes = await getQuestionsApi(quizData.id);
              const existingQuestions = questionsRes?.data || questionsRes || [];
              const questionPayload = {
                prompt: prompt,
                points: 10,
                order: 1,
                question_type: payload.quiz_type,
              };
              // FILL_BLANK cần có correct_text_answer
              if (payload.quiz_type === "FILL_BLANK" && correctTextAnswer) {
                questionPayload.correct_text_answer = correctTextAnswer;
              }
              if (existingQuestions.length > 0) {
                // Cập nhật question đầu tiên
                await updateQuestionApi(existingQuestions[0].id, questionPayload);
              } else {
                // Tạo question mới
                await createQuestionApi(quizData.id, questionPayload);
              }
            } catch (questionErr) {
              console.error("Không thể cập nhật/tạo câu hỏi cho quiz:", questionErr);
            }
          }

          setCurriculum((prev) =>
            prev.map((s) =>
              s.id === quizData.section_id
                ? {
                    ...s,
                    lessons: (s.lessons || []).map((l) =>
                      l.id === (quizData.lesson_id || quizData.lesson)
                        ? {
                            ...l,
                            quizzes: (l.quizzes || []).map((q) =>
                              q.id === quizData.id ? { ...q, ...payload } : q
                            ),
                          }
                        : l
                    ),
                  }
                : s
            )
          );
        }
        toast.success("Đã lưu bài tập.");
      } catch (error) {
        toast.error(error.message || "Không thể lưu bài tập.");
      } finally {
        setSaving(false);
      }
    },
    [isEdit]
  );

  const handleDeleteQuiz = useCallback(async (quizId, sectionId) => {
    setConfirmModal({
      show: true,
      title: "Xóa bài tập",
      message: "Bạn có chắc chắn muốn xóa bài tập này?",
      variant: "danger",
      confirmLabel: "Xóa",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, show: false }));
        try {
          await deleteQuizApi(quizId);
          setCurriculum((prev) =>
            prev.map((s) =>
              s.id === sectionId
                ? {
                    ...s,
                    lessons: (s.lessons || []).map((l) => ({
                      ...l,
                      quizzes: (l.quizzes || []).filter((q) => q.id !== quizId),
                    })),
                  }
                : s
            )
          );
          if (selectedItem?.id === quizId) {
            setDrawerOpen(false);
            setSelectedItem(null);
          }
          toast.success("Đã xóa bài tập.");
        } catch (error) {
          toast.error(error.message || "Không thể xóa bài tập.");
        }
      },
      onCancel: () => setConfirmModal((prev) => ({ ...prev, show: false })),
    });
  }, [selectedItem]);

  const handleSelectLesson = useCallback((lesson, sectionId) => {
    setEditingItem(lesson);
    setEditingSectionId(sectionId);
    setDrawerType("lesson");
    setDrawerOpen(true);
    setSelectedItem({ type: "lesson", id: lesson.id });
  }, []);

  const handleSelectQuiz = useCallback((quiz, sectionId) => {
    setEditingItem(quiz);
    setEditingSectionId(sectionId);
    setDrawerType("quiz");
    setDrawerOpen(true);
    setSelectedItem({ type: "quiz", id: quiz.id });
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setDrawerType(null);
    setEditingItem(null);
    setSelectedItem(null);
  }, []);

  const handleImportQuestions = useCallback((quizId) => {
    setImportQuizId(quizId);
  }, []);

  // ==================== STEP NAVIGATION ====================

  const handleNext = useCallback(() => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep < 5) setCurrentStep((prev) => prev + 1);
  }, [currentStep, formData]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  }, [currentStep]);

  const handleGoToStep = useCallback((step) => {
    if (step >= 1 && step <= 5) setCurrentStep(step);
  }, []);

  // ==================== CREATE COURSE ====================

  const handleCreateCourse = useCallback(async () => {
    if (!validateStep1()) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.append("title", formData.title.trim());
      form.append("description", formData.description.trim());
      form.append("price", formData.price || 0);
      if (formData.category) form.append("category", formData.category);
      if (formData.preview_video_url?.trim())
        form.append("preview_video_url", formData.preview_video_url.trim());
      if (thumbnail) form.append("thumbnail", thumbnail);

      const res = await createAdminCourseApi(form);
      const newCourseId = res?.data?.id || res?.id;
      if (newCourseId) {
        toast.success("Tạo khóa học thành công!");
        navigate(`/admin/courses/${newCourseId}/edit`, { replace: true });
      }
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra khi tạo khóa học.");
    } finally {
      setSaving(false);
    }
  }, [formData, thumbnail, navigate]);

  // ==================== PUBLISH ====================

  const handlePublish = useCallback(async () => {
    if (!isEdit) return;
    setPublishing(true);
    try {
      await saveDraft();
      if (course?.status === "PUBLISHED") {
        toast.success("Khóa học đã được cập nhật!");
      } else {
        await publishAdminCourseApi(courseId);
        toast.success("Khóa học đã được xuất bản!");
      }
      navigate("/admin/courses");
    } catch (error) {
      toast.error(error.message || "Không thể xuất bản.");
    } finally {
      setPublishing(false);
    }
  }, [isEdit, courseId, saveDraft, course?.status, navigate]);

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="cw-page">
        <LoadingSkeleton type="form" />
      </div>
    );
  }

  return (
    <div className="cw-page">
      {/* Header */}
      <div className="cw-header">
        <div className="cw-header-left">
          <button
            className="cw-header-back"
            onClick={() => navigate("/admin/courses")}
          >
            <i className="bi bi-arrow-left"></i>
            <span>Quay lại</span>
          </button>
          <h1 className="cw-header-title">
            {isEdit ? "Chỉnh sửa khóa học" : "Tạo khóa học mới"}
          </h1>
        </div>
        <div className="cw-header-right">
          {course?.status && (
            <span
              className={`cw-status-badge ${
                course.status === "PUBLISHED"
                  ? "cw-status-published"
                  : course.status === "HIDDEN"
                  ? "cw-status-hidden"
                  : "cw-status-draft"
              }`}
            >
              <i
                className={`bi ${
                  course.status === "PUBLISHED"
                    ? "bi-globe2"
                    : course.status === "HIDDEN"
                    ? "bi-eye-slash"
                    : "bi-pencil"
                }`}
              ></i>
              {course.status === "PUBLISHED"
                ? "Đã xuất bản"
                : course.status === "HIDDEN"
                ? "Ẩn"
                : "Nháp"}
            </span>
          )}
          <AutoSaveIndicator saving={saving} lastSavedAt={lastSavedAt} />
        </div>
      </div>

      {/* Stepper */}
      <CourseStepper currentStep={currentStep} onStepClick={handleGoToStep} />

      {/* Body */}
      <div className="cw-body">
        {currentStep === 1 && (
          <StepCourseInformation
            formData={formData}
            errors={errors}
            onFieldChange={handleFieldChange}
            onThumbnailChange={handleThumbnailChange}
            thumbnailPreview={thumbnailPreview}
            categories={categories}
          />
        )}

        {currentStep === 2 && (
          <StepCurriculumBuilder
            curriculum={curriculum}
            selectedItem={selectedItem}
            drawerOpen={drawerOpen}
            drawerType={drawerType}
            editingItem={editingItem}
            editingSectionId={editingSectionId}
            saving={saving}
            onSelectLesson={handleSelectLesson}
            onSelectQuiz={handleSelectQuiz}
            onCloseDrawer={handleCloseDrawer}
            onSaveLesson={handleSaveLesson}
            onSaveQuiz={handleSaveQuiz}
            onAddSection={handleAddSection}
            onEditSection={handleEditSection}
            onDeleteSection={handleDeleteSection}
            onAddLesson={handleAddLesson}
            onAddQuiz={handleAddQuiz}
            onDeleteLesson={handleDeleteLesson}
            onDeleteQuiz={handleDeleteQuiz}
            onImportQuestions={handleImportQuestions}
          />
        )}

        {currentStep === 3 && (
          <StepPricing
            formData={formData}
            errors={errors}
            onFieldChange={handleFieldChange}
          />
        )}

        {currentStep === 4 && (
          <StepReview
            formData={formData}
            thumbnailPreview={thumbnailPreview}
            curriculum={curriculum}
          />
        )}

        {currentStep === 5 && (
          <StepPublish
            formData={formData}
            thumbnailPreview={thumbnailPreview}
            curriculum={curriculum}
            course={course}
            onSaveDraft={saveDraft}
            onPublish={handlePublish}
            onGoToStep={handleGoToStep}
            saving={saving}
            publishing={publishing}
            isEdit={isEdit}
          />
        )}
      </div>

      {/* Action Bar */}
      {currentStep < 5 && (
        <StickyActionBar
          currentStep={currentStep}
          isFirstStep={currentStep === 1}
          isLastStep={currentStep === 5}
          onPrevious={handlePrevious}
          onNext={currentStep === 1 && !isEdit ? handleCreateCourse : handleNext}
          isEdit={isEdit}
          onSaveDraft={saveDraft}
          saving={saving}
          nextLabel={currentStep === 1 && !isEdit ? "Tạo khóa học" : "Tiếp theo"}
          hidePrevious={currentStep === 1}
        />
      )}

      {/* Import Modal */}
      {importQuizId && (
        <QuestionImportModal
          quizId={importQuizId}
          onClose={() => setImportQuizId(null)}
          onImportSuccess={async () => {
            if (isEdit) {
              try {
                const res = await getCurriculumApi(courseId);
                const curData = res?.data?.chapters || res?.chapters || [];
                setCurriculum(Array.isArray(curData) ? curData : []);
                // Update editingItem with fresh data from backend
                const updatedQuiz = (Array.isArray(curData) ? curData : []).flatMap(
                  (s) => s.lessons || []
                ).flatMap(
                  (l) => l.quizzes || []
                ).find(
                  (q) => q.id === importQuizId
                );
                if (updatedQuiz) {
                  setEditingItem((prev) =>
                    prev?.id === importQuizId ? { ...prev, ...updatedQuiz } : prev
                  );
                }
              } catch {
                // ignore
              }
            }
            setImportQuizId(null);
          }}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel || "Xác nhận"}
        cancelLabel="Hủy"
        variant={confirmModal.variant || "danger"}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel}
      />
    </div>
  );
}
