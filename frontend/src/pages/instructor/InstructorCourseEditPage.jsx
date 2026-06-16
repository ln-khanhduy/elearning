import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useCourseEditor from "../../hooks/course-builder/useCourseEditor";
import useCurriculumBuilder from "../../hooks/course-builder/useCurriculumBuilder";
import CourseInfoForm from "../../components/course-builder/CourseInfoForm";
import CurriculumBuilder from "../../components/course-builder/CurriculumBuilder";
import LessonFormModal from "../../components/course-builder/LessonFormModal";
import QuizFormModal from "../../components/course-builder/QuizFormModal";
import QuestionFormModal from "../../components/course-builder/QuestionFormModal";
import { createCourse, submitForReview } from "../../services/courseService";
import apiClient from "../../api/apiClient";

const DRAFT_KEY = "course_draft";

function InstructorCourseEditPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const isDraft = courseId === "create";

  const editor = useCourseEditor(isDraft ? null : courseId);
  const builder = useCurriculumBuilder(isDraft ? null : courseId, isDraft);

  const [saving, setSaving] = useState(false);

  // Helper: chuyển base64 thành Blob/File
  const base64ToFile = (base64, filename = "thumbnail.jpg") => {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  // ==================== DRAFT: Hoàn thành ====================
  const handleCompleteDraft = async () => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) {
      toast.error("Không tìm thấy dữ liệu khóa học.");
      return;
    }
    const draft = JSON.parse(raw);
    const courseInfo = draft.form;

    setSaving(true);
    try {
      // 1. Tạo course
      const formData = new FormData();
      formData.append("title", courseInfo.title);
      formData.append("description", courseInfo.description);
      formData.append("price", courseInfo.price);
      formData.append("category", courseInfo.category);
      if (courseInfo.preview_video_url) {
        formData.append("preview_video_url", courseInfo.preview_video_url);
      }
      if (draft.thumbnail) {
        const thumbFile = base64ToFile(draft.thumbnail, "thumbnail.jpg");
        formData.append("thumbnail", thumbFile);
      }

      const res = await createCourse(formData);
      // Response structure: { success: true, message: "...", data: { id, title, ... } }
      const newCourseId = res?.data?.id || res?.id || res?.data?.course_id;
      if (!newCourseId) {
        console.error("Không thể lấy ID khóa học từ response:", JSON.stringify(res));
        throw new Error("Không thể tạo khóa học. Response: " + JSON.stringify(res));
      }

      // Xóa draft ngay sau khi tạo course thành công
      localStorage.removeItem(DRAFT_KEY);

      // 2. Tạo chapters và lessons
      const curriculum = draft.curriculum || [];
      for (const chapter of curriculum) {
        if (!chapter.title?.trim()) continue;

        const chapterRes = await apiClient.post(`/api/lessons/courses/${newCourseId}/chapters/create/`, {
          title: chapter.title,
          description: chapter.description || "",
        });
        const chapterData = chapterRes.data;
        const chapterId = chapterData?.data?.id;
        if (!chapterId) continue;

        for (const lesson of chapter.lessons || []) {
          if (!lesson.title?.trim()) continue;

          const lessonFormData = new FormData();
          lessonFormData.append("title", lesson.title);
          lessonFormData.append("description", lesson.description || "");
          lessonFormData.append("content_type", lesson.content_type || "VIDEO");
          lessonFormData.append("is_free", lesson.is_free ? "true" : "false");
          if (lesson.video_url) lessonFormData.append("video_url", lesson.video_url);

          const lessonRes = await apiClient.post(`/api/lessons/chapters/${chapterId}/lessons/create/`, lessonFormData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          const lessonData = lessonRes.data;
          const lessonId = lessonData?.data?.id;
          if (!lessonId) continue;

          for (const quiz of lesson.quizzes || []) {
            if (!quiz.title?.trim()) continue;

            const quizRes = await apiClient.post(`/api/quizzes/lessons/${lessonId}/quizzes/create/`, {
              title: quiz.title,
              description: quiz.description || "",
              time_limit_minutes: quiz.time_limit_minutes,
              passing_score: quiz.passing_score || 0,
            });
            const quizData = quizRes.data;
            const quizId = quizData?.data?.id;
            if (!quizId) continue;

            for (const question of quiz.questions || []) {
              if (!question.prompt?.trim()) continue;

              await apiClient.post(`/api/quizzes/quizzes/${quizId}/questions/create/`, {
                question_type: question.question_type || "MCQ",
                prompt: question.prompt,
                points: question.points || 1,
                order: question.order || 1,
                correct_text_answer: question.correct_text_answer || "",
                options: question.options || [],
              });
            }
          }
        }
      }

      toast.success("Tạo khóa học thành công!");
      navigate("/instructor/courses");
    } catch (error) {
      const errMsg = error.message || "";
      // Kiểm tra lỗi duplicate slug - khóa học đã tồn tại
      if (errMsg.includes("slug") || errMsg.includes("already exists")) {
        toast.error("Tiêu đề khóa học đã tồn tại. Vui lòng đặt tên khác.");
      } else {
        toast.error(errMsg || "Có lỗi xảy ra khi tạo khóa học.");
      }
    } finally {
      setSaving(false);
    }
  };

  // ==================== DRAFT MODE ====================
  if (isDraft) {
    const raw = localStorage.getItem(DRAFT_KEY);
    let courseInfo = null;
    if (raw) {
      try { courseInfo = JSON.parse(raw).form; } catch { /* ignore */ }
    }

    if (!courseInfo) {
      return (
        <div className="instructor-courses-page">
          <div className="text-center py-5">
            <p>Không tìm thấy dữ liệu khóa học.</p>
            <button className="course-btn-primary" onClick={() => navigate("/instructor/courses/create")}>
              Tạo lại
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="instructor-courses-page">
        <div className="courses-header">
          <div>
            <h2>Tạo khóa học</h2>
            <p className="text-muted">{courseInfo.title}</p>
          </div>
        </div>

        <CurriculumBuilder
          curriculum={builder.curriculum}
          showChapterForm={builder.showChapterForm}
          chapterForm={builder.chapterForm}
          editingChapterId={builder.editingChapterId}
          onChapterFormChange={(v) => builder.setChapterForm(v)}
          onSaveChapter={builder.handleSaveChapter}
          onResetChapterForm={builder.resetChapterForm}
          onAddChapter={builder.handleAddChapter}
          onEditChapter={builder.handleEditChapter}
          onDeleteChapter={builder.handleDeleteChapter}
          onAddLesson={builder.handleAddLesson}
          onEditLesson={builder.handleEditLesson}
          onDeleteLesson={builder.handleDeleteLesson}
          onAddQuiz={builder.handleAddQuiz}
          onEditQuiz={builder.handleEditQuiz}
          onDeleteQuiz={builder.handleDeleteQuiz}
          onAddQuestion={builder.handleAddQuestion}
          onEditQuestion={builder.handleEditQuestion}
          onDeleteQuestion={builder.handleDeleteQuestion}
        />

        {builder.showLessonForm && (
          <LessonFormModal
            lessonForm={builder.lessonForm}
            editingLessonId={builder.editingLessonId}
            onChange={(v) => builder.setLessonForm(v)}
            onSave={builder.handleSaveLesson}
            onCancel={builder.resetLessonForm}
          />
        )}

        {builder.showQuizForm && (
          <QuizFormModal
            quizForm={builder.quizForm}
            editingQuizId={builder.editingQuizId}
            onChange={(v) => builder.setQuizForm(v)}
            onSave={builder.handleSaveQuiz}
            onCancel={builder.resetQuizForm}
          />
        )}

        {builder.showQuestionForm && (
          <QuestionFormModal
            questionForm={builder.questionForm}
            editingQuestionId={builder.editingQuestionId}
            onChange={(v) => builder.setQuestionForm(v)}
            onSave={builder.handleSaveQuestion}
            onCancel={builder.resetQuestionForm}
            onAddOption={builder.addOption}
            onUpdateOption={builder.updateOption}
            onRemoveOption={builder.removeOption}
          />
        )}

        <div className="course-form-actions mt-4">
          <button className="course-btn-outline" onClick={() => navigate("/instructor/courses")}>
            <i className="bi bi-arrow-left me-2"></i>Quay lại
          </button>
          <button className="course-btn-primary ms-auto" onClick={handleCompleteDraft} disabled={saving}>
            {saving ? (
              <><span className="spinner-border spinner-border-sm me-2"></span>Đang lưu...</>
            ) : (
              <><i className="bi bi-check-lg me-2"></i>Hoàn thành</>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ==================== EDIT EXISTING COURSE MODE ====================
  if (editor.loading) {
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

  const courseStatus = editor.course?.status;
  const isPublished = courseStatus === "PUBLISHED";
  const isApproved = courseStatus === "APPROVED";
  const isPending = courseStatus === "PENDING";
  const isRejected = courseStatus === "REJECTED";

  // Chỉ hiển thị nút "Gửi duyệt" nếu course đang ở REJECTED (cần duyệt lại)
  // Course mới tạo đã ở PENDING, không cần gửi duyệt thêm
  const canSubmitReview = isRejected;

  const handleSubmitReview = async () => {
    try {
      setSaving(true);
      await submitForReview(editor.course.id);
      toast.success("Đã gửi khóa học chờ duyệt.");
      editor.refetch?.();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    } finally {
      setSaving(false);
    }
  };

  const statusLabels = {
    PENDING: { label: "Chờ duyệt", color: "#ffc107", icon: "bi-clock-history" },
    APPROVED: { label: "Đã duyệt", color: "#0d6efd", icon: "bi-check-circle" },
    REJECTED: { label: "Bị từ chối", color: "#dc3545", icon: "bi-x-circle" },
    PUBLISHED: { label: "Đã đăng", color: "#198754", icon: "bi-globe" },
    HIDDEN: { label: "Đã ẩn", color: "#6f42c1", icon: "bi-eye-slash" },
  };

  return (
    <div className="instructor-courses-page">
      <div className="courses-header">
        <div>
          <h2>Chỉnh sửa khóa học</h2>
          <p className="text-muted">{editor.course?.title}</p>
        </div>
        {courseStatus && (
          <span
            className="course-status-badge"
            style={{
              backgroundColor: (statusLabels[courseStatus]?.color || "#6c757d") + "20",
              color: statusLabels[courseStatus]?.color || "#6c757d",
              border: `1px solid ${(statusLabels[courseStatus]?.color || "#6c757d")}40`,
            }}
          >
            <i className={`bi ${statusLabels[courseStatus]?.icon || "bi-question"} me-1`}></i>
            {statusLabels[courseStatus]?.label || courseStatus}
          </span>
        )}
      </div>

      <form onSubmit={editor.handleSaveCourse}>
        <CourseInfoForm
          formData={editor.formData}
          errors={editor.errors}
          categories={editor.categories}
          thumbnailPreview={editor.thumbnailPreview}
          onCourseChange={editor.handleCourseChange}
          onThumbnailChange={editor.handleThumbnailChange}
        />

        <CurriculumBuilder
          curriculum={builder.curriculum}
          showChapterForm={builder.showChapterForm}
          chapterForm={builder.chapterForm}
          editingChapterId={builder.editingChapterId}
          onChapterFormChange={(v) => builder.setChapterForm(v)}
          onSaveChapter={builder.handleSaveChapter}
          onResetChapterForm={builder.resetChapterForm}
          onAddChapter={builder.handleAddChapter}
          onEditChapter={builder.handleEditChapter}
          onDeleteChapter={builder.handleDeleteChapter}
          onAddLesson={builder.handleAddLesson}
          onEditLesson={builder.handleEditLesson}
          onDeleteLesson={builder.handleDeleteLesson}
          onAddQuiz={builder.handleAddQuiz}
          onEditQuiz={builder.handleEditQuiz}
          onDeleteQuiz={builder.handleDeleteQuiz}
          onAddQuestion={builder.handleAddQuestion}
          onEditQuestion={builder.handleEditQuestion}
          onDeleteQuestion={builder.handleDeleteQuestion}
        />

        {builder.showLessonForm && (
          <LessonFormModal
            lessonForm={builder.lessonForm}
            editingLessonId={builder.editingLessonId}
            onChange={(v) => builder.setLessonForm(v)}
            onSave={builder.handleSaveLesson}
            onCancel={builder.resetLessonForm}
          />
        )}

        {builder.showQuizForm && (
          <QuizFormModal
            quizForm={builder.quizForm}
            editingQuizId={builder.editingQuizId}
            onChange={(v) => builder.setQuizForm(v)}
            onSave={builder.handleSaveQuiz}
            onCancel={builder.resetQuizForm}
          />
        )}

        {builder.showQuestionForm && (
          <QuestionFormModal
            questionForm={builder.questionForm}
            editingQuestionId={builder.editingQuestionId}
            onChange={(v) => builder.setQuestionForm(v)}
            onSave={builder.handleSaveQuestion}
            onCancel={builder.resetQuestionForm}
            onAddOption={builder.addOption}
            onUpdateOption={builder.updateOption}
            onRemoveOption={builder.removeOption}
          />
        )}

        {/* Footer actions */}
        <div className="course-form-actions mt-4">
          <button type="button" className="course-btn-outline" onClick={() => navigate("/instructor/courses")}>
            <i className="bi bi-arrow-left me-2"></i>Quay về danh sách
          </button>

          <div className="ms-auto d-flex align-items-center gap-2">
            {/* Nút "Gửi duyệt" - chỉ hiển thị khi course bị từ chối */}
            {canSubmitReview && (
              <button
                type="button"
                className="course-btn-warning"
                onClick={handleSubmitReview}
                disabled={saving}
              >
                {saving ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Đang gửi...</>
                ) : (
                  <><i className="bi bi-send me-2"></i>Gửi duyệt lại</>
                )}
              </button>
            )}

            {/* Nút "Lưu thay đổi" - luôn hiển thị */}
            <button type="submit" className="course-btn-primary" disabled={editor.saving}>
              {editor.saving ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Đang lưu...</>
              ) : (
                <><i className="bi bi-check-lg me-2"></i>Lưu thay đổi</>
              )}
            </button>
          </div>
        </div>

        {/* Ghi chú trạng thái */}
        {isPublished && (
          <div className="course-form-note mt-3">
            <i className="bi bi-info-circle me-2"></i>
            Khóa học đã được xuất bản. Chỉnh sửa sẽ được lưu trực tiếp, không cần gửi duyệt lại.
          </div>
        )}
        {isApproved && (
          <div className="course-form-note mt-3">
            <i className="bi bi-info-circle me-2"></i>
            Khóa học đã được duyệt. Bạn cần nhấn "Đăng khóa học" ở trang danh sách để xuất bản.
          </div>
        )}
      </form>
    </div>
  );
}

export default InstructorCourseEditPage;
