import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  getCurriculum,
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
} from "../../services/curriculumService";

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

export default function useCurriculumBuilder(courseId, isDraft = false) {
  const [curriculum, setCurriculum] = useState([]);

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

  // ==================== LOAD ====================
  const loadCurriculum = useCallback(async () => {
    if (isDraft) {
      // Draft mode: load from localStorage
      const raw = localStorage.getItem("course_draft");
      if (raw) {
        try {
          const draft = JSON.parse(raw);
          setCurriculum(draft.curriculum || []);
        } catch {
          setCurriculum([]);
        }
      }
      return;
    }
    try {
      const res = await getCurriculum(courseId);
      const data = res?.data || res;
      setCurriculum(data?.chapters || []);
    } catch (error) {
      console.error("Failed to load curriculum:", error);
      // curriculum may be empty for new courses, that's fine
      setCurriculum([]);
    }
  }, [courseId, isDraft]);

  useEffect(() => {
    loadCurriculum();
  }, [loadCurriculum]);

  // Draft mode helpers
  const saveDraft = (newCurriculum) => {
    if (!isDraft) return;
    const raw = localStorage.getItem("course_draft");
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      draft.curriculum = newCurriculum;
      localStorage.setItem("course_draft", JSON.stringify(draft));
    } catch { /* ignore */ }
  };

  // ==================== CHAPTER ====================
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
    if (isDraft) {
      // Draft mode: save locally
      let newCurriculum;
      if (editingChapterId) {
        newCurriculum = curriculum.map((ch) =>
          ch.id === editingChapterId
            ? { ...ch, title: chapterForm.title.trim(), description: chapterForm.description?.trim() || "" }
            : ch
        );
        toast.success("Cập nhật chương thành công!");
      } else {
        const newChapter = {
          id: Date.now(),
          title: chapterForm.title.trim(),
          description: chapterForm.description?.trim() || "",
          lessons: [],
        };
        newCurriculum = [...curriculum, newChapter];
        toast.success("Thêm chương thành công!");
      }
      setCurriculum(newCurriculum);
      saveDraft(newCurriculum);
      resetChapterForm();
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
    if (isDraft) {
      const newCurriculum = curriculum.filter((ch) => ch.id !== chapterId);
      setCurriculum(newCurriculum);
      saveDraft(newCurriculum);
      toast.success("Xóa chương thành công!");
      return;
    }
    try {
      await deleteChapter(chapterId);
      toast.success("Xóa chương thành công!");
      loadCurriculum();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    }
  };

  // ==================== LESSON ====================
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
    if (isDraft) {
      const newCurriculum = curriculum.map((ch) => {
        if (ch.id !== lessonChapterId) return ch;
        let newLessons;
        if (editingLessonId) {
          newLessons = ch.lessons.map((l) =>
            l.id === editingLessonId
              ? { ...l, title: lessonForm.title.trim(), description: lessonForm.description?.trim() || "", content_type: lessonForm.content_type, is_free: lessonForm.is_free, video_url: lessonForm.video_url || "" }
              : l
          );
        } else {
          const newLesson = {
            id: Date.now(),
            title: lessonForm.title.trim(),
            description: lessonForm.description?.trim() || "",
            content_type: lessonForm.content_type,
            is_free: lessonForm.is_free,
            video_url: lessonForm.video_url || "",
            quizzes: [],
          };
          newLessons = [...ch.lessons, newLesson];
        }
        return { ...ch, lessons: newLessons };
      });
      setCurriculum(newCurriculum);
      saveDraft(newCurriculum);
      toast.success(editingLessonId ? "Cập nhật bài học thành công!" : "Thêm bài học thành công!");
      resetLessonForm();
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
    if (isDraft) {
      const newCurriculum = curriculum.map((ch) => ({
        ...ch,
        lessons: ch.lessons.filter((l) => l.id !== lessonId),
      }));
      setCurriculum(newCurriculum);
      saveDraft(newCurriculum);
      toast.success("Xóa bài học thành công!");
      return;
    }
    try {
      await deleteLesson(lessonId);
      toast.success("Xóa bài học thành công!");
      loadCurriculum();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    }
  };

  // ==================== QUIZ ====================
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
    if (isDraft) {
      const newCurriculum = curriculum.map((ch) => ({
        ...ch,
        lessons: ch.lessons.map((l) => {
          if (l.id !== quizLessonId) return l;
          let newQuizzes;
          if (editingQuizId) {
            newQuizzes = l.quizzes.map((q) =>
              q.id === editingQuizId
                ? { ...q, title: quizForm.title.trim(), description: quizForm.description?.trim() || "", time_limit_minutes: quizForm.time_limit_minutes ? Number(quizForm.time_limit_minutes) : null, passing_score: Number(quizForm.passing_score) }
                : q
            );
          } else {
            const newQuiz = {
              id: Date.now(),
              title: quizForm.title.trim(),
              description: quizForm.description?.trim() || "",
              time_limit_minutes: quizForm.time_limit_minutes ? Number(quizForm.time_limit_minutes) : null,
              passing_score: Number(quizForm.passing_score),
              questions: [],
            };
            newQuizzes = [...l.quizzes, newQuiz];
          }
          return { ...l, quizzes: newQuizzes };
        }),
      }));
      setCurriculum(newCurriculum);
      saveDraft(newCurriculum);
      toast.success(editingQuizId ? "Cập nhật bài tập thành công!" : "Thêm bài tập thành công!");
      resetQuizForm();
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
    if (isDraft) {
      const newCurriculum = curriculum.map((ch) => ({
        ...ch,
        lessons: ch.lessons.map((l) => ({
          ...l,
          quizzes: l.quizzes.filter((q) => q.id !== quizId),
        })),
      }));
      setCurriculum(newCurriculum);
      saveDraft(newCurriculum);
      toast.success("Xóa bài tập thành công!");
      return;
    }
    try {
      await deleteQuiz(quizId);
      toast.success("Xóa bài tập thành công!");
      loadCurriculum();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    }
  };

  // ==================== QUESTION ====================
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
    if (isDraft) {
      const newCurriculum = curriculum.map((ch) => ({
        ...ch,
        lessons: ch.lessons.map((l) => ({
          ...l,
          quizzes: l.quizzes.map((q) => {
            if (q.id !== questionQuizId) return q;
            let newQuestions;
            if (editingQuestionId) {
              newQuestions = q.questions.map((qu) =>
                qu.id === editingQuestionId
                  ? { ...qu, question_type: questionForm.question_type, prompt: questionForm.prompt.trim(), points: Number(questionForm.points), order: Number(questionForm.order), correct_text_answer: questionForm.correct_text_answer || "", options: questionForm.options }
                  : qu
              );
            } else {
              const newQuestion = {
                id: Date.now(),
                question_type: questionForm.question_type,
                prompt: questionForm.prompt.trim(),
                points: Number(questionForm.points),
                order: Number(questionForm.order),
                correct_text_answer: questionForm.correct_text_answer || "",
                options: questionForm.options,
              };
              newQuestions = [...q.questions, newQuestion];
            }
            return { ...q, questions: newQuestions };
          }),
        })),
      }));
      setCurriculum(newCurriculum);
      saveDraft(newCurriculum);
      toast.success(editingQuestionId ? "Cập nhật câu hỏi thành công!" : "Thêm câu hỏi thành công!");
      resetQuestionForm();
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
    if (isDraft) {
      const newCurriculum = curriculum.map((ch) => ({
        ...ch,
        lessons: ch.lessons.map((l) => ({
          ...l,
          quizzes: l.quizzes.map((q) => ({
            ...q,
            questions: q.questions.filter((qu) => qu.id !== questionId),
          })),
        })),
      }));
      setCurriculum(newCurriculum);
      saveDraft(newCurriculum);
      toast.success("Xóa câu hỏi thành công!");
      return;
    }
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

  return {
    curriculum,
    // Chapter
    chapterForm, setChapterForm,
    editingChapterId,
    showChapterForm,
    handleAddChapter,
    handleEditChapter,
    handleSaveChapter,
    handleDeleteChapter,
    resetChapterForm,
    // Lesson
    lessonForm, setLessonForm,
    editingLessonId,
    lessonChapterId,
    showLessonForm,
    handleAddLesson,
    handleEditLesson,
    handleSaveLesson,
    handleDeleteLesson,
    resetLessonForm,
    // Quiz
    quizForm, setQuizForm,
    editingQuizId,
    quizLessonId,
    showQuizForm,
    handleAddQuiz,
    handleEditQuiz,
    handleSaveQuiz,
    handleDeleteQuiz,
    resetQuizForm,
    // Question
    questionForm, setQuestionForm,
    editingQuestionId,
    questionQuizId,
    showQuestionForm,
    handleAddQuestion,
    handleEditQuestion,
    handleSaveQuestion,
    handleDeleteQuestion,
    resetQuestionForm,
    // Option helpers
    addOption,
    updateOption,
    removeOption,
  };
}
