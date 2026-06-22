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
import ConfirmModal from "../../components/common/ConfirmModal";
import { updateAdminCourse } from "../../services/courseService";

function AdminCourseEditPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const editor = useCourseEditor(courseId);
  const builder = useCurriculumBuilder(courseId, false);

  const [saving, setSaving] = useState(false);

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!editor.validateCourse()) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.append("title", editor.formData.title.trim());
      form.append("description", editor.formData.description.trim());
      form.append("price", editor.formData.price);
      if (editor.formData.category) form.append("category", editor.formData.category);
      if (editor.formData.preview_video_url) form.append("preview_video_url", editor.formData.preview_video_url.trim());
      if (editor.thumbnail) form.append("thumbnail", editor.thumbnail);
      await updateAdminCourse(courseId, form);
      toast.success("Cập nhật khóa học thành công!");
      editor.refetch?.();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    } finally {
      setSaving(false);
    }
  };

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

  const statusLabels = {
    DRAFT: { label: "Bản nháp", color: "#6c757d", icon: "bi-pencil" },
    PUBLISHED: { label: "Đã đăng", color: "#198754", icon: "bi-globe" },
    HIDDEN: { label: "Đã ẩn", color: "#6f42c1", icon: "bi-eye-slash" },
    ARCHIVED: { label: "Đã lưu trữ", color: "#dc3545", icon: "bi-archive" },
  };

  const courseStatus = editor.course?.status;

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

      <form onSubmit={handleSaveCourse}>
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

        <ConfirmModal
          show={builder.confirmModal.show}
          title={builder.confirmModal.title}
          message={builder.confirmModal.message}
          variant={builder.confirmModal.variant}
          confirmLabel="Xác nhận"
          cancelLabel="Hủy"
          onConfirm={() => {
            builder.confirmModal.onConfirm?.();
            builder.hideConfirm();
          }}
          onCancel={builder.hideConfirm}
        />

        <div className="course-form-actions mt-4">
          <button type="button" className="course-btn-outline" onClick={() => navigate("/admin/courses")}>
            <i className="bi bi-arrow-left me-2"></i>Quay về danh sách
          </button>
          <button type="submit" className="course-btn-primary ms-auto" disabled={saving}>
            {saving ? (
              <><span className="spinner-border spinner-border-sm me-2"></span>Đang lưu...</>
            ) : (
              <><i className="bi bi-check-lg me-2"></i>Lưu thay đổi</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminCourseEditPage;
