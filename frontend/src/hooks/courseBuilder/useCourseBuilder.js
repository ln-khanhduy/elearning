import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getAdminCourseDetailApi,
  createAdminCourseApi,
  updateAdminCourseApi,
  publishAdminCourseApi,
  getCategoriesApi,
  getCurriculumApi,
  getCoursePlansApi,
  getAssignedInstructorApi,
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
import { useQuizEditor } from "./useQuizEditor";

export function useCourseBuilder({ mode = "create" }) {
  const navigate = useNavigate();

  const showErrorToast = (error, fallbackMsg) => {
    const msg = error?.message || fallbackMsg || "";
    if (!msg || msg.includes("Khóa đã public")) return;
    toast.error(msg);
  };
  const { courseId: courseIdFromParams } = useParams();
  const isEdit = mode === "edit" && !!courseIdFromParams;

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
  // (R2) Không còn trường price — giá nằm trong CourseAccessPlan (StepPricing quản lý riêng)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    preview_video_url: "",
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [errors, setErrors] = useState({});

  // Curriculum
  const [curriculum, setCurriculum] = useState([]);

  // Course access plans (StepPricing) — quản lý ở đây để StepReview/StepPublish kiểm tra được
  const [plans, setPlans] = useState([]);

  // Giảng viên được phân công (Bước 4) — dùng để kiểm tra trước khi xuất bản ở Bước 5
  const [assignedInstructor, setAssignedInstructor] = useState(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Import modal
  const [importQuizId, setImportQuizId] = useState(null);

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
    variant: "danger",
  });

  const {
    handleSaveQuiz,
    handleAddQuiz,
    handleSelectQuiz,
    handleDeleteQuiz,
  } = useQuizEditor({
    isEdit,
    selectedItem,
    setCurriculum,
    setEditingItem,
    setEditingSectionId,
    setSelectedItem,
    setSaving,
    setConfirmModal,
    setDrawerType,
    setDrawerOpen,
  });

  // ===== INITIALIZATION =====

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

  const loadCourse = useCallback(async () => {
    try {
      const res = await getAdminCourseDetailApi(courseIdFromParams);
      const data = res?.data || res;
      setCourse(data);
      setFormData({
        title: data.title || "",
        description: data.description || "",
        category: data.category?.id ?? data.category ?? "",
        preview_video_url: data.preview_video_url || "",
      });
      setThumbnailPreview(data.thumbnail_url || "");

      try {
        const curRes = await getCurriculumApi(courseIdFromParams);
        const curData = curRes?.data?.chapters || curRes?.chapters || [];
        setCurriculum(Array.isArray(curData) ? curData : []);
      } catch {
        setCurriculum([]);
      }

      try {
        const plansRes = await getCoursePlansApi(courseIdFromParams);
        const plansData = plansRes?.data ?? plansRes ?? [];
        setPlans(Array.isArray(plansData) ? plansData : []);
      } catch {
        setPlans([]);
      }

      try {
        const instructorRes = await getAssignedInstructorApi(courseIdFromParams);
        const instructorData = instructorRes?.data || instructorRes;
        if (instructorData?.assigned_instructor_id) {
          setAssignedInstructor({
            id: instructorData.assigned_instructor_id,
            name: instructorData.assigned_instructor_name,
            avatar: instructorData.assigned_instructor_avatar,
          });
        } else {
          setAssignedInstructor(null);
        }
      } catch {
        setAssignedInstructor(null);
      }
    } catch {
      toast.error("Không thể tải thông tin khóa học.");
      navigate("/admin/courses");
    } finally {
      setLoading(false);
    }
  }, [courseIdFromParams, navigate]);

  useEffect(() => {
    if (isEdit) {
      // loadCourse fetch data từ API — setState trong async callback, an toàn
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadCourse();
    }
  }, [isEdit, loadCourse]);

  // ===== FORM HANDLERS =====

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

  const validateStep1 = useCallback(() => {
    const errs = {};
    if (!formData.title?.trim()) errs.title = "Tiêu đề không được để trống.";
    if (!formData.description?.trim())
      errs.description = "Mô tả không được để trống.";
    if (!formData.category) errs.category = "Vui lòng chọn danh mục.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [formData]);

  // ===== AUTO SAVE =====

  const saveDraft = useCallback(async () => {
    setSaving(true);
    try {
      if (!isEdit) {
        const form = new FormData();
        form.append("title", formData.title?.trim() || "");
        form.append("description", formData.description?.trim() || "");
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
      if (formData.category) form.append("category", formData.category);
      if (formData.preview_video_url)
        form.append("preview_video_url", formData.preview_video_url.trim());
      if (thumbnail) form.append("thumbnail", thumbnail);

      const result = await updateAdminCourseApi(courseIdFromParams, form);
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
  }, [isEdit, courseIdFromParams, formData, thumbnail, navigate]);

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

  // ===== CURRICULUM: SECTION =====

  const handleAddSection = useCallback(async () => {
    if (!isEdit) {
      toast.warning("Vui lòng lưu thông tin cơ bản trước.");
      return;
    }
    try {
      const res = await createChapterApi(courseIdFromParams, {
        title: `Chương ${curriculum.length + 1}`,
      });
      const newChapter = res?.data || res;
      setCurriculum((prev) => [...prev, newChapter]);
      toast.success("Đã thêm chương mới.");
    } catch (error) {
      showErrorToast(error, "Không thể thêm chương.");
    }
  }, [isEdit, courseIdFromParams, curriculum]);

  const handleEditSection = useCallback(async (sectionId, newTitle) => {
    if (!newTitle) return;
    try {
      await updateChapterApi(sectionId, { title: newTitle });
      setCurriculum((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, title: newTitle } : s))
      );
      toast.success("Đã cập nhật chương.");
    } catch (error) {
      showErrorToast(error, "Không thể cập nhật chương.");
    }
  }, []);

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
          showErrorToast(error, "Không thể xóa chương.");
        }
      },
      onCancel: () => setConfirmModal((prev) => ({ ...prev, show: false })),
    });
  }, []);

  // ===== CURRICULUM: LESSON =====

  const handleAddLesson = useCallback(async (sectionId) => {
    const newLesson = {
      id: `temp_${Date.now()}`,
      title: "Bài học mới",
      content_type: "VIDEO",
      section_id: sectionId,
    };
    if (isEdit) {
      try {
        const res = await createLessonApi(sectionId, { title: "Bài học mới" });
        newLesson.id = res?.data?.id || res?.id || newLesson.id;
      } catch (error) {
        showErrorToast(error, "Không thể thêm bài học.");
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
  }, [isEdit]);

  const handleSelectLesson = useCallback((lesson, sectionId) => {
    setEditingItem(lesson);
    setEditingSectionId(sectionId);
    setDrawerType("lesson");
    setDrawerOpen(true);
    setSelectedItem({ type: "lesson", id: lesson.id });
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setDrawerType(null);
    setEditingItem(null);
    setSelectedItem(null);
  }, []);

  const handleSaveLesson = useCallback(
    async (lessonData) => {
      if (!isEdit) return;
      setSaving(true);
      try {
        let payload = lessonData;
        if (lessonData.material_file instanceof File) {
          const fd = new FormData();
          // Chỉ append các trường thực sự được gửi từ component (tránh gửi trường rỗng
          // khi khóa đã PUBLIC — backend chỉ cho phép video_url/material_file/material_url)
          ["title", "description", "content_type", "video_url"].forEach((key) => {
            if (lessonData[key] !== undefined) fd.append(key, lessonData[key]);
          });
          fd.append("material_file", lessonData.material_file);
          payload = fd;
        }

        if (lessonData.id) {
          const res = await updateLessonApi(lessonData.id, payload);
          const updatedLesson = res?.data || res;
          setCurriculum((prev) =>
            prev.map((s) =>
              s.id === lessonData.section_id
                ? {
                    ...s,
                    lessons: (s.lessons || []).map((l) =>
                      l.id === lessonData.id ? { ...l, ...updatedLesson } : l
                    ),
                  }
                : s
            )
          );
          if (updatedLesson) {
            setEditingItem((prev) =>
              prev?.id === lessonData.id ? { ...prev, ...updatedLesson } : prev
            );
          }
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
        showErrorToast(error, "Không thể lưu bài học.");
      } finally {
        setSaving(false);
      }
    },
    [isEdit]
  );

  const handleDeleteLesson = useCallback(
    async (lessonId, sectionId) => {
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
                  ? {
                      ...s,
                      lessons: (s.lessons || []).filter((l) => l.id !== lessonId),
                    }
                  : s
              )
            );
            if (selectedItem?.id === lessonId) {
              setDrawerOpen(false);
              setSelectedItem(null);
            }
            toast.success("Đã xóa bài học.");
          } catch (error) {
            showErrorToast(error, "Không thể xóa bài học.");
          }
        },
        onCancel: () => setConfirmModal((prev) => ({ ...prev, show: false })),
      });
    },
    [selectedItem]
  );

  const handleImportQuestions = useCallback((quizId) => {
    setImportQuizId(quizId);
  }, []);

  // ===== STEP NAVIGATION =====

  const handleNext = useCallback(() => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep < 5) setCurrentStep((prev) => prev + 1);
  }, [currentStep, validateStep1]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  }, [currentStep]);

  const handleGoToStep = useCallback((step) => {
    if (step >= 1 && step <= 5) setCurrentStep(step);
  }, []);

  // ===== ASSIGN INSTRUCTOR (BƯỚC 4) =====

  const handleAssignedChange = useCallback((instructor) => {
    setAssignedInstructor(instructor);
  }, []);

  // ===== CREATE COURSE =====

  const handleCreateCourse = useCallback(async () => {
    if (!validateStep1()) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.append("title", formData.title.trim());
      form.append("description", formData.description.trim());
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
  }, [validateStep1, formData, thumbnail, navigate]);

  // ===== PUBLISH =====

  const handlePublish = useCallback(async () => {
    if (!isEdit) return;
    // Kiểm tra đã phân công giảng viên trước khi xuất bản
    if (!assignedInstructor?.id) {
      toast.error("Vui lòng phân công giảng viên phụ trách trước khi xuất bản khóa học.");
      return;
    }
    setPublishing(true);
    try {
      await saveDraft();
      if (course?.status === "PUBLISHED") {
        toast.success("Khóa học đã được cập nhật!");
      } else {
        await publishAdminCourseApi(courseIdFromParams);
        toast.success("Khóa học đã được xuất bản!");
      }
      navigate("/admin/courses");
    } catch (error) {
      toast.error(error.message || "Không thể xuất bản.");
    } finally {
      setPublishing(false);
    }
  }, [isEdit, courseIdFromParams, saveDraft, course, navigate, assignedInstructor]);

  // ===== IMPORT QUESTION CALLBACK =====

  const handleImportSuccess = useCallback(async () => {
    if (!isEdit) return;
    try {
      const res = await getCurriculumApi(courseIdFromParams);
      const curData = res?.data?.chapters || res?.chapters || [];
      setCurriculum(Array.isArray(curData) ? curData : []);

      const updatedQuiz = (Array.isArray(curData) ? curData : [])
        .flatMap((s) => s.lessons || [])
        .flatMap((l) => l.quizzes || [])
        .find((q) => q.id === importQuizId);
      if (updatedQuiz) {
        setEditingItem((prev) =>
          prev?.id === importQuizId ? { ...prev, ...updatedQuiz } : prev
        );
      }
    } catch {
      // ignore
    }
  }, [isEdit, courseIdFromParams, importQuizId]);

  return {
    courseId: courseIdFromParams,
    isEdit,
    currentStep,
    loading,
    saving,
    publishing,
    lastSavedAt,
    isDirty,
    course,
    categories,
    formData,
    thumbnailPreview,
    errors,
    curriculum,
    plans,
    setPlans,
    assignedInstructor,
    drawerOpen,
    drawerType,
    editingItem,
    editingSectionId,
    selectedItem,
    importQuizId,
    confirmModal,
    setImportQuizId,
    setConfirmModal,
    // Handlers - Form
    handleFieldChange,
    handleThumbnailChange,
    validateStep1,

    // Handlers - Curriculum
    handleAddSection,
    handleEditSection,
    handleDeleteSection,
    handleAddLesson,
    handleSaveLesson,
    handleDeleteLesson,
    handleSelectLesson,
    handleCloseDrawer,
    handleImportQuestions,
    handleImportSuccess,

    // Handlers - Quiz (từ useQuizEditor)
    handleSaveQuiz,
    handleAddQuiz,
    handleSelectQuiz,
    handleDeleteQuiz,

    // Handlers - Navigation & Publish
    handleNext,
    handlePrevious,
    handleGoToStep,
    handleAssignedChange,
    handleCreateCourse,
    handlePublish,
    saveDraft,
  };
}
