import CurriculumTree from "./CurriculumTree";
import ChapterFormModal from "./ChapterFormModal";

export default function CurriculumBuilder({
  curriculum,
  // Chapter modal
  showChapterForm,
  chapterForm,
  editingChapterId,
  onChapterFormChange,
  onSaveChapter,
  onResetChapterForm,
  // Curriculum tree callbacks
  onEditChapter,
  onDeleteChapter,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onAddQuiz,
  onEditQuiz,
  onDeleteQuiz,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  // Add chapter
  onAddChapter,
}) {
  return (
    <div className="course-form-card">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="course-form-section-title mb-0">Xây dựng nội dung</h4>
        <button className="course-btn-primary btn-sm" onClick={onAddChapter}>
          <i className="bi bi-plus-lg me-1"></i>Thêm chương
        </button>
      </div>

      {showChapterForm && (
        <ChapterFormModal
          chapterForm={chapterForm}
          editingChapterId={editingChapterId}
          onChange={onChapterFormChange}
          onSave={onSaveChapter}
          onCancel={onResetChapterForm}
        />
      )}

      <CurriculumTree
        curriculum={curriculum}
        onEditChapter={onEditChapter}
        onDeleteChapter={onDeleteChapter}
        onAddLesson={onAddLesson}
        onEditLesson={onEditLesson}
        onDeleteLesson={onDeleteLesson}
        onAddQuiz={onAddQuiz}
        onEditQuiz={onEditQuiz}
        onDeleteQuiz={onDeleteQuiz}
        onAddQuestion={onAddQuestion}
        onEditQuestion={onEditQuestion}
        onDeleteQuestion={onDeleteQuestion}
      />
    </div>
  );
}
