import { useCallback } from "react";
import { toast } from "react-toastify";
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
import {
  buildQuizApiPayload,
  buildQuestionPayload,
} from "../../services/quizService";
import { QUIZ_TYPE_LABELS } from "../../utils/quiz";

/**
 * Hook quản lý toàn bộ logic CRUD Quiz trong Course Builder.
 * Tách riêng khỏi CourseBuilderPage để mỗi handler có một trách nhiệm rõ ràng.
 */
export function useQuizEditor({
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
}) {
  /** Lưu quiz (tạo mới hoặc cập nhật) kèm Question tự luận/điền khuyết */
  const handleSaveQuiz = useCallback(
    async (quizData) => {
      if (!isEdit) return;
      setSaving(true);
      try {
        const { payload, prompt, correctTextAnswer } = buildQuizApiPayload(quizData);
        const isTempId = typeof quizData.id === "string" && quizData.id.startsWith("temp_");

        if (isTempId) {
          // Tạo quiz mới trên backend
          const res = await createQuizApi(quizData.lesson_id, payload);
          const newQuiz = res?.data || res;
          const newQuizId = newQuiz?.id;

          // ESSAY/FILL_BLANK: tạo Question kèm theo
          if (
            newQuizId &&
            prompt &&
            (payload.quiz_type === "ESSAY" || payload.quiz_type === "FILL_BLANK")
          ) {
            try {
              await createQuestionApi(
                newQuizId,
                buildQuestionPayload(payload.quiz_type, prompt, correctTextAnswer)
              );
            } catch (questionErr) {
              // Không throw lỗi ở đây — quiz đã được tạo thành công
              console.error("Không thể tạo câu hỏi cho quiz:", questionErr);
            }
          }

          // Giữ prompt/correct_text_answer vì API không trả về các trường này
          const newQuizWithPrompt = { ...newQuiz, prompt, correct_text_answer: correctTextAnswer };

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
                              q.id === quizData.id ? { ...q, ...newQuizWithPrompt, id: newQuiz.id } : q
                            ),
                          }
                        : l
                    ),
                  }
                : s
            )
          );
          // Cập nhật id thật từ backend để lần sau mở lại là quiz hợp lệ
          setEditingItem((prev) =>
            prev?.id === quizData.id ? { ...prev, ...newQuizWithPrompt, id: newQuiz.id } : prev
          );
          setSelectedItem((prev) =>
            prev?.id === quizData.id ? { ...prev, id: newQuiz.id } : prev
          );
        } else if (quizData.id) {
          // Cập nhật quiz đã tồn tại
          await updateQuizApi(quizData.id, payload);

          // ESSAY/FILL_BLANK: cập nhật hoặc tạo Question tương ứng
          if (
            prompt &&
            (payload.quiz_type === "ESSAY" || payload.quiz_type === "FILL_BLANK")
          ) {
            try {
              const questionsRes = await getQuestionsApi(quizData.id);
              const existingQuestions = questionsRes?.data || questionsRes || [];
              const questionPayload = buildQuestionPayload(payload.quiz_type, prompt, correctTextAnswer);

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

          // Giữ prompt/correct_text_answer để hiển thị khi mở lại quiz
          const mergedPayload = { ...payload, prompt, correct_text_answer: correctTextAnswer };

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
                              q.id === quizData.id ? { ...q, ...mergedPayload } : q
                            ),
                          }
                        : l
                    ),
                  }
                : s
            )
          );
          // Cập nhật editingItem để drawer hiển thị dữ liệu mới ngay lập tức
          setEditingItem((prev) =>
            prev?.id === quizData.id ? { ...prev, ...mergedPayload } : prev
          );
        }
        toast.success("Đã lưu bài tập.");
      } catch (error) {
        toast.error(error.message || "Không thể lưu bài tập.");
      } finally {
        setSaving(false);
      }
    },
    [isEdit, setCurriculum, setEditingItem, setSelectedItem, setSaving]
  );

  /** Thêm quiz tạm vào curriculum (chưa gọi API) */
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
      // Không tạo quiz trên backend — chờ user nhấn "Lưu"
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
    [setCurriculum, setEditingItem, setEditingSectionId, setDrawerType, setDrawerOpen, setSelectedItem]
  );

  /** Mở quiz để chỉnh sửa, kèm prompt/correct_text_answer từ questions[0] nếu cần */
  const handleSelectQuiz = useCallback(
    (quiz, sectionId) => {
      const firstQuestion = quiz.questions?.[0];
      const enhancedQuiz = {
        ...quiz,
        prompt: quiz.prompt || firstQuestion?.prompt || "",
        correct_text_answer:
          quiz.correct_text_answer || firstQuestion?.correct_text_answer || "",
      };
      setEditingItem(enhancedQuiz);
      setEditingSectionId(sectionId);
      setDrawerType("quiz");
      setDrawerOpen(true);
      setSelectedItem({ type: "quiz", id: quiz.id });
    },
    [setEditingItem, setEditingSectionId, setDrawerType, setDrawerOpen, setSelectedItem]
  );

  /** Xóa quiz với confirm modal */
  const handleDeleteQuiz = useCallback(
    async (quizId, sectionId) => {
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
    },
    [selectedItem, setConfirmModal, setCurriculum, setDrawerOpen, setSelectedItem]
  );

  return {
    handleSaveQuiz,
    handleAddQuiz,
    handleSelectQuiz,
    handleDeleteQuiz,
  };
}