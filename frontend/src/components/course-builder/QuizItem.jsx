import QuestionItem from "./QuestionItem";

export default function QuizItem({
  quiz,
  index,
  lessonId,
  onEdit,
  onDelete,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
}) {
  return (
    <div className="quiz-node mb-2 p-2 border rounded bg-light">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <strong>Bài tập {index + 1}: {quiz.title}</strong>
          {quiz.time_limit_minutes && (
            <span className="badge bg-info ms-2">{quiz.time_limit_minutes} phút</span>
          )}
          <span className="badge bg-warning ms-1">Đạt: {quiz.passing_score}</span>
        </div>
        <div className="quiz-actions">
          <button type="button" className="btn btn-sm btn-outline-primary me-1" onClick={() => onEdit(quiz)}>
            <i className="bi bi-pencil"></i>
          </button>
          <button type="button" className="btn btn-sm btn-outline-danger me-1" onClick={() => onDelete(quiz.id)}>
            <i className="bi bi-trash"></i>
          </button>
          <button type="button" className="btn btn-sm btn-outline-success" onClick={() => onAddQuestion(quiz.id)}>
            <i className="bi bi-plus-circle me-1"></i>Câu hỏi
          </button>
        </div>
      </div>

      <div className="quiz-questions ms-3 mt-2">
        {(quiz.questions || []).length === 0 ? (
          <p className="text-muted small mb-0">Chưa có câu hỏi nào.</p>
        ) : (
          quiz.questions.map((question, qnIdx) => (
            <QuestionItem
              key={question.id}
              question={question}
              index={qnIdx}
              quizId={quiz.id}
              onEdit={(question) => onEditQuestion(quiz.id, question)}
              onDelete={onDeleteQuestion}
            />
          ))
        )}
      </div>
    </div>
  );
}
