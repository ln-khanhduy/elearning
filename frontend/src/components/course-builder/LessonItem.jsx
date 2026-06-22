import QuizItem from "./QuizItem";

export default function LessonItem({
  lesson,
  index,
  chapterId,
  onEdit,
  onDelete,
  onAddQuiz,
  onEditQuiz,
  onDeleteQuiz,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
}) {
  return (
    <div className="lesson-node mb-2 p-2 border rounded">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <strong>Bài {index + 1}: {lesson.title}</strong>
          <span className="badge bg-secondary ms-2">
            {lesson.content_type === "VIDEO" ? "Video" : "Tài liệu"}
          </span>
        </div>
        <div className="lesson-actions">
          <button type="button" className="btn btn-sm btn-outline-primary me-1" onClick={() => onEdit(lesson)}>
            <i className="bi bi-pencil"></i>
          </button>
          <button type="button" className="btn btn-sm btn-outline-danger me-1" onClick={() => onDelete(lesson.id)}>
            <i className="bi bi-trash"></i>
          </button>
          <button type="button" className="btn btn-sm btn-outline-success" onClick={() => onAddQuiz(lesson.id)}>
            <i className="bi bi-plus-circle me-1"></i>Bài tập
          </button>
        </div>
      </div>

      <div className="lesson-quizzes ms-3 mt-2">
        {(lesson.quizzes || []).length === 0 ? (
          <p className="text-muted small mb-0">Chưa có bài tập nào.</p>
        ) : (
          lesson.quizzes.map((quiz, qIdx) => (
            <QuizItem
              key={quiz.id}
              quiz={quiz}
              index={qIdx}
              lessonId={lesson.id}
              onEdit={(quiz) => onEditQuiz(lesson.id, quiz)}
              onDelete={onDeleteQuiz}
              onAddQuestion={onAddQuestion}
              onEditQuestion={onEditQuestion}
              onDeleteQuestion={onDeleteQuestion}
            />
          ))
        )}
      </div>
    </div>
  );
}
