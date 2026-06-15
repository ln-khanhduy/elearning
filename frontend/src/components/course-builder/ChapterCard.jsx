import LessonItem from "./LessonItem";

export default function ChapterCard({
  chapter,
  index,
  onEdit,
  onDelete,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onAddQuiz,
  onEditQuiz,
  onDeleteQuiz,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
}) {
  return (
    <div className="chapter-node mb-3 border rounded">
      <div className="chapter-header d-flex justify-content-between align-items-center p-3 bg-light">
        <div>
          <strong>Chương {index + 1}: {chapter.title}</strong>
          {chapter.description && (
            <small className="d-block text-muted">{chapter.description}</small>
          )}
        </div>
        <div className="chapter-actions">
          <button className="btn btn-sm btn-outline-primary me-1" onClick={() => onEdit(chapter)}>
            <i className="bi bi-pencil"></i>
          </button>
          <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(chapter.id)}>
            <i className="bi bi-trash"></i>
          </button>
        </div>
      </div>

      <div className="chapter-lessons p-3">
        {(chapter.lessons || []).length === 0 ? (
          <p className="text-muted small mb-2">Chưa có bài học nào.</p>
        ) : (
          chapter.lessons.map((lesson, lIdx) => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              index={lIdx}
              chapterId={chapter.id}
              onEdit={(lesson) => onEditLesson(chapter.id, lesson)}
              onDelete={onDeleteLesson}
              onAddQuiz={onAddQuiz}
              onEditQuiz={onEditQuiz}
              onDeleteQuiz={onDeleteQuiz}
              onAddQuestion={onAddQuestion}
              onEditQuestion={onEditQuestion}
              onDeleteQuestion={onDeleteQuestion}
            />
          ))
        )}

        <button className="course-btn-outline btn-sm mt-2" onClick={() => onAddLesson(chapter.id)}>
          <i className="bi bi-plus-lg me-1"></i>Thêm bài học
        </button>
      </div>
    </div>
  );
}
